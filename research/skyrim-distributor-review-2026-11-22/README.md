# Skyrim distributors: five manual project references for Athena

Reviewed November 22, 2026 UTC. These links help you find the official source for
each project and keep the distributor workflows distinct. This is not an
installation recommendation, tested runtime matrix, or source of download rights.
No binaries, code, provider responses, or owner data are included.

## Add the five references

Download [manual-followed-projects.json](manual-followed-projects.json) from this
repository. Open [Athena Projects](https://herbertofury.github.io/Athena/#projects),
choose **Import backup**, select the JSON, review the five proposed entries, and
choose **Import reviewed projects**. Find them under **Following**. Cancel leaves
the workspace untouched. Re-importing identical entries changes nothing; an ID
that conflicts with a local edit is refused rather than overwritten.

This file does not load at launch and is not part of the public runtime bundle.
**Following** means local project reference only. There is no platform follow,
creator-account action, release monitoring, notification, or install.

| Manual project reference | Separate source and attribution | What to verify in a disposable profile |
| --- | --- | --- |
| [Spell Perk Item Distributor (SPID)](https://www.nexusmods.com/skyrimspecialedition/mods/36869) | [Source repository](https://github.com/powerof3/Spell-Perk-Item-Distributor), [pinned project link](https://github.com/powerof3/Spell-Perk-Item-Distributor/blob/105725c1318c7740b406c34ae7225e3973a7398e/README.md), operated by [powerof3](https://github.com/powerof3) | Keep actor rule matching separate from item keyword assignment. |
| [Keyword Item Distributor (KID)](https://www.nexusmods.com/skyrimspecialedition/mods/55728) | [Source repository](https://github.com/powerof3/Keyword-Item-Distributor), [pinned project link](https://github.com/powerof3/Keyword-Item-Distributor/blob/99adaaa1d8cefe320524802b57e91723f66b1c7c/README.md), operated by [powerof3](https://github.com/powerof3) | Check item keyword filters and conditional assignments with original test input. |
| [Base Object Swapper (BOS)](https://www.nexusmods.com/skyrimspecialedition/mods/60805) | [Source repository](https://github.com/powerof3/BaseObjectSwapper), [pinned project link](https://github.com/powerof3/BaseObjectSwapper/blob/c0b9c093aa6260fd9b68beddea411db97f585ea2/README.md), operated by [powerof3](https://github.com/powerof3) | Distinguish substitutions and competing rules from the identity of the original object. |
| [Seasons of Skyrim SKSE](https://www.nexusmods.com/skyrimspecialedition/mods/62861) | [Source repository](https://github.com/powerof3/SeasonsOfSkyrim), [pinned project link](https://github.com/powerof3/SeasonsOfSkyrim/blob/89837a27849c97a9f91d01f2911d14b49bef2662/README.md), operated by [powerof3](https://github.com/powerof3) | Check model, distant geometry (LOD), and snow substitutions independently. |
| [FormList Manipulator (FLM)](https://www.nexusmods.com/skyrimspecialedition/mods/74037) | [Source repository](https://github.com/MaskedRPGFan/FormList-Manipulator), [official repository homepage record](https://api.github.com/repos/MaskedRPGFan/FormList-Manipulator), operated by [MaskedRPGFan](https://github.com/MaskedRPGFan) | Check config-driven list changes. Optional coordination with KID is not a universal requirement. |

The source operator label identifies the public GitHub repository account, not
a legal identity, claim of exclusive authorship, or match to a Nexus account.
Each Nexus ID is explicitly linked by the respective source documentation or
repository homepage. The entries point only to the linked project pages, not
to files or selected releases. Do not substitute a VR link for the listed
project, infer supported game versions, or read a repository link as permission
to copy or redistribute its contents. The checks are suggestions, not results
from running any of these mods.
