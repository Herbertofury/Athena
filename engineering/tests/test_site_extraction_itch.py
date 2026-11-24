"""Synthetic defensive tests; actual source replay has a separate receipt."""
from pathlib import Path
import sys
import unittest
LAB=Path(__file__).resolve().parents[1]/'experiments'/'site-extraction-lab'
sys.path.insert(0,str(LAB))
from itch import extract_itch
from extractors import ExtractionError, receipt


def fixture(extra='',body='<p>Synthetic body<img src="https://cdn.example/a.gif?secret=x"></p>',devlog=False):
    header='<section class="post_header"><h1>Synthetic update</h1><div class="post_meta"><span title="2024-01-01 01:02:03">date</span> by <a href="https://sample.itch.io">Author</a></div></section>' if devlog else '<h1 class="game_title">Synthetic project</h1>'
    content=('<section class="post_body">'+body+'</section>') if devlog else ('<div class="formatted_description">'+body+'</div>')
    return {'url':'https://sample.itch.io/project'+('/devlog/12/update' if devlog else ''),'meta':['<meta property="og:image" content="https://cdn.example/cover.png">'],'html':[{'html':header+content+'<div class="game_info_panel_widget"><table><tr><td>Author</td><td><a href="https://sample.itch.io">Author</a></td></tr></table></div><ul class="user_tools"><a class="follow_user_btn" data-user_id="7"></a><a data-game_id="9"></a></ul>'+extra}]}


class ItchSyntheticTests(unittest.TestCase):
    def test_comment_body_and_avatar_excluded(self):
        r=extract_itch(fixture('<div class="community_post"><div class="post_body">Comment<img src="https://cdn.example/comment.png"></div><img class="avatar" src="https://cdn.example/commenter.png"></div>',devlog=True))
        self.assertEqual(r['identity']['devlogId'],12)
        self.assertNotIn('Comment',r['body']['text'])
        self.assertIsNone(r['people'][0]['avatar'])
        self.assertEqual(r['people'][0]['id'],7)
        self.assertEqual(r['identity']['projectId'],9)

    def test_missing_body_does_not_promote_cover(self):
        c=fixture();c['html'][0]['html']=c['html'][0]['html'].replace('<div class="formatted_description"><p>Synthetic body<img src="https://cdn.example/a.gif?secret=x"></p></div>','')
        r=extract_itch(c)
        self.assertIsNone(r['body'])
        self.assertIsNone(r['people'][0]['avatar'])

    def test_ambiguous_body_and_tools_rejected(self):
        for html in ['<div class="formatted_description">Duplicate</div>','<ul class="user_tools"></ul>']:
            with self.assertRaises(ExtractionError): extract_itch(fixture(html))

    def test_unrelated_dom_id_not_used(self):
        self.assertEqual(extract_itch(fixture('<div id="user_3283662" data-game_id="10"></div>'))['identity']['projectId'],9)

    def test_profile_join_required(self):
        with self.assertRaises(ExtractionError):
            extract_itch(fixture(),{'url':'https://itch.io/profile/sample'}, {'url':'https://other.itch.io'})

    def test_unsafe_and_query_urls_sanitized(self):
        r=receipt(extract_itch(fixture(body='<p>Synthetic<img src="javascript:evil"><img src="https://cdn.example/a.gif?key=secret"></p>')))
        self.assertIsNone(r['body']['media'][0]['src'])
        self.assertTrue(r['body']['media'][0]['referenceRejected'])
        self.assertEqual(r['body']['media'][1]['src'],'https://cdn.example/a.gif')
        self.assertNotIn('secret',str(r))
        self.assertNotIn('Synthetic body',str(r))

    def test_metadata_files_never_transfers(self):
        r=extract_itch(fixture('<div class="upload_list_widget"><div class="upload"><strong class="name">Synthetic.zip</strong><span class="file_size">1 MB</span></div></div>'))
        self.assertFalse(r['files'][0]['downloadVerified'])
        self.assertEqual(r['files'][0]['scope'],'current_project_metadata')

    def test_multiple_authors_not_collapsed(self):
        c=fixture();c['html'][0]['html']=c['html'][0]['html'].replace('<td>Author</td>','<td>Authors</td>').replace('>Author</a></td>','>Author</a><a href="https://second.itch.io">Second</a></td>')
        r=extract_itch(c)
        self.assertEqual(len(r['people']),2)
        self.assertTrue(all(p['id'] is None for p in r['people']))

    def test_wrong_origin_and_routes(self):
        for url in ['https://evil.example/project','https://sample.itch.io/project/purchase','https://sample.itch.io/login']:
            c=fixture();c['url']=url
            with self.assertRaises(ExtractionError): extract_itch(c)

if __name__=='__main__': unittest.main()
