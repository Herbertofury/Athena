"""Run from pack root: python3 -B -m unittest discover -s tests -v."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import copy
import json
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'labs' / 'bi-workshop'))
import lab

class TransformTests(unittest.TestCase):
    def reject(self, key, value):
        row = lab.raw_fixture()[0]
        row[key] = value
        valid, rejected = lab.transform([row])
        self.assertEqual(valid, [])
        self.assertEqual(len(rejected), 1)
        self.assertTrue(rejected[0]['reason'])
    def test_fixture_totals(self):
        rows, errors = lab.transform(lab.raw_fixture())
        self.assertEqual((len(rows),len(errors),lab.total(rows)),(6,1,16000))
        self.assertEqual(errors[0]['row_index'],6)
        self.assertIn('quantity',errors[0]['reason'])
    def test_rejection_preserves_f7_raw_record(self):
        raw=lab.raw_fixture(); _,errors=lab.transform(raw)
        self.assertEqual(errors[0]['raw_record'],raw[6])
        self.assertEqual(errors[0]['raw_record']['id'],'F7')
        self.assertEqual(errors[0]['raw_record']['quantity'],'many')
        self.assertIsNot(errors[0]['raw_record'],raw[6])
    def test_rejection_snapshot_independent_of_input(self):
        raw=lab.raw_fixture(); _,errors=lab.transform(raw)
        raw[6]['quantity']='4'
        self.assertEqual(errors[0]['raw_record']['quantity'],'many')
    def test_rejection_edit_does_not_change_input(self):
        raw=lab.raw_fixture(); _,errors=lab.transform(raw)
        errors[0]['raw_record']['quantity']='4'
        self.assertEqual(raw[6]['quantity'],'many')
    def test_rejection_unsupported_objects_not_serialized(self):
        class NotSerializable:
            def __repr__(self): raise AssertionError('must not stringify input objects')
        row=lab.raw_fixture()[6]; row['quantity']=NotSerializable()
        for candidate in (row,NotSerializable(),{'id':'F7'},dict(lab.raw_fixture()[6],extra='x')):
            with self.subTest(candidate_type=type(candidate).__name__):
                valid,errors=lab.transform([candidate])
                self.assertEqual(valid,[])
                self.assertNotIn('raw_record',errors[0])
                json.dumps(errors)
    def test_rejection_raw_evidence_size_boundary(self):
        for length,preserved in ((256,True),(257,False)):
            with self.subTest(length=length):
                row=lab.raw_fixture()[6]; row['quantity']='x'*length
                valid,errors=lab.transform([row])
                self.assertEqual(valid,[])
                self.assertEqual('raw_record' in errors[0],preserved)
    def test_rejection_evidence_does_not_normalize(self):
        row=lab.raw_fixture()[6]; row['region']=' NORTH '
        _,errors=lab.transform([row])
        self.assertEqual(errors[0]['raw_record']['region'],' NORTH ')
    def test_region_canonicalization(self):
        self.assertEqual([r['region'] for r in lab.facts()],['North','North','South','South','North','South'])
    def test_cents_exact(self):
        self.assertEqual([r['amount_cents'] for r in lab.facts()],[2000,3000,1000,6000,2000,2000])
        self.assertTrue(all(type(r['amount_cents']) is int for r in lab.facts()))
    def test_nonlist(self):
        with self.assertRaises(ValueError): lab.transform(tuple(lab.raw_fixture()))
    def test_nonmapping(self):
        self.assertEqual(len(lab.transform([None,[],True])[1]),3)
    def test_missing_field(self):
        row=lab.raw_fixture()[0]; del row['region']
        self.assertEqual(len(lab.transform([row])[1]),1)
    def test_extra_field(self): self.reject('extra','unexpected')
    def test_bool_quantity(self): self.reject('quantity', True)
    def test_integer_quantity(self): self.reject('quantity', 2)
    def test_fraction_quantity(self): self.reject('quantity', '1.5')
    def test_negative_quantity(self): self.reject('quantity', '-1')
    def test_zero_quantity(self): self.reject('quantity', '0')
    def test_scientific_quantity(self): self.reject('quantity', '1e3')
    def test_unicode_quantity(self): self.reject('quantity', '٢')
    def test_whitespace_quantity(self): self.reject('quantity', ' 2')
    def test_oversized_quantity(self): self.reject('quantity', '9'*10)
    def test_decimal_price(self): self.reject('unit_cents','10.00')
    def test_unknown_region(self): self.reject('region','West')
    def test_unknown_product(self): self.reject('product','P99')
    def test_bad_id(self): self.reject('id','F0')
    def test_duplicate_id(self):
        a=lab.raw_fixture()[0]
        valid,errors=lab.transform([a,a])
        self.assertEqual(len(valid),1); self.assertIn('duplicate',errors[0]['reason'])
    def test_invalid_id_reserved(self):
        a=lab.raw_fixture()[0]; b=dict(a); a['quantity']='many'
        valid,errors=lab.transform([a,b])
        self.assertEqual(valid,[]); self.assertIn('duplicate',errors[1]['reason'])
    def test_no_mutation(self):
        raw=lab.raw_fixture(); saved=copy.deepcopy(raw); lab.transform(raw)
        self.assertEqual(raw,saved)
    def test_empty(self): self.assertEqual(lab.transform([]),([],[]))

class DateTests(unittest.TestCase):
    def test_full_year(self):
        c=lab.calendar_2026(); result=lab.calendar_check(c)
        self.assertEqual((len(c),c[0],c[-1]),(365,'2026-01-01','2026-12-31'))
        self.assertTrue(result['valid_full_year']); self.assertTrue(result['contiguous'])
    def test_single_missing(self):
        c=lab.calendar_2026(); c.remove('2026-01-02'); r=lab.calendar_check(c)
        self.assertEqual(r['missing'],['2026-01-02']); self.assertFalse(r['contiguous'])
    def test_contiguous_not_complete(self):
        r=lab.calendar_check(lab.calendar_2026()[:59])
        self.assertTrue(r['contiguous']); self.assertFalse(r['valid_full_year']); self.assertEqual(len(r['missing']),306)
    def test_duplicate_calendar(self):
        with self.assertRaises(ValueError): lab.calendar_check(lab.calendar_2026()+['2026-01-01'])
    def test_outside_year(self):
        r=lab.calendar_check(lab.calendar_2026()+['2027-01-01'])
        self.assertEqual(r['extra'],['2027-01-01']); self.assertFalse(r['valid_full_year'])
    def test_unsorted_calendar(self): self.assertTrue(lab.calendar_check(list(reversed(lab.calendar_2026())))['valid_full_year'])
    def test_empty_calendar(self):
        r=lab.calendar_check([]); self.assertFalse(r['contiguous']); self.assertEqual(len(r['missing']),365)
    def test_calendar_exact_list(self):
        with self.assertRaises(ValueError): lab.calendar_check(tuple(lab.calendar_2026()))
    def test_time_rejected(self):
        with self.assertRaises(ValueError): lab.iso_day('2026-01-01T00:00:00')
    def test_nonpadded_rejected(self):
        with self.assertRaises(ValueError): lab.iso_day('2026-1-1')
    def test_invalid_day_rejected(self):
        with self.assertRaises(ValueError): lab.iso_day('2026-02-29')
    def test_date_object_rejected(self):
        with self.assertRaises(ValueError): lab.iso_day(lab.date(2026,1,1))
    def test_transform_wrong_year(self):
        r=lab.raw_fixture()[0]; r['date']='2025-12-31'
        self.assertEqual(lab.transform([r])[0],[])
    def test_months(self):
        self.assertEqual([lab.month_total(lab.facts(),m) for m in (1,2,3)],[6000,10000,None])
    def test_invalid_months(self):
        for value in (0,13,True,1.0,'1'):
            with self.subTest(value=value), self.assertRaises(ValueError): lab.month_total(lab.facts(),value)
    def test_ytd_inclusive_boundaries(self):
        self.assertEqual([lab.ytd(lab.facts(),d) for d in ('2026-01-01','2026-01-02','2026-01-31','2026-02-01','2026-02-02','2026-12-31')],[2000,6000,6000,14000,16000,16000])
    def test_ytd_wrong_year(self):
        with self.assertRaises(ValueError): lab.ytd(lab.facts(),'2025-12-31')
    def test_ytd_empty(self): self.assertIsNone(lab.ytd([],'2026-01-01'))

class ModelTests(unittest.TestCase):
    def check(self,rows=None,products=None,regions=None,days=None):
        return lab.validate_model(lab.facts() if rows is None else rows,list(lab.PRODUCTS) if products is None else products,list(lab.REGIONS) if regions is None else regions,lab.calendar_2026() if days is None else days)
    def test_valid(self): self.assertEqual(self.check()['dates'],365)
    def test_duplicate_product(self):
        with self.assertRaisesRegex(ValueError,'duplicate product'): self.check(products=list(lab.PRODUCTS)*2)
    def test_duplicate_region(self):
        with self.assertRaises(ValueError): self.check(regions=['North','South','North'])
    def test_orphan_product(self):
        with self.assertRaisesRegex(ValueError,'orphan'): self.check(products=list(lab.PRODUCTS)[1:])
    def test_orphan_region(self):
        with self.assertRaisesRegex(ValueError,'orphan'): self.check(regions=['North'])
    def test_incomplete_dates(self):
        with self.assertRaises(ValueError): self.check(days=lab.calendar_2026()[:59])
    def test_duplicate_fact(self):
        with self.assertRaises(ValueError): self.check(rows=lab.facts()+[lab.facts()[0]])
    def test_bad_arithmetic(self):
        r=lab.facts(); r[0]['amount_cents']=2001
        with self.assertRaisesRegex(ValueError,'arithmetic'): self.check(rows=r)
    def test_boolean_amount(self):
        r=lab.facts(); r[0]['amount_cents']=True
        with self.assertRaises(ValueError): self.check(rows=r)
    def test_float_amount(self):
        r=lab.facts(); r[0]['amount_cents']=2000.0
        with self.assertRaises(ValueError): self.check(rows=r)
    def test_product_schema(self):
        with self.assertRaises(ValueError): self.check(products=[{'product':'P1'}])
    def test_empty_facts_valid_model(self): self.assertEqual(self.check(rows=[])['facts'],0)

class FilterTests(unittest.TestCase):
    def test_total(self): self.assertEqual(lab.total(lab.facts()),16000)
    def test_empty_not_zero(self): self.assertIsNone(lab.total([]))
    def test_region_totals(self):
        self.assertEqual([lab.total(lab.select(lab.facts(),{'region':{r}})) for r in lab.REGIONS],[7000,9000])
    def test_category_totals(self):
        self.assertEqual([lab.total(lab.select(lab.facts(),{'category':{c}})) for c in ('Supply','Hardware','Service')],[3000,9000,4000])
    def test_cross_column_intersection(self): self.assertEqual(lab.total(lab.select(lab.facts(),{'region':{'North'},'category':{'Hardware'}})),3000)
    def test_same_column_union(self): self.assertEqual(lab.total(lab.select(lab.facts(),{'region':{'North','South'}})),16000)
    def test_empty_set(self): self.assertIsNone(lab.total(lab.select(lab.facts(),{'region':set()})))
    def test_unknown_value_empty(self): self.assertEqual(lab.select(lab.facts(),{'region':{'West'}}),[])
    def test_filter_case_sensitive(self): self.assertEqual(lab.select(lab.facts(),{'region':{'north'}}),[])
    def test_bad_column(self):
        with self.assertRaises(ValueError): lab.select(lab.facts(),{'sql':{'x'}})
    def test_bad_filter_types(self):
        for f in ([],{'region':['North']},{'region':{1}},{'region':'North'}):
            with self.subTest(f=f), self.assertRaises(ValueError): lab.select(lab.facts(),f)
    def test_replace_retains_other_column(self):
        f={'region':{'North'},'category':{'Hardware'}}
        new=lab.change_filter(f,'region',{'South'})
        self.assertEqual(lab.total(lab.select(lab.facts(),new)),6000)
        self.assertEqual(f['region'],{'North'})
    def test_keep_intersection(self):
        f=lab.change_filter({'region':{'North'}},'region',{'South'},True)
        self.assertIsNone(lab.total(lab.select(lab.facts(),f)))
    def test_keep_new_column(self): self.assertEqual(lab.change_filter({},'region',{'North'},True),{'region':{'North'}})
    def test_keep_exact_bool(self):
        with self.assertRaises(ValueError): lab.change_filter({},'region',{'North'},1)
    def test_select_no_alias_mutation(self):
        rows=lab.facts(); chosen=lab.select(rows); chosen[0]['amount_cents']=7
        self.assertEqual(rows[0]['amount_cents'],2000)

class ReportRefreshAccessTests(unittest.TestCase):
    def test_ratio_reduced(self): self.assertEqual(lab.ratio(4000,6000),{'numerator':2,'denominator':3})
    def test_missing_does_not_hide_bad_ratio_type(self):
        with self.assertRaises(ValueError): lab.ratio(None,True)
    def test_zero_denominator(self): self.assertIsNone(lab.ratio(1,0))
    def test_missing_ratio(self): self.assertIsNone(lab.ratio(None,16000))
    def test_zero_numerator(self): self.assertEqual(lab.ratio(0,3),{'numerator':0,'denominator':1})
    def test_bool_ratio(self):
        with self.assertRaises(ValueError): lab.ratio(True,3)
    def test_report_missing(self): self.assertEqual(lab.report_check({'alt_text':' ','order':'','units':''}),['alt_text','order','units'])
    def test_report_declared(self): self.assertEqual(lab.report_check({'alt_text':'description','order':'declared','units':'cents'}),[])
    def test_report_bad_schema(self):
        with self.assertRaises(ValueError): lab.report_check({'alt_text':'x'})
    def test_report_exact_strings(self):
        with self.assertRaises(ValueError): lab.report_check({'alt_text':True,'order':'x','units':'x'})
    def test_import_online(self): self.assertEqual(lab.read_snapshot('import',True)['total_cents'],12000)
    def test_import_offline(self): self.assertEqual(lab.read_snapshot('import',False)['total_cents'],12000)
    def test_source_online(self): self.assertEqual(lab.read_snapshot('source_required',True)['total_cents'],16000)
    def test_source_outage(self):
        r=lab.read_snapshot('source_required',False); self.assertFalse(r['available']); self.assertIsNone(r['total_cents'])
    def test_invalid_snapshot(self):
        for args in [('Direct Lake',True),('import',1),(None,True)]:
            with self.subTest(args=args), self.assertRaises(ValueError): lab.read_snapshot(*args)
    def test_viewer_north(self): self.assertEqual(lab.hypothetical_access('Viewer',{'North'})['total_cents'],7000)
    def test_build_same_rows(self): self.assertEqual(lab.hypothetical_access('Viewer',{'North'},True),lab.hypothetical_access('Viewer',{'North'}))
    def test_elevated_hypothesis(self):
        for role in ('Member','Contributor','Admin'):
            with self.subTest(role=role): self.assertEqual(lab.hypothetical_access(role,{'North'})['total_cents'],16000)
    def test_union_roles(self): self.assertEqual(lab.hypothetical_access('Viewer',{'North','South'})['total_cents'],16000)
    def test_missing_viewer_denied(self): self.assertIn('denied',lab.hypothetical_access('Viewer',set())['decision'])
    def test_unknown_role(self):
        with self.assertRaises(ValueError): lab.hypothetical_access('Owner',{'North'})
    def test_bad_role_inputs(self):
        for regions,build in [(['North'],False),({'West'},False),({'North'},1),({True},False)]:
            with self.subTest(regions=regions,build=build), self.assertRaises(ValueError): lab.hypothetical_access('Viewer',regions,build)

class ReceiptCLITests(unittest.TestCase):
    def cli(self,*args):
        return subprocess.run([sys.executable,str(ROOT/'labs/bi-workshop/run_lab.py'),*args],capture_output=True,text=True,check=False)
    def test_every_receipt_serializable_deterministic(self):
        for command in lab.COMMANDS:
            with self.subTest(command=command):
                a=lab.receipt(command); b=lab.receipt(command)
                self.assertEqual(a,b); self.assertEqual(set(a),{'schema_version','exercise','scope','result'})
                self.assertEqual(json.loads(json.dumps(a)),a)
                self.assertIn('no Power BI',a['scope'])
    def test_receipt_fresh_objects(self):
        a=lab.receipt('transform'); a['result']['valid_rows'][0]['quantity']=99
        self.assertEqual(lab.receipt('transform')['result']['valid_rows'][0]['quantity'],2)
    def test_cli_all_commands(self):
        for command in lab.COMMANDS:
            with self.subTest(command=command):
                r=self.cli(command); self.assertEqual(r.returncode,0,r.stderr)
                self.assertEqual(json.loads(r.stdout),lab.receipt(command)); self.assertEqual(r.stderr,'')
    def test_cli_repeat_byte_identical(self): self.assertEqual(self.cli('capstone').stdout,self.cli('capstone').stdout)
    def test_cli_help(self):
        r=self.cli('--help'); self.assertEqual(r.returncode,0); self.assertIn('capstone',r.stdout)
    def test_cli_missing(self): self.assertEqual(self.cli().returncode,2)
    def test_cli_invalid(self): self.assertEqual(self.cli('unknown').returncode,2)
    def test_cli_paths_rejected(self): self.assertEqual(self.cli('/tmp/data.csv').returncode,2)
    def test_cli_extra_rejected(self): self.assertEqual(self.cli('model','--output','/tmp/x').returncode,2)
    def test_capstone_reconciles(self):
        r=lab.receipt('capstone')['result']; self.assertTrue(r['reconciles']); self.assertEqual(len(r['unexecuted_platform_tasks']),6)
    def test_dates_growth(self): self.assertEqual(lab.receipt('dates')['result']['growth'],{'numerator':2,'denominator':3})
    def test_context_contract(self):
        r=lab.receipt('context')['result']
        self.assertEqual(list(r.values()),[9000,3000,6000,None,2000,16000])
    def test_model_controlled_rejections(self): self.assertEqual(set(lab.receipt('model')['result']['controlled_rejections']),{'duplicate_key','orphan_fact'})
    def test_report_denominators(self):
        r=lab.receipt('report')['result']; self.assertEqual(r['hardware_all_percent'],56.25); self.assertEqual(r['hardware_selected_percent'],100)
    def test_unknown_receipt(self):
        with self.assertRaises(ValueError): lab.receipt('__import__')
    def test_cli_no_files_created(self):
        before={str(p.relative_to(ROOT)) for p in ROOT.rglob('*')}
        r=self.cli('transform'); self.assertEqual(r.returncode,0)
        self.assertEqual(before,{str(p.relative_to(ROOT)) for p in ROOT.rglob('*')})

if __name__ == '__main__': unittest.main()
