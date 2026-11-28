import importlib.util
from pathlib import Path
import io
import tempfile
import unittest
import zipfile

source = Path(__file__).with_name("verify_preservation.py")
spec = importlib.util.spec_from_file_location("preservation", source)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class PreservationProof(unittest.TestCase):
    def test_actual_retained_copy_restores_without_the_source_repo(self):
        result = checker.verify()
        self.assertEqual((result["restoredRefs"], result["restoredCommits"], result["sourcePathsVerified"]), (3, 10, 100))
        self.assertEqual(result["originalSourceZipFilesVerified"], 98)
        self.assertEqual(result["releaseAssetsVerified"] + len(result["missingReleaseAssets"]), 6)
        self.assertIs(result["retirementCertified"], False)

    def test_same_size_changed_artifact_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "fixture.bin"
            path.write_bytes(b"wrong bytes")
            with self.assertRaisesRegex(ValueError, "wrong checksum"):
                checker.read_pinned(path, 11, checker.digest(b"right bytes"))

    def test_archive_members_must_match_known_paths_without_extraction(self):
        for member in ("../escape", r"unsafe\entry", "/absolute", "C:/escape", "not-in-original"):
            with self.subTest(member=member):
                data = io.BytesIO()
                with zipfile.ZipFile(data, "w") as archive:
                    archive.writestr(member, b"never extract me")
                with self.assertRaises(ValueError):
                    checker.verify_source_zip(data.getvalue(), {})


if __name__ == "__main__":
    unittest.main()
