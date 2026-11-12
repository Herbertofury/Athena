"""Generated ZIP32 boundary tests; no extraction, deletion or external inputs."""
from dataclasses import replace
import hashlib
import io
import json
from pathlib import Path
import stat
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import zlib

LAB=Path(__file__).resolve().parents[1]/'experiments/zip-inspection-lab'
sys.path.insert(0,str(LAB))
import inspect_zip as r
import fixtures as f


class ZipInspectionTests(unittest.TestCase):
    def setUp(self):
        self.root=Path(tempfile.mkdtemp(prefix='athena-synthetic-zip-'));self.receipts=[]

    def tearDown(self):
        (self.root/'receipt.json').write_text(json.dumps({'test':self.id(),'results':self.receipts},indent=2)+'\n')

    def inspect(self,data,**kwargs):
        (self.root/(str(len(self.receipts))+'.zip')).write_bytes(data)
        result=r.inspect(data,**kwargs);self.receipts.append(result);return result

    def refused(self,data,code,**kwargs):
        result=self.inspect(data,**kwargs);self.assertFalse(result['complete']);self.assertEqual(result['error'],code);return result

    def test_valid_store_and_deflate_preserve_complete_hashes(self):
        for method in (0,8):
            body=bytes(range(256))*50;data=f.archive([('mods/a.bin',body,method)])
            result=self.inspect(data);self.assertTrue(result['complete']);self.assertEqual(result['entries'][0]['sha256'],hashlib.sha256(body).hexdigest())
            with zipfile.ZipFile(io.BytesIO(data)) as z:self.assertEqual(z.read('mods/a.bin'),body)

    def test_empty_archive_and_directory(self):
        self.assertTrue(self.inspect(f.archive([]))['complete'])
        result=self.inspect(f.archive([('mods/',b'',0),('mods/a',b'x',8)]))
        self.assertTrue(result['complete']);self.assertEqual([e['kind'] for e in result['entries']],['directory','file'])

    def test_empty_deflate_member(self):self.assertTrue(self.inspect(f.archive([('empty',b'',8)]))['complete'])

    def test_exact_output_limits(self):
        limit=r.Limits(member_bytes=16,total_bytes=32,chunk_bytes=4)
        result=self.inspect(f.archive([('a',b'x'*16,8),('b',b'y'*16,0)]),limits=limit)
        self.assertTrue(result['complete']);self.assertEqual(result['decoded_bytes_observed'],32);self.assertLessEqual(result['max_output_chunk'],4)

    def test_raw_archive_cap_precedes_metadata_parser(self):
        with patch.object(r,'inventory',side_effect=AssertionError('must not parse')):
            result=self.refused(b'x'*20,'archive_byte_budget',limits=r.Limits(archive_bytes=19))
        self.assertIsNone(result['archive_sha256'])

    def test_invalid_limits_and_mutable_input(self):
        for limits in (r.Limits(entries=True),r.Limits(member_bytes=0),r.Limits(chunk_bytes=32769)):
            with self.assertRaises(ValueError):r.inspect(b'',limits)
        with self.assertRaises(TypeError):r.inspect(bytearray())

    def test_entry_count_cap_before_zipfile_construction(self):
        data=f.archive([('a',b'',0),('b',b'',0)])
        with patch.object(r.zipfile,'ZipFile',side_effect=AssertionError('must not construct')):
            self.refused(data,'entry_budget',limits=r.Limits(entries=1))

    def test_dishonest_entry_count_does_not_hide_extra_record(self):
        data=f.archive([('a',b'',0),('b',b'',0)])
        for n in (0,1,3):
            altered=f.mutate(f.mutate(data,len(data)-14,'H',n),len(data)-12,'H',n)
            self.assertFalse(self.inspect(altered)['complete'])

    def test_duplicate_names_are_not_silently_selected(self):
        data=f.archive([('same',b'first',0),('same',b'second',0)])
        with zipfile.ZipFile(io.BytesIO(data)) as z:self.assertEqual(z.read('same'),b'second')
        self.refused(data,'duplicate_or_portable_name_collision')

    def test_case_and_canonical_equivalence_collisions(self):
        for a,b in [('File','file'),('caf\u00e9','cafe\u0301'),('Stra\u00dfe','STRASSE')]:
            with self.subTest(a=a):self.refused(f.archive([(a,b'1',0),(b,b'2',0)]),'duplicate_or_portable_name_collision')

    def test_file_directory_conflict_both_orders(self):
        for rows in [[('a',b'x',0),('a/b',b'y',0)],[('a/b',b'y',0),('a',b'x',0)]]:
            self.refused(f.archive(rows),'file_directory_conflict')

    def test_implicit_directory_can_have_explicit_record(self):
        self.assertTrue(self.inspect(f.archive([('a/b',b'x',0),('a/',b'',0)]))['complete'])

    def test_traversal_absolute_and_empty_components(self):
        for name in ('../x','a/../x','/root','a//b','./x'):
            with self.subTest(name=name):self.refused(f.single_raw(name=name.encode()),'relative_nonempty_components_required')

    def test_backslash_and_nul_names(self):
        for name in (b'..\\x',b'a\x00b'):self.refused(f.single_raw(name=name),'ambiguous_separator_or_nul')

    def test_reserved_devices_streams_controls_and_trailing_names(self):
        for name,code in [('CON.txt','reserved_device_name'),('CONIN$','reserved_device_name'),('CONOUT$','reserved_device_name'),('COM\u00b9.log','reserved_device_name'),('a:stream','reserved_or_control_character'),('a\n','reserved_or_control_character'),('a.','trailing_space_or_period'),('a ','trailing_space_or_period')]:
            with self.subTest(name=name):self.refused(f.single_raw(name=name.encode('utf-8'),flags=0x800),code)

    def test_name_and_depth_budgets(self):
        self.refused(f.single_raw(name=b'x'*513),'name_bytes')
        self.refused(f.single_raw(name=b'a/b/c'),'path_depth',limits=r.Limits(depth=2))

    def test_valid_utf8_and_cp437_names_remain_original(self):
        for name,flags,expected in [('caf\u00e9'.encode(),0x800,'caf\u00e9'),(b'caf\x82',0,'caf\u00e9')]:
            result=self.inspect(f.single_raw(name=name,flags=flags));self.assertTrue(result['complete']);self.assertEqual(result['entries'][0]['name'],expected)

    def test_invalid_utf8_name(self):self.refused(f.single_raw(name=b'\xff',flags=0x800),'invalid_name_encoding')

    def test_link_special_type_and_directory_payload(self):
        data=f.single_raw();offset=f.central_offset(data)
        for mode in (stat.S_IFLNK,stat.S_IFIFO,stat.S_IFSOCK):self.refused(f.mutate(data,offset+38,'I',(mode|0o777)<<16),'unsupported_member_type')
        self.refused(f.archive([('dir/',b'not-empty',0)]),'directory_payload')

    def test_unsupported_flags_methods_and_versions(self):
        for flags in (1,8,0x40):self.refused(f.single_raw(flags=flags),'unsupported_zip_feature')
        self.refused(f.single_raw(method=99),'unsupported_zip_feature')
        data=f.single_raw();self.refused(f.mutate(data,f.central_offset(data)+6,'H',45),'unsupported_zip_feature')

    def test_archive_comment_and_appended_bytes_are_explicitly_unsupported(self):
        self.refused(f.archive([('x',b'y',0)],comment=b'comment'),'unsupported_end_or_archive_comment')
        self.refused(f.single_raw()+b'trailing','unsupported_end_or_archive_comment')

    def test_prefix_central_overlap_and_multipart_are_refused(self):
        data=f.single_raw();offset=f.central_offset(data)
        self.refused(b'prefix'+data,'central_extent')
        self.refused(f.mutate(data,offset+42,'I',1),'noncontiguous_or_overlapping_local_records')
        self.refused(f.mutate(data,len(data)-18,'H',1),'multipart_or_count_disagreement')

    def test_local_name_and_metadata_disagreement(self):
        data=f.single_raw();self.refused(f.mutate(data,30,'B',ord('X')),'local_name_or_extent_disagreement')
        self.refused(f.mutate(data,18,'I',1),'local_central_disagreement')

    def test_central_and_local_extra_fields_refused(self):
        data=f.single_raw();self.refused(f.mutate(data,f.central_offset(data)+30,'H',1),'unsupported_extra_comment_or_disk')
        self.refused(f.mutate(data,28,'H',1),'unsupported_local_extra')

    def test_declared_member_and_total_budgets(self):
        self.refused(f.single_raw(body=b'x'*33),'declared_member_budget',limits=r.Limits(member_bytes=32,chunk_bytes=8))
        self.refused(f.archive([('a',b'x'*20,0),('b',b'y'*20,0)]),'declared_total_budget',limits=r.Limits(total_bytes=39))

    def test_forged_small_size_is_not_complete_library_read(self):
        body=b'A'*100;data=f.single_raw(body=body,declared=1,crc=zlib.crc32(b'A'))
        with zipfile.ZipFile(io.BytesIO(data)) as z:self.assertEqual(z.read('mod.bin'),b'A')
        result=self.refused(data,'actual_declared_size_disagreement');self.assertEqual(result['entries'][0]['observed_bytes'],100)

    def test_actual_output_budget_stops_with_one_sentinel_byte(self):
        data=f.single_raw(body=b'A'*1000000,declared=1,crc=zlib.crc32(b'A'))
        result=self.refused(data,'actual_member_budget',limits=r.Limits(member_bytes=32,total_bytes=100,chunk_bytes=7))
        self.assertEqual(result['decoded_bytes_observed'],33);self.assertLessEqual(result['max_output_chunk'],7)

    def test_actual_total_budget_uses_sentinel(self):
        result=self.refused(f.single_raw(body=b'X'*100,declared=1),'actual_total_budget',limits=r.Limits(member_bytes=64,total_bytes=17,chunk_bytes=8))
        self.assertEqual(result['decoded_bytes_observed'],18)

    def test_crc_failure_retains_verified_prefix_and_unattempted_suffix(self):
        data=f.archive([('a',b'first',0),('b',b'wrong',0),('c',b'later',0)])
        records=r.inventory(data,r.Limits());bad=f.mutate(data,records[1]['start'],'B',ord('X'))
        result=self.refused(bad,'crc_mismatch');self.assertEqual([e['status'] for e in result['entries']],['verified','failed','not_attempted'])

    def test_trailing_stream_failure_still_counts_returned_output(self):
        compressor=zlib.compressobj(wbits=-15);compressed=compressor.compress(b'abc')+compressor.flush()
        result=self.refused(f.single_raw(body=b'abc',compressed=compressed+b'!'),'trailing_compressed_bytes')
        self.assertEqual(result['decoded_bytes_observed'],3)
        self.assertEqual(result['entries'][0]['observed_bytes'],3)
        self.assertEqual(result['max_output_chunk'],3)

    def test_volume_label_and_too_low_version_are_not_ordinary_members(self):
        data=f.single_raw();offset=f.central_offset(data)
        self.refused(f.mutate(data,offset+38,'I',0x08),'unsupported_volume_label')
        self.refused(f.mutate(f.mutate(data,4,'H',0),offset+6,'H',0),'unsupported_zip_feature')
        directory=f.archive([('dir/',b'',0)]);offset=f.central_offset(directory)
        self.refused(f.mutate(f.mutate(directory,4,'H',10),offset+6,'H',10),'unsupported_zip_feature')

    def test_truncated_deflate_stream(self):
        compressor=zlib.compressobj(wbits=-15);compressed=compressor.compress(b'hello')+compressor.flush()
        self.refused(f.single_raw(body=b'hello',compressed=compressed[:-1]),'truncated_deflate_stream')

    def test_trailing_compressed_bytes_and_concatenated_stream_refused(self):
        compressor=zlib.compressobj(wbits=-15);compressed=compressor.compress(b'hello')+compressor.flush()
        for extra in (b'x',compressed):self.refused(f.single_raw(body=b'hello',compressed=compressed+extra),'trailing_compressed_bytes')

    def test_invalid_deflate_stream_has_explicit_partial_result(self):
        result=self.inspect(f.single_raw(compressed=b'\xff\xff\xff'));self.assertFalse(result['complete']);self.assertEqual(result['status'],'partial');self.assertEqual(result['entries'][0]['status'],'failed')

    def test_cancel_before_inventory_and_during_decode(self):
        data=f.single_raw(body=b'A'*20000)
        self.refused(data,'cancelled',cancel=lambda:True)
        calls=0
        def cancel():
            nonlocal calls
            calls+=1;return calls==4
        result=self.refused(data,'cancelled',cancel=cancel);self.assertEqual(result['status'],'partial');self.assertGreater(result['decoded_bytes_observed'],0)

    def test_nested_zip_is_opaque_and_not_recursed(self):
        inner=f.single_raw(body=b'inner');outer=f.archive([('nested.zip',inner,8)])
        result=self.inspect(outer);self.assertTrue(result['complete']);self.assertEqual(len(result['entries']),1);self.assertEqual(result['entries'][0]['sha256'],hashlib.sha256(inner).hexdigest())

    def test_inspection_does_not_write_files_or_mutate_input(self):
        data=f.single_raw();before=hashlib.sha256(data).hexdigest()
        with patch('builtins.open',side_effect=AssertionError('unexpected file access')):
            result=r.inspect(data)
        self.assertTrue(result['complete']);self.assertEqual(hashlib.sha256(data).hexdigest(),before)


if __name__=='__main__':unittest.main()
