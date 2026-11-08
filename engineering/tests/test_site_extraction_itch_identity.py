"""Generated offline identity joins, not live itch.io or media acceptance."""
from copy import deepcopy
import html
from pathlib import Path
import sys
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments' / 'site-extraction-lab'
sys.path.insert(0, str(LAB))
from itch import extract_itch, same_url
from extractors import ExtractionError
from test_site_extraction_itch import fixture


def profile_pair(profile_url='https://itch.io/profile/sample', link=None):
    if link is None:
        link = profile_url
    profile = {
        'url': profile_url,
        'headerHtml': '<div class="stat_header_widget"><div class="avatar" style="background-image:url(https://cdn.example/avatar.png)"></div></div>',
        'creatorLinkHtml': '<div class="user_data"><a href="https://sample.itch.io">Generated creator</a></div>',
        'followHtml': '<a href="https://itch.io/follow?user_id=7">Generated follow metadata</a>',
        'gameHtml': '<div class="game_cell" data-game_id="9"><a href="https://sample.itch.io/project">Generated project</a><div class="game_author"><a data-label="user:7">Generated author</a></div></div>',
    }
    creator = {'url': 'https://sample.itch.io',
               'headerHtml': '<a rel="me" href="' + html.escape(link, quote=True) + '">Generated profile</a>'}
    return profile, creator


class ItchIdentityTests(unittest.TestCase):
    def test_two_invalid_urls_never_establish_identity(self):
        invalid = [None, '', ' ', 7, False, {}, [], 'javascript:generated',
                   'data:text/plain,generated', 'file:///generated', '/relative',
                   'https://generated:invalid@itch.io/profile/sample',
                   'https://itch.io:bad/profile/sample', 'https://itch.io:65536/profile/sample',
                   'https://itch.io/pro\x00file/sample']
        for left in invalid:
            for right in invalid:
                with self.subTest(left=left, right=right):
                    self.assertIs(same_url(left, right), False)

    def test_invalid_and_valid_urls_do_not_match_in_either_order(self):
        good = 'https://itch.io/profile/sample'
        for invalid in [None, '', 'javascript:generated', '/relative']:
            self.assertIs(same_url(good, invalid), False)
            self.assertIs(same_url(invalid, good), False)

    def test_existing_safe_reference_normalization_is_unchanged(self):
        for left, right in [
            ('https://itch.io/profile/sample', 'https://itch.io/profile/sample/'),
            ('https://itch.io/profile/sample?generated=one', 'https://itch.io/profile/sample#generated'),
            ('http://example.test/path', 'http://example.test/path/'),
        ]:
            self.assertIs(same_url(left, right), True)
        self.assertIs(same_url('https://itch.io/profile/sample', 'https://itch.io/profile/other'), False)
        self.assertIs(same_url('https://sample.itch.io', 'https://other.itch.io'), False)

    def test_rejected_profile_and_rejected_link_cannot_join(self):
        for profile_url in ['javascript:generated-profile', 'data:text/plain,generated', None, '',
                            'https://generated:invalid@itch.io/profile/sample']:
            profile, creator = profile_pair(profile_url, 'javascript:generated-link')
            with self.subTest(profile_url=profile_url), self.assertRaisesRegex(ExtractionError, 'creator to community join'):
                extract_itch(fixture(), profile, creator)

    def test_invalid_link_does_not_hide_a_later_valid_reciprocal_link(self):
        profile, creator = profile_pair()
        creator['headerHtml'] = '<a rel="me" href="javascript:generated">Rejected</a>' + creator['headerHtml']
        capture = fixture()
        before = deepcopy((capture, profile, creator))
        record = extract_itch(capture, profile, creator)
        self.assertEqual(record['people'][0]['communityProfile'], profile['url'])
        self.assertEqual(record['people'][0]['avatar'], 'https://cdn.example/avatar.png')
        self.assertEqual(record['people'][0]['id'], 7)
        self.assertEqual(record['identity']['projectId'], 9)
        self.assertEqual((capture, profile, creator), before)

    def test_valid_forward_link_still_requires_reverse_link_and_matching_ids(self):
        for key, value in [
            ('creatorLinkHtml', '<div class="user_data"><a href="https://other.itch.io">Other</a></div>'),
            ('followHtml', '<a href="https://itch.io/follow?user_id=8">Other</a>'),
            ('gameHtml', '<div class="game_cell" data-game_id="10"><a href="https://sample.itch.io/project">Other</a><div class="game_author"><a data-label="user:7">Author</a></div></div>'),
        ]:
            profile, creator = profile_pair()
            profile[key] = value
            with self.subTest(field=key), self.assertRaises(ExtractionError):
                extract_itch(fixture(), profile, creator)

    def test_profile_and_creator_are_still_optional_as_a_pair(self):
        capture = fixture()
        record = extract_itch(capture)
        self.assertNotIn('communityProfile', record['people'][0])
        self.assertIsNone(record['people'][0]['avatar'])
        profile, creator = profile_pair()
        with self.assertRaises(ExtractionError):
            extract_itch(capture, profile, None)
        with self.assertRaises(ExtractionError):
            extract_itch(capture, None, creator)


if __name__ == '__main__':
    unittest.main()
