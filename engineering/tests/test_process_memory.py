import importlib.util
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('process_memory_runner',ROOT/'experiments/process-memory-lab/run.py')
runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)
class ProcessMemoryTests(unittest.TestCase):
    def fixture(self):
        result={'schema_version':2,'lane':'baseline','capacity_mode':'exact','source_sha256':'source','source_bytes':123,'project_id':'TEST0001','harness_sha256':'harness','adapter_sha256':'adapter','observer_sha256':'observer','complete_output_equal':True,'repeated_records':8,'unknown':{'preserved':True}}
        for phase in ('before_input','before_records','retained','after_drop'):result[phase]={name:4096 for name in runner.FIELDS}
        return result
    def validate(self,data):return runner.validate(data,'baseline','exact',{'sha256':'source','bytes':123,'id':'TEST0001'},'harness','adapter','observer')
    def test_complete_receipt_and_unknown_fields_preserved(self):
        data=self.fixture();self.assertIs(self.validate(data),data);self.assertTrue(data['unknown']['preserved'])
    def test_identity_parity_and_count_fail_closed(self):
        for field,value in [('schema_version',True),('lane','candidate'),('capacity_mode','spare'),('source_sha256','wrong'),('source_bytes',True),('source_bytes',124),('project_id','other'),('harness_sha256','wrong'),('adapter_sha256','wrong'),('observer_sha256','wrong'),('schema_version',1),('complete_output_equal',1),('complete_output_equal',False),('repeated_records',7),('repeated_records',True)]:
            with self.subTest(field=field,value=value):
                data=self.fixture();data[field]=value
                with self.assertRaises(ValueError):self.validate(data)
    def test_memory_fields_are_complete_nonnegative_integer_values(self):
        for value in [None,-1,True,1.5]:
            data=self.fixture();data['retained']['rollup_pss_bytes']=value
            with self.assertRaises(ValueError):self.validate(data)
        for phase in ('before_input','before_records','retained','after_drop'):
            data=self.fixture();del data[phase]
            with self.assertRaises(ValueError):self.validate(data)
        data=self.fixture();data['retained']['rollup_rss_bytes']=0
        with self.assertRaises(ValueError):self.validate(data)
    def test_shared_decoder_rejects_duplicate_and_nonfinite_wire_values(self):
        for text in ['{"lane":"baseline","lane":"candidate"}','{"value":NaN}','{"value":1e9999}']:
            with self.assertRaises(ValueError):runner.decoder.decode_receipt(text)
