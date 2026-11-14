import json,unittest
from capsule import pack
from assess import assess
class Assess(unittest.TestCase):
 def test_duplicate_coordinates_and_nondefault_visuals(self):
  rows=[{'assetId':'PRIVATE','scope':'ui','x':1400,'y':800,'opacity':.5,'zIndex':20,'future':'SECRET'}, {'assetId':'PRIVATE','scope':'sticker','pinTargetKey':'PRIVATE_SELECTOR','anchor':'mc'}]
  result=assess(pack({'ff-scrapbook-layout':json.dumps(rows)}));f=result['findings']
  for k in ['duplicate_asset_instances','source_and_target_geometry_required','anchor_identity_and_geometry_required','nonneutral_opacity','stacking_order_requires_mapping','transform_origin_requires_mapping','unknown_instance_fields']:self.assertEqual(f[k],1)
  self.assertNotIn('PRIVATE',json.dumps(result));self.assertNotIn('SECRET',json.dumps(result));self.assertFalse(result['native_conversion_ready'])
 def test_malformed_retained(self):
  result=assess(pack({'ff-world-layout':'{unclosed','ff-visual-quality':'ultra'}));self.assertEqual(result['findings']['malformed_original_json'],1);self.assertTrue(result['original_values_preserved'])
 def test_invalid_shapes(self):
  for v in [None,{},'text',list(range(10001))]:
   self.assertEqual(assess(pack({'ff-scrapbook-layout':json.dumps(v)}))['findings']['invalid_or_unbounded_scrapbook'],1)
 def test_neutral_numeric_and_boolean_distinction(self):
  rows=[{'assetId':'a','scope':'ui','opacity':1.0,'visible':True,'gravity':False},{'assetId':'b','scope':'ui','opacity':True,'visible':1}]
  f=assess(pack({'ff-scrapbook-layout':json.dumps(rows)}))['findings'];self.assertEqual(f['nonneutral_opacity'],1);self.assertEqual(f['nonneutral_visible'],1)
if __name__=='__main__':unittest.main()
