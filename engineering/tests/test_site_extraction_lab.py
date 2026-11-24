"""SYNTHETIC fixtures: regression contracts, never real-source acceptance."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest

LAB = Path(__file__).resolve().parents[1] / "experiments" / "site-extraction-lab"
spec = importlib.util.spec_from_file_location("site_extraction_candidates", LAB / "extractors.py")
E = importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)


def encoded(value):
    return json.dumps(value).encode()


def synthetic_modrinth():
    return {"project": encoded({"id":"p", "team":"t", "title":"SYNTHETIC", "body":"before ![x](https://img.example/a.png) after", "icon_url":"https://img.example/cover.png", "gallery":[{"ordering":3,"url":"https://img.example/three.png"},{"ordering":1,"url":"https://img.example/one.png"}]}),
            "members":encoded([{"team_id":"t","role":"Maintainer","user":{"id":"other","username":"Other","avatar_url":"https://img.example/other.png"}}, {"team_id":"t","role":"Project Lead","user":{"id":"author","username":"Author","avatar_url":"https://img.example/avatar.png"}}]),
            "versions":encoded([{"id":"v","project_id":"p","author_id":"author","files":[{"id":"f","filename":"mod.jar","url":"https://cdn.example/file.jar?token=SECRET","hashes":{"sha1":"abc"},"size":12}]}]),
            "uploader":encoded({"id":"author","username":"Author","avatar_url":"https://img.example/avatar.png"})}


def synthetic_sims(creator="7"):
    return {"fragments": encoded({"jsonScripts":[
        {"text":json.dumps({"@context":"https://schema.org","@type":["SoftwareApplication","CreativeWork"],"author":{"name":"placeholder"},"description":"metadata summary"})},
        {"text":json.dumps({"id":"9","creator":creator,"game":"62","image":{"page":"https://img.example/cover.png"},"title":"SYNTHETIC"})}],
        "parts":[{"html":'<div id="dl7d368e9a"><figure id="duplicate" data-image="https://img.example/avatar.png"></figure><a data-link="7," href="/user7">Byline</a><div id="duplicate">99 followers</div></div>'},
                 {"html":'<div id="dl8d749e5a"><div data-sfp-paragraphy><p>SYNTHETIC full body</p></div></div>'},
                 {"html":'<div id="dl9d238e7a"><div data-sfp-paragraphy>Separate note <a href="/external?pass=SECRET">link</a></div></div>'}]}),
            "profile_receipt":encoded({"author":{"id":"7","profile":"https://site.example/user7","profileDisplayName":"Usagi test","profileAvatar":{"src":"https://img.example/profile.png","decoded":True,"width":600,"height":600}}})}


class SiteExtractionLabTests(unittest.TestCase):
    def test_mixed_order_and_unsafe_references(self):
        node = E.document('<div>one<img src="/a.png">two<a href="/p?key=SECRET">three<video poster="/poster.png"><source src="javascript:bad"></video></a>four<img src="data:image/png;base64,secret"></div>')
        body = E.ordered_body(node, "https://site.example")
        self.assertIn('key=SECRET', body["raw"])  # source preserved in memory
        self.assertEqual([e["type"] for e in body["events"]], ["text","media","text","link_start","text","media","media","link_end","text","media"])
        self.assertIsNone(body["events"][6]["src"])
        self.assertTrue(body["events"][-1]["referenceRejected"])

    def test_url_schemes_and_all_query_values_removed(self):
        for value in ["javascript:alert(1)","data:image/png,abc","file:///private/key","https://user:pass@site.example/a","https://site.example/a\nsecret"]:
            self.assertIsNone(E.public_url(value, "https://site.example"))
        self.assertEqual(E.public_url("/a?X-Amz-Signature=SECRET&v=ALSO_SECRET#fragment", "https://site.example"), "https://site.example/a")

    def test_duplicate_json_keys_rejected_recursively(self):
        with self.assertRaises(E.ExtractionError):
            E.json_loads('{"outer":{"id":1,"id":2}}')

    def test_modrinth_roles_uploader_and_avatar_are_separate(self):
        record = E.extract("modrinth", synthetic_modrinth(), "https://site.example")
        self.assertEqual(record["people"][-1]["id"], "author")
        self.assertEqual(record["people"][0]["projectRole"], "Maintainer")
        self.assertNotEqual(record["projectImage"], record["people"][-1]["avatar"])
        self.assertEqual([g["ordering"] for g in record["gallery"]], [1,3])
        self.assertFalse(record["body"]["projectionComplete"])
        self.assertNotIn("SECRET", json.dumps(E.receipt(record)))

    def test_join_mismatches_rejected(self):
        for key, field, wrong in [("uploader","id","wrong"),("project","team","wrong")]:
            value=synthetic_modrinth(); data=json.loads(value[key]);data[field]=wrong;value[key]=encoded(data)
            with self.subTest(key=key), self.assertRaises(E.ExtractionError):
                E.extract("modrinth", value)
        value=synthetic_modrinth();data=json.loads(value["versions"]);data[0]["project_id"]="wrong";value["versions"]=encoded(data)
        with self.assertRaises(E.ExtractionError): E.extract("modrinth", value)

    def test_duplicate_file_ids_rejected(self):
        value=synthetic_modrinth();data=json.loads(value["versions"]);data[0]["files"]*=2;value["versions"]=encoded(data)
        with self.assertRaises(E.ExtractionError): E.extract("modrinth", value)

    def test_missing_and_duplicate_primary_ids_fail(self):
        for missing in (None, "", "   ", False):
            value=synthetic_modrinth();project=json.loads(value["project"]);project["id"]=missing;value["project"]=encoded(project)
            with self.subTest(missing=missing), self.assertRaises(E.ExtractionError): E.extract("modrinth",value)
        value=synthetic_modrinth();versions=json.loads(value["versions"]);value["versions"]=encoded(versions*2)
        with self.assertRaises(E.ExtractionError): E.extract("modrinth",value)
        with self.assertRaises(E.ExtractionError): E.extract("subscribestar",{"fragments":encoded({"parts":[]})})
        value=synthetic_sims(None)
        with self.assertRaises(E.ExtractionError): E.extract("simsfinds",value)

    def test_markdown_projection_keeps_mixed_order_without_claiming_complete_parser(self):
        raw='SYNTHETIC A [link](https://site.example/p?token=SECRET) B ![image](https://img.example/a.png) C'
        body=E.markdown_body(raw)
        self.assertEqual(body["raw"],raw)
        self.assertEqual([e["type"] for e in body["events"]],["text","link_start","text","link_end","text","media","text"])
        self.assertFalse(body["projectionComplete"])
        self.assertNotIn("SECRET",json.dumps(E.body_receipt(body)))

    def test_pmc_wrong_profile_and_ambiguous_body_fail(self):
        item='<div id="resource_object"><div class="mini-profile"><a data-mid="7" href="/member/test/">SYNTHETIC</a></div><div id="resource_id">9</div><div id="author_id">7</div><div id="r-text-block">full body</div></div>'
        wrong='<a id="avatar" data-mid="8"><img src="/other.png"></a>'
        with self.assertRaises(E.ExtractionError): E.extract("pmc", {"item":item.encode(),"profile":wrong.encode()}, "https://site.example")
        correct=wrong.replace('data-mid="8"','data-mid="7"')
        with self.assertRaises(E.ExtractionError): E.extract("pmc", {"item":(item+'<div id="r-text-block">duplicate</div>').encode(),"profile":correct.encode()}, "https://site.example")

    def test_wordpress_summary_does_not_become_body_or_avatar(self):
        post={"id":1,"author":7,"excerpt":{"rendered":"SYNTHETIC teaser"},"featured_media":3,"_embedded":{"wp:featuredmedia":[{"id":3,"source_url":"https://img.example/cover.png"}]}}
        record=E.extract("wordpress", {"post":encoded(post)})
        self.assertIsNone(record["body"])
        self.assertIsNone(record["people"][0]["avatar"])
        self.assertTrue(E.receipt(record)["metadataSummaryPresent"])

    def test_wordpress_gate_and_wrong_embedded_author(self):
        post={"id":1,"author":7,"content":{"rendered":"SYNTHETIC protected placeholder","protected":True}}
        record=E.extract("wordpress", {"post":encoded(post)})
        self.assertIsNone(record["body"]);self.assertIn("protected_body",record["gates"])
        post["_embedded"]={"author":[{"id":8,"name":"Wrong"}]}
        with self.assertRaises(E.ExtractionError): E.extract("wordpress", {"post":encoded(post)})

    def test_wordpress_multi_post_response_requires_explicit_selection(self):
        with self.assertRaises(E.ExtractionError): E.extract("wordpress",{"post":encoded([{"id":1},{"id":2}])})

    def test_truncated_schema_never_substitutes_for_body(self):
        page=b'<div><script type="application/ld+json">{"@type":"SoftwareApplication","description":"TRUNCATED</script><div class="user-content"><p>SYNTHETIC selected body</p></div></div>'
        record=E.extract("modpub",{"page":page,"files":b'<div/>',"profile":b'<div/>'})
        self.assertEqual(record["body"]["text"],"SYNTHETIC selected body")
        self.assertIsNone(record["metadataSummary"])
        self.assertEqual(record["people"],[])

    def test_body_scope_excludes_adjacent_controls_and_preserves_utf8_whitespace(self):
        page='<div><h5>SYNTHETIC file header</h5><div class="user-content">é\n <p>本文</p> tail</div>Adjacent control text<button name="token" value="SECRET">Download control</button></div>'
        record=E.extract("modpub",{"page":page.encode(),"files":b'<div/>',"profile":b'<div/>'})
        self.assertEqual(record["body"]["text"],"é\n 本文 tail")
        self.assertNotIn("header",record["body"]["raw"])
        self.assertNotIn("control",record["body"]["raw"])
        self.assertNotIn("SECRET",json.dumps(E.receipt(record)))

    def test_rss_summary_identity_and_duplicate_guids(self):
        feed=b'<rss><channel><item><guid>https://site.example/?p=1</guid><description>SYNTHETIC teaser</description></item><item><guid>https://site.example/?p=2</guid></item></channel></rss>'
        records=E.extract("rss", {"feed":feed})
        self.assertIsNone(records[0]["body"])
        self.assertNotEqual(E.receipt(records)[0]["identity"]["id"],E.receipt(records)[1]["identity"]["id"])
        with self.assertRaises(E.ExtractionError): E.extract("rss", {"feed":feed.replace(b'?p=2',b'?p=1')})

    def test_rss_entities_rejected(self):
        with self.assertRaises(E.ExtractionError):
            E.extract("rss", {"feed":b'<!DOCTYPE rss [<!ENTITY x "SYNTHETIC">]><rss><channel/></rss>'})

    def test_dwemer_missing_file_id_is_preserved_and_gate_is_not_url(self):
        page='<script type="application/ld+json">{"@type":"CreativeWork","author":{"name":"Original"},"description":"metadata"}</script>'
        data={"page":page.encode(),"description":b'<div><a class="mod-author-link" href="/users/uploader">Uploader</a><div class="mod-detailed-desc">SYNTHETIC full body</div></div>',
              "files":b'<div class="file-item"><span class="file-name">SYNTHETIC.zip</span><div class="file-actions">Log in to download</div></div>',"images":b'<div/>',"changelog":b'<div>No changes</div>',
              "profile":b'<div><h2 class="profile-username">Uploader</h2><img class="profile-avatar-user" src="/uploader.png"></div>'}
        record=E.extract("dwemer",data,"https://site.example")
        self.assertEqual([p["role"] for p in record["people"]],["credited_original_author","site_uploader"])
        self.assertIsNone(record["files"][0]["id"]);self.assertIsNone(record["files"][0]["url"])
        self.assertEqual(record["files"][0]["gate"],"login_required")

    def test_modpub_scoped_title_disabled_file_and_schema_summary(self):
        data={"page":b'<div><script type="application/ld+json">{"@type":"SoftwareApplication","author":{"name":"Author"},"description":"SYNTHETIC summary"}</script><div class="user-content">SYNTHETIC full description</div></div>',
              "profile":b'<script type="application/ld+json">{"@type":"ProfilePage","mainEntity":{"name":"Author","image":"https://img.example/avatar.png"}}</script>',
              "files":b'<div class="gray-box"><h5 class="mb-0">SYNTHETIC.zip</h5><div><h5>Nested package contents</h5></div><button name="file_id" value="7" disabled>Download</button></div>'}
        record=E.extract("modpub",data)
        self.assertEqual(record["files"][0]["name"],"SYNTHETIC.zip")
        self.assertEqual(record["files"][0]["gate"],"disabled_control")
        self.assertNotEqual(record["metadataSummary"],record["body"]["text"])

    def test_sims_semantic_json_duplicate_dom_ids_and_separate_note(self):
        record=E.extract("simsfinds",synthetic_sims(),"https://site.example")
        self.assertEqual(record["people"][0]["id"],"7")
        self.assertNotEqual(record["people"][0]["avatar"],record["projectImage"])
        self.assertEqual(record["people"][0]["profileAvatarDimensionsReported"],[600,600])
        self.assertEqual(len(record["notes"]),1)
        self.assertNotIn("Separate note",record["body"]["text"])
        self.assertNotIn("SECRET",json.dumps(E.receipt(record)))

    def test_sims_wrong_byline_and_wrong_receipt_fail(self):
        with self.assertRaises(E.ExtractionError): E.extract("simsfinds",synthetic_sims("8"),"https://site.example")
        data=synthetic_sims();data["profile_receipt"]=encoded({"author":{"id":"8"}})
        with self.assertRaises(E.ExtractionError): E.extract("simsfinds",data,"https://site.example")

    def test_subscribestar_public_fragments_order_and_avatar_join(self):
        fragment={"postId":"7","parts":[{"html":['<a class="post-user" href="/author">SYNTHETIC Author</a>','<a class="post-avatar" href="/author"><img data-user-id="9" src="/avatar.png"></a>','<div class="post-content"><div class="trix-content">A<img src="/one.png">B<a href="/target?pass=SECRET">link</a>C<img src="/two.png"></div></div>','<div class="post-date"><a href="/posts/7">date</a></div>']}]}
        record=E.extract("subscribestar",{"fragments":encoded(fragment)},"https://site.example")
        self.assertEqual(len([e for e in record["body"]["events"] if e["type"]=="media"]),2)
        self.assertNotIn("SECRET",json.dumps(E.receipt(record)))
        fragment["parts"][0]["html"][1]=fragment["parts"][0]["html"][1].replace('href="/author"','href="/wrong"')
        with self.assertRaises(E.ExtractionError): E.extract("subscribestar",{"fragments":encoded(fragment)},"https://site.example")

    def test_receipt_excludes_full_prose_and_native_support(self):
        record=E.extract("modrinth",synthetic_modrinth())
        published=E.receipt(record)
        self.assertNotIn("before ![x]",json.dumps(published))
        self.assertFalse(published["fullSupportAccepted"])
        self.assertFalse(published["follow"]["nativeMutationTested"])

    def test_cli_failure_does_not_publish_private_paths(self):
        sys.path.insert(0,str(LAB))
        try:
            import replay
            with tempfile.TemporaryDirectory() as temp:
                manifest=Path(temp)/"synthetic-manifest.json"
                manifest.write_text(json.dumps([{"family":"modrinth","inputs":{"project":"/private/user/secret/missing.json"}}]))
                output=io.StringIO()
                with contextlib.redirect_stdout(output): code=replay.main(["--manifest",str(manifest)])
                self.assertEqual(code,1)
                self.assertNotIn("/private",output.getvalue());self.assertNotIn(temp,output.getvalue())
        finally:
            sys.path.remove(str(LAB))

    def test_cli_malformed_inputs_and_relative_manifest_paths(self):
        sys.path.insert(0,str(LAB))
        try:
            import replay
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp);manifest=root/"cases.json"
                for payload in ({"not":"a list"},[None],[{"family":"rss","inputs":{"feed":"bad.xml"}}]):
                    manifest.write_text(json.dumps(payload));(root/"bad.xml").write_text('<rss><broken>')
                    output=io.StringIO()
                    with contextlib.redirect_stdout(output): code=replay.main(["--manifest",str(manifest)])
                    self.assertEqual(code,1)
                    self.assertNotIn(temp,output.getvalue())
                    self.assertEqual(json.loads(output.getvalue())["cases"][0]["status"],"failed")
                (root/"feed.xml").write_text('<rss><channel><item><guid>synthetic-1</guid></item></channel></rss>')
                manifest.write_text(json.dumps([{"family":"rss","inputs":{"feed":"feed.xml"}}]))
                first=io.StringIO();second=io.StringIO()
                with contextlib.redirect_stdout(first): self.assertEqual(replay.main(["--manifest",str(manifest)]),0)
                with contextlib.redirect_stdout(second): self.assertEqual(replay.main(["--manifest",str(manifest)]),0)
                self.assertEqual(first.getvalue(),second.getvalue())
        finally:
            sys.path.remove(str(LAB))


if __name__ == "__main__":
    unittest.main()
