"""Stored actual-observation contract; no network and no raw third-party fixtures."""
import hashlib,json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1];LAB=ROOT/'experiments/peertube-video-lab'
class PeerTubeReceiptTests(unittest.TestCase):
 def setUp(self): self.r=json.loads((LAB/'public-validation-2026-11-11.json').read_text())
 def test_exact_capture_and_implementation(self):
  r=self.r;self.assertEqual(r['captureCount'],3);self.assertEqual(r['capturedBytes'],21083)
  self.assertEqual([x['bytes'] for x in r['captures']],[3169,17442,472]);self.assertTrue(all(x['status']==200 and x['complete'] for x in r['captures']))
  self.assertEqual([x['sha256'] for x in r['captures']],['0cd0dab99b8e8888b999cfc04e5b59bd5162516ba9f4ab1dc1ba3f20e398e97d','3a92d9c346f0ac26f6e586c0b3902cffe3c84372ba3a8fd76121fe4bf6ca5734','b7071738c08e2c76db066a08c35eddf2ba9bf24ad37d2434772ed2f0081fcc6a'])
  for p in [LAB/'videos.py',ROOT/'experiments/site-extraction-lab/extractors.py']:self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),r['implementationSha256'][p.name])
  self.assertEqual(r['upstreamContract']['infoVersion'],'8.3.0');self.assertEqual(r['instanceReportedVersion'],'8.3.2');self.assertIs(r['instanceSoftwareAuthenticated'],False)
 def test_actual_hls_and_caption_scope(self):
  a,b=self.r['replay']['observations'];self.assertEqual([a['state'],b['state']],['metadata_observed']*2)
  self.assertEqual(a['counts'],{'directFiles':0,'playlists':1,'representations':6,'thumbnails':5})
  self.assertEqual(a['textFields']['description']['bytes'],890);self.assertEqual(a['textFields']['truncatedDescription']['bytes'],255)
  self.assertEqual(a['textFields']['description']['sha256'],'cc50cd3378beb4af8d8f1927ca8d956bbfa655c25b096c55b1f2d9a496631490')
  self.assertEqual(a['textFields']['truncatedDescription']['sha256'],'68f3d0bebb704115cdae4d27191bbba96ecd70c7a128439bd4a09e1ddf59129e')
  self.assertEqual(a['descriptionContract'],'full_field_contract');self.assertEqual(b['observed'],1);self.assertEqual(b['countState'],'count_matches')
  self.assertTrue(all(x is False for x in self.r['replay']['acceptance'].values()));self.assertIs(self.r['networkUsedByNormalizer'],False)
 def test_receipt_excludes_source_prose_and_identifiers(self):
  text=json.dumps(self.r)
  for secret in ['https://','http://','magnet:','9db9f3f1-9b54-44ed-9e91-461d262d2205','ktDGTRNCF9dyrUGy97V7gx','publicEmail','displayName','trackerUrls','ownerAccount','original','parsed']:
   if secret!='original':self.assertNotIn(secret,text)
  def walk(o):
   if isinstance(o,dict):
    self.assertTrue(set(o).isdisjoint({'body','raw','value','record','original','parsed','url','fileUrl','captionPath','magnetUri'}))
    for x in o.values():walk(x)
   elif isinstance(o,list):
    for x in o:walk(x)
  walk(self.r)
if __name__=='__main__':unittest.main()
