import contextlib
import io
import json
import sqlite3
import unittest
import test_query as fixtures

q = fixtures.q

class ArtistFilterTests(unittest.TestCase):
    setUp = fixtures.ArchiveTests.setUp
    tearDown = fixtures.ArchiveTests.tearDown

    def add(self, table, artist, identity, label='fixture'):
        values=[]
        for name, kind, *_ in q.expected_columns(table):
            values.append(identity if name=='id' else artist if name=='artist_id' else label)
        with sqlite3.connect(self.db) as c:
            c.execute('INSERT INTO '+table+' VALUES('+','.join('?' for _ in values)+')',values)

    def test_all_artist_families_exact_case_prefix_punctuation_and_injection_text(self):
        families=[t for t in q.FIELDS if t!='history']
        artists=['Artist','Artist-suffix','artist',"x' OR 1=1 --%_",'']
        for table in families:
            for n,artist in enumerate(artists):self.add(table,artist,'row-'+str(n))
        before=self.db.read_bytes()
        for n,artist in enumerate(artists):
            receipt=q.inspect(self.db,families,artist_id=artist)
            self.assertEqual(receipt['counts'],dict.fromkeys(families,1))
            dest=self.root/('private-'+str(n)+'.json')
            q.inspect(self.db,families,artist_id=artist,private_export=True,destination=dest)
            rows=json.loads(dest.read_text())['tables']
            for table in families:
                self.assertEqual(len(rows[table]),1)
                self.assertEqual(rows[table][0]['artist_id'],artist)
        self.assertEqual(q.inspect(self.db,families,artist_id='absent')['counts'],dict.fromkeys(families,0))
        self.assertEqual(self.db.read_bytes(),before)

    def test_filter_requires_explicit_artist_tables_and_bounded_utf8(self):
        for tables in (None,[],['history'],['music_routes','history']):
            with self.assertRaises(q.Refusal):q.inspect(self.db,tables,artist_id='fixture')
        for value in (1,b'fixture','x'*4097,'界'*1366,'\ud800'):
            with self.assertRaises(q.Refusal):q.inspect(self.db,['music_routes'],artist_id=value)
        self.assertEqual(q.inspect(self.db,['music_routes'],artist_id='界'*1365)['counts'],{'music_routes':0})
        self.assertEqual(q.inspect(self.db,['music_routes'],artist_id='x'*4096)['counts'],{'music_routes':0})

    def test_filtered_limits_ignore_unselected_rows_but_enforce_selected_rows_and_values(self):
        self.add('music_routes','chosen','chosen-row')
        with sqlite3.connect(self.db) as c:
            for n in range(q.MAX_ROWS+1):
                c.execute('INSERT INTO music_routes VALUES(?,?,?,?,?,?,?,?,?)',('bulk-'+str(n),'other','x'*(q.MAX_VALUE+1),'','','','','',''))
        receipt=q.inspect(self.db,['music_routes'],artist_id='chosen',private_export=True,destination=self.root/'chosen.json')
        self.assertEqual(receipt['counts'],{'music_routes':1})
        with self.assertRaises(q.Refusal):q.inspect(self.db,['music_routes'],artist_id='other')
        with sqlite3.connect(self.db) as c:c.execute('UPDATE music_routes SET label=? WHERE artist_id=?',('x'*(q.MAX_VALUE+1),'chosen'))
        with self.assertRaises(q.Refusal):q.inspect(self.db,['music_routes'],artist_id='chosen',private_export=True,destination=self.root/'oversized.json')
        self.assertFalse((self.root/'oversized.json').exists())

    def test_cli_receipts_and_failures_never_echo_filter_paths_or_records(self):
        secret="PRIVATE_FILTER_'%_"
        self.add('music_routes',secret,'selected','PRIVATE_RECORD_VALUE')
        before={p.name:p.read_bytes() for p in self.root.iterdir()}
        for args,code in [(['--table','music_routes','--artist-id',secret],0),(['--table','history','--artist-id',secret],1),(['--artist-id',secret],1),(['--table','music_routes','--artist-id',secret*500],1)]:
            out=io.StringIO();err=io.StringIO()
            with contextlib.redirect_stdout(out),contextlib.redirect_stderr(err):
                self.assertEqual(q.main(['--source',str(self.db),*args]),code)
            text=out.getvalue()+err.getvalue()
            self.assertNotIn(secret,text);self.assertNotIn(str(self.db),text);self.assertNotIn('PRIVATE_RECORD_VALUE',text)
        self.assertEqual(before,{p.name:p.read_bytes() for p in self.root.iterdir()})

if __name__=='__main__':unittest.main()
