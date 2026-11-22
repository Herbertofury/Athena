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
when supplied. Broken or ambiguous inputs refuse review without rendering a
partial result. The structured evidence is available for manual inspection and
copy.

For a YouTube cue starting before one hour, **Open video at cue** opens a new
tab only when selected. It asks YouTube to start the full video at the start
of the cue, rounded down to the preceding whole second; it does not stop at a
range's end or verify playback. The review keeps the canonical source URL and
original millisecond timing unchanged. YouTube cues at one hour or later,
Bilibili videos and X posts retain the plain source link only. YouTube's
[sharing documentation](https://support.google.com/youtube/answer/57741?co=GENIE.Platform%3DDesktop&hl=en)
describes sharing from a start time, and [Google for Developers](https://developers.google.com/web/shows/lazyweb/2015/episode-9#supercharging_page_load)
publishes matching minute/second links. [Bilibili's documentation](https://player.bilibili.com/)
describes times for its embed player, not the plain source URL used here.

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
