import hashlib
import json
import os
from pathlib import Path
import subprocess
import stat
import sys
import tempfile
import unittest
from unittest.mock import patch

from measure import categories, measure, mount_id


class Fixture:
    def __init__(self, parent):
        self.root = parent/'private-root-marker'
        self.root.mkdir()
        source = self.root/'private-sources-marker'
        media = self.root/'private-media-marker'
        source.mkdir(); media.mkdir()
        self.normal = source/'plain-unique-marker'
        self.normal.write_bytes(b'x' * 7001)
        self.hardlink = media/'alias-marker'
        os.link(self.normal, self.hardlink)
        self.sparse = media/'sparse-marker'
        with self.sparse.open('wb') as out:
            out.seek(4*1024*1024-1);out.write(b'z')
        self.outside = parent/'private-outside-marker'
        self.outside.mkdir()
        self.foreign = self.outside/'must-not-count'
        self.foreign.write_bytes(b't' * 8193)
        (source/'out-of-root-dir-link').symlink_to(self.outside, target_is_directory=True)
        (source/'out-of-root-file-link').symlink_to(self.foreign)
        os.mkfifo(source/'fifo')

    def content_digests(self):
        values = []
        for path in (self.normal, self.sparse, self.foreign):
            with os.fdopen(os.open(path, os.O_RDONLY | os.O_NOATIME), 'rb') as source:
                values.append(hashlib.file_digest(source,'sha256').hexdigest())
        return values

    def before(self):
        paths = [self.root, self.normal, self.hardlink, self.sparse, self.outside, self.foreign,
                 self.normal.parent, self.sparse.parent, *(self.normal.parent/name for name in ("out-of-root-dir-link", "out-of-root-file-link", "fifo"))]
        return {p: tuple(os.lstat(p)) + (p.lstat().st_atime_ns,p.lstat().st_mtime_ns,p.lstat().st_ctime_ns) for p in paths}


@unittest.skipUnless(sys.platform == 'linux', 'Linux native observation only')
class MeasurementTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.fixture = Fixture(Path(self.tmp.name))
        self.labels = categories(['Source=private-sources-marker','Media=private-media-marker'])

    def test_real_sparse_links_logical_and_physical_against_stat(self):
        f = self.fixture
        before = f.before()
        content_before = f.content_digests()
        args=[sys.executable, str(Path(__file__).with_name('measure.py')), str(f.root), '--category', 'Source=private-sources-marker', '--category', 'Media=private-media-marker']
        process = subprocess.run(args, check=True, capture_output=True, text=True, timeout=7)
        after = f.before()
        self.assertEqual(after, before)
        self.assertEqual(f.content_digests(), content_before)
        self.assertNotIn('private-', process.stdout)
        result = json.loads(process.stdout)
        items = subprocess.check_output(['stat','--printf','%s %b %B %d %i\n',str(f.normal),str(f.hardlink),str(f.sparse)],text=True).splitlines()
        normal,alias,sparse = [tuple(map(int,item.split())) for item in items]
        self.assertEqual(normal, alias)
        self.assertNotEqual(sparse[-2:], normal[-2:])
        self.assertLess(sparse[1]*sparse[2], sparse[0])
        self.assertFalse(result['partial'])
        self.assertEqual(result['skipped'],{'links':2,'mounts':0,'special':1})
        self.assertEqual(result['totals'],{'logicalBytes':sum(row[0] for row in (normal,alias,sparse)),
            'allocatedBytes':sum(row[1]*row[2] for row in (normal,sparse)), 'files':3, 'physicalFiles':2})
        rows={row['name']:row for row in result['categories']}
        self.assertEqual(rows['Shared across categories']['allocatedBytes'],normal[1]*normal[2]); self.assertEqual(rows['Source']['allocatedBytes'],0)
        self.assertEqual(rows['Media']['allocatedBytes'],sparse[1]*sparse[2]); self.assertEqual(rows['Source']['logicalBytes'],normal[0]); self.assertEqual(rows['Media']['logicalBytes'],alias[0]+sparse[0])

    def test_entry_depth_and_deadline_never_look_complete(self):
        for limits,key in [((1,24,5),'entryLimit'), ((20000,0,5),'depthLimit'), ((20000,24,0),'deadline')]:
            with self.subTest(key=key):
                result = measure(str(self.fixture.root), self.labels, limits)
                self.assertTrue(result['partial']); self.assertGreater(result['stops'][key],0)
                self.assertLess(result['totals']['files'],3)

    def test_last_inflight_entry_cannot_hide_missed_deadline(self):
        root = Path(self.tmp.name)/'late-last-entry'
        root.mkdir()
        (root/'file').write_bytes(b'counted before timeout observation')
        clock = [0]
        def delayed_descriptor(fd):
            result = mount_id(fd)
            if stat.S_ISREG(os.fstat(fd).st_mode):
                clock[0] = 6
            return result
        with patch('measure.time.monotonic', side_effect=lambda: clock[0]), patch('measure.mount_id', side_effect=delayed_descriptor):
            result = measure(str(root), {})
        self.assertEqual(result['totals']['files'], 1)
        self.assertTrue(result['partial'])
        self.assertEqual(result['stops']['deadline'], 1)

    @unittest.skipIf(os.geteuid() == 0, 'permission fixture needs a non-root process')
    def test_inaccessible_child_is_a_gap_not_an_empty_root(self):
        root = Path(self.tmp.name)/'inaccessible-fixture'
        root.mkdir()
        child = root/'inaccessible'
        child.mkdir()
        (child/'undisclosed').write_bytes(b'never traverse this')
        child.chmod(0)
        try:
            result = measure(str(root), {})
            self.assertTrue(result['partial'])
            self.assertEqual(result['stops']['unreadable'], 1)
            self.assertEqual(result['totals']['files'], 0)
            self.assertNotIn('undisclosed', json.dumps(result))
        finally:
            child.chmod(0o700)

    def test_root_symlink_parent_alias_and_category_refused(self):
        alias = self.fixture.root.parent/'symlink'
        alias.symlink_to(self.fixture.root, target_is_directory=True)
        for root in (str(alias), str(alias/'private-media-marker'), '.', '/', str(self.fixture.root)+'/../private-root-marker'):
            with self.subTest(root=root), self.assertRaises((ValueError,OSError)):
                measure(root,self.labels)
        for bindings in (['Shared across categories=abc'], ['A=../hi'], ['A=dir','a=other'], ['A=dir','B=dir']):
            with self.subTest(bindings=bindings), self.assertRaises(ValueError): categories(bindings)

    def test_same_device_mount_identity_not_just_device(self):
        expected = self.fixture.normal.parent.stat().st_ino
        def alternate(fd):
            ident = mount_id(fd)
            return ident+1 if os.fstat(fd).st_ino == expected else ident
        with patch('measure.mount_id', new=alternate):
            result=measure(str(self.fixture.root),self.labels)
        self.assertEqual(result['skipped']['mounts'],1)
        self.assertEqual(result['totals']['files'],2)
        self.assertFalse(result['partial'])
