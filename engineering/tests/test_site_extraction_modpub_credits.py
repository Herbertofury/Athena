"""Synthetic ModPub header attribution cases; not full-provider acceptance."""
import importlib.util
import json
from pathlib import Path
import unittest

LAB=Path(__file__).resolve().parents[1]/'experiments'/'site-extraction-lab'
spec=importlib.util.spec_from_file_location('modpub_credit_candidates',LAB/'extractors.py')
E=importlib.util.module_from_spec(spec);spec.loader.exec_module(E)

def inputs(header='',body='SYNTHETIC body',author='Uploader',profile='Uploader'):
    schema=json.dumps({'@type':'SoftwareApplication','name':'Synthetic item','author':{'name':author},'url':'https://mod.pub/game/7-item'})
    page='<script type="application/ld+json">'+schema+'</script><main><div class="container container-fixed"><aside>'+header+'</aside><div class="user-content">'+body+'</div></div></main>'
    account=json.dumps({'@type':'ProfilePage','mainEntity':{'name':profile,'image':'https://pic.mod.pub/uploader.png','url':'https://mod.pub/@uploader'}})
    return {'page':page.encode(),'profile':('<script type="application/ld+json">'+account+'</script>').encode(),'files':b'<div class="gray-box"><h5 class="mb-0">Synthetic.zip</h5><button name="file_id" value="7" disabled>Download</button></div>'}

def credit(name):return '<span class="text-nowrap">Created by <span class="text-light">'+name+'</span></span>'

class ModPubCredits(unittest.TestCase):
    def test_creator_separate_from_uploader_and_avatar(self):
        r=E.extract('modpub',inputs(credit('Creator Team')),'https://mod.pub')
        self.assertEqual([p['role'] for p in r['people']],['site_author','credited_original_author'])
        self.assertEqual([p['name'] for p in r['people']],['Uploader','Creator Team'])
        self.assertEqual(r['people'][0]['avatar'],'https://pic.mod.pub/uploader.png')
        for key in ['id','username','profile','avatar']:self.assertIsNone(r['people'][1][key])
        self.assertEqual(r['files'][0]['gate'],'disabled_control');self.assertIsNone(r['files'][0]['url']);self.assertFalse(r['fullSupportAccepted'])

    def test_absent_credit_does_not_invent_original_author(self):
        r=E.extract('modpub',inputs(),'https://mod.pub')
        self.assertEqual(len(r['people']),1);self.assertEqual(r['people'][0]['role'],'site_author')

    def test_body_credit_lookalike_is_not_header_identity(self):
        spoof='<aside>'+credit('Body decoy')+'</aside>'
        r=E.extract('modpub',inputs(body=spoof),'https://mod.pub')
        self.assertEqual(len(r['people']),1);self.assertIn('Body decoy',r['body']['text'])

    def test_label_match_is_exact_not_created_by_similar_word(self):
        r=E.extract('modpub',inputs(credit('Decoy').replace('Created by ','Created bystander ')),'https://mod.pub')
        self.assertEqual(len(r['people']),1)

    def test_nested_body_main_cannot_supply_missing_header_credit(self):
        spoof='<main><div class="container"><aside>'+credit('Nested decoy')+'</aside></div></main>'
        r=E.extract('modpub',inputs(body=spoof),'https://mod.pub')
        self.assertEqual(len(r['people']),1);self.assertIn('Nested decoy',r['body']['text'])

    def test_nested_body_main_does_not_conflict_with_actual_header_credit(self):
        spoof='<main><div class="container"><aside>'+credit('Nested decoy')+'</aside></div></main>'
        r=E.extract('modpub',inputs(credit('Actual creator'),body=spoof),'https://mod.pub')
        self.assertEqual([p['name'] for p in r['people']],['Uploader','Actual creator'])
        self.assertIn('Nested decoy',r['body']['text'])

    def test_user_content_within_header_aside_cannot_supply_credit(self):
        for wrapper in ['<div class="user-content">{}</div>', '<section class="user-content extra"><div>{}</div></section>']:
            with self.subTest(wrapper=wrapper):
                decoy=wrapper.format(credit('Body decoy'))
                fixture=inputs(decoy)
                fixture['page']=fixture['page'].replace(b'<div class="user-content">SYNTHETIC body</div>',b'')
                r=E.extract('modpub',fixture,'https://mod.pub')
                self.assertEqual([p['role'] for p in r['people']],['site_author'])

    def test_user_content_within_header_aside_does_not_conflict_with_credit(self):
        decoy='<div class="user-content">'+credit('Body decoy')+'</div>'
        fixture=inputs(credit('Actual creator')+decoy)
        fixture['page']=fixture['page'].replace(b'<div class="user-content">SYNTHETIC body</div>',b'')
        r=E.extract('modpub',fixture,'https://mod.pub')
        self.assertEqual([p['name'] for p in r['people']],['Uploader','Actual creator'])

    def test_unicode_entities_and_plaintext_attribution(self):
        r=E.extract('modpub',inputs(credit(' Équipe &amp; <b>作者</b> ')),'https://mod.pub')
        self.assertEqual(r['people'][1]['name'],'Équipe & 作者');self.assertIsNone(r['people'][1]['profile'])

    def test_equal_display_names_keep_distinct_explicit_roles(self):
        r=E.extract('modpub',inputs(credit('Uploader')),'https://mod.pub')
        self.assertEqual(len(r['people']),2);self.assertEqual(r['people'][0]['name'],r['people'][1]['name']);self.assertIsNone(r['people'][1]['avatar'])

    def test_ambiguous_empty_or_malformed_credit_fails_closed(self):
        for header in [credit('One')+credit('Two'),credit(' '),'<span class="text-nowrap">Created by </span>','<span class="text-nowrap">Created by <span class="text-light">One</span><span class="text-light">Two</span></span>']:
            with self.subTest(header=header),self.assertRaises(E.ExtractionError):E.extract('modpub',inputs(header),'https://mod.pub')

    def test_existing_profile_mismatch_still_fails(self):
        with self.assertRaises(E.ExtractionError):E.extract('modpub',inputs(credit('Creator'),profile='Other'),'https://mod.pub')

if __name__=='__main__':unittest.main()
