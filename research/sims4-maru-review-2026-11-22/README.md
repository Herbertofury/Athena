# Maru's Sims 4 projects: four manual references

First reviewed November 22, 2026 UTC; Styled Look Creator added November 26. [Maru's CurseForge project](https://www.curseforge.com/sims4/mods/dynamic-cas-columns)
links to both public [marumaru SIMS MOD](https://www.patreon.com/cw/marumaruSIMSMOD)
tool posts. The [CC List Mover post](https://www.patreon.com/marumaruSIMSMOD/posts/cc-list-mover-174372555)
links back to that exact CurseForge project. These are direct links between
published project sources, not a claim about a legal identity or social account.

## Add to Athena yourself

Download [manual-followed-projects.json](manual-followed-projects.json) from this
repository. In [Athena Projects](https://herbertofury.github.io/Athena/#projects),
choose **Import backup**, select the JSON, review the proposed entries,
then choose **Import reviewed projects**. Find them under **Following**. Cancel
changes nothing. Reimporting identical entries is a no-op; a same-ID conflict
refuses the import rather than overwriting your work.

These are local references only. Import does not follow or sign in on a
platform, monitor changes, fetch release files, download mods, or install
anything. The JSON stays outside the default runtime.

## Public source receipt

- **[Dynamic CAS Companion](https://www.curseforge.com/sims4/mods/dynamic-cas-columns)**:
  CurseForge project **1720674**, listed under [maru](https://www.curseforge.com/members/maru/projects).
  The public [prior file page, 9701768](https://www.curseforge.com/sims4/mods/dynamic-cas-columns/files/9701768)
  showed an updated **Main File** link to [file 9746859](https://www.curseforge.com/sims4/mods/dynamic-cas-columns/files/9746859).
  Following that link opened the exact file metadata: `maru_DCC261122.zip`,
  upload date **Nov 22, 2026**, uploader **maru**, Sims 4 **1.129.39** listed,
  and no file changelog. The project/list views checked separately still showed
  the older Nov 19 file. Neither cached state nor the Nov 20 or Nov 16
  project-level features establishes what changed in 9746859. No runtime or
  speed claim is independently verified.
- **[CC List Mover](https://www.patreon.com/marumaruSIMSMOD/posts/cc-list-mover-174372555)**:
  standalone Windows utility. The author documents DCC's CC List as an input
  requirement for this workflow, preview of matched files, whole-package
  movement and restoration. A merged package can move unrelated items too;
  dependencies are not detected automatically. The author says successful
  import clears the temporary DCC list entries from the INI. This is an
  author description, not a verified file operation or a DCC dependency on Mover.
- **[CAS Tooltip Studio](https://www.patreon.com/marumaruSIMSMOD/posts/cas-tooltip-174022486)**:
  standalone Windows naming tool with separate output or backup-and-replace.
  Its public post says it can run without DCC. DCC uses it for the documented
  name-preparation workflow for certain search and tooltip features. This does
  not make the tool a requirement for running the base DCC mod.

For future testing, use original disposable samples: verify sibling items in a
merged package are disclosed and distinguish read-only review from a whole-file
move or mutation. Do not read these source links as proof of release
compatibility, download permissions, or authorization to change a real Mods folder.

## Styled Look Creator: the one-way outfit handoff

[Maru’s project](https://www.curseforge.com/sims4/mods/styled-look-creator) (1780050) lists
[release file 9746944](https://www.curseforge.com/sims4/mods/styled-look-creator/files/9746944),
`maru_StyledLookCreator261122.zip`, uploaded November 22 for Sims 4 1.129.39.
The file has no changelog. The separate description dated November 22 adds
out-of-slot outfit export such as Trendi. Its November 11 note describes optional
hair and makeup and warns that inapplicable sliders or custom content can be omitted.

The author says a Live Mode outfit becomes a `.package` under `CreatedLooks`, which
appears in CAS after a restart. Required CC must already be available to a recipient.
No test confirmed the package resource types, handling of missing CC, shared favorites
or bidirectional/live apply. The metadata import neither acquires nor runs a package.
If the previous three references are already present and unchanged, importing the new
file offers only the new fourth entry; a locally changed record still triggers the
existing conflict protection.

At a permitted isolated game-test checkpoint, capture one regular and one Trendi
look on a disposable Sim. Record the generated package names and hashes, compare
source category/items with CAS after restart, and compare one missing fixture item
in a duplicate test profile. Keep real saves and Mods folders untouched. Test favorite
sharing and bidirectional/live apply separately rather than inferring them from export.
