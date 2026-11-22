# Review mod cues from a video

In Media, open **Review mod cues from a video**. Paste a YouTube video or
Shorts, a Bilibili video, or an X post URL, and cues that you already
collected, one per line. For example:

```text
0:12..0:14 | visible | Name read from a title card
0:27.300 | spoken | Name stated by the narrator
1:08 | inferred | Visual resemblance only; compare against author material
```

Athena preserves supplied order, time points/ranges, literal cue text (apart from outer spaces), and the
declared evidence basis. The reviewer marks every cue unverified; especially
do not turn an inference into a mod match or download link. The clickable
source uses only the accepted provider identity, retaining Bilibili part
when supplied. A source link does not prove post media exists or seek
support. Broken or ambiguous inputs refuse review without rendering a partial
result. The structured evidence is available for manual inspection and copy.

This is a bounded session-only step toward reviewing previously collected
video evidence. It does not read frames, crawl channels, parse unannotated
transcripts, infer a mod identity, load a player, send notes, save any
workspace state, match a creator or fetch/download content.

## Sources and reuse

- [JuneYaooo/rea-video](https://github.com/JuneYaooo/rea-video) documents a
  shot/timeline breakdown with observed material kept apart from inferred
  analysis. Its [Apache 2.0 license](https://github.com/JuneYaooo/rea-video/blob/main/LICENSE)
  applies to that upstream repository, not automatically to input footage
  or other assets. No upstream software, model, sample footage or code was
  installed, copied or invoked.
- The [VIDEO.md documentation](https://videomd.github.io/videomd/) describes
  time-scoped observed and inferred evidence separately. This manual input is
  original and does **not** implement or accept the VIDEO.md format.
- The [requested X post](https://x.com/yxl44/status/2123710617098039594)
  returned HTTP 403 on review. No claim is made about its media, contents,
  author identity beyond the URL, or relationship to REA-Video.

Verify with `node --test tests/video-mod-evidence.test.cjs` and
`python scripts/build_engineering_workspaces.py --check`.
