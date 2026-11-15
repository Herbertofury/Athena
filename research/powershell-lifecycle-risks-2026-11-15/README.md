# PowerShell: support lifecycle and Windows package boundaries

[Research directory](../) · [Athena](../../README.md)

Reviewed **2026-11-15 UTC**, after checking Noxviola's active index and the existing Windows-utilities PowerShell baseline. This independent follow-up adds specific lifecycle, release and package caveats; it is not a catalog rewrite, installation, benchmark or claim that a release appeared this hour.

## Support status is not the same as an available download

Microsoft's lifecycle pages place **PowerShell 7.4 LTS and 7.5 beyond end of support by this review date**. The product table displays November 11, while the detailed lifecycle table uses November 10; preserve that date-display difference rather than guessing its cause. Both dates have passed. PowerShell 7.6 is the LTS line with support scheduled into November 2028. The product table's generic PowerShell “In Support” label does not establish support for every installed version. [Product lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/powershell).

The detailed lifecycle page still calls 7.6.6 current while **7.6.10** has an official release page. Treat prose examples as possibly stale. Support also depends on the underlying supported OS and the latest servicing update; external modules have their own lifecycles. Windows PowerShell 5.1 is a Windows component with a separate lifecycle, not an old PowerShell 7 package to remove. [Detailed support policy](https://learn.microsoft.com/en-us/powershell/scripting/install/powershell-support-lifecycle?view=powershell-7.6).

## Verified release, not locally tested

**PowerShell 7.6.10, released November 10, 2026**, reports improved MSIX installation detection, a warning for SHA-1 file catalogs, and correction of missing Test-Json errors with List output. Packaging changes include preventing an MSIX update while PowerShell 7 is running. These are upstream-reported fixes, not reproduced measurements or proof that every validation workflow is correct. A published artifact-hash list is not a local artifact verification. [Pinned release](https://github.com/PowerShell/PowerShell/releases/tag/v7.6.10).

## Windows deployment distinctions

PowerShell 7 installs beside Windows PowerShell 5.1, and some Windows modules still require 5.1 or compatibility handling. Microsoft documents WinGet's 7.6 default as MSIX, with a separate MSI choice; the document also describes a different 7.7 packaging future. Do not transfer preview packaging rules to an older stable installation. The same page still shows 7.6.6 examples, so select and verify the actual release before any later authorized install. Package and OS/architecture compatibility must be checked for the target machine. [Windows installation guide](https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows?view=powershell-7.6).

**Reuse:** the pinned core license is MIT, requiring preservation of its notice and permission text. Dependencies, separately distributed modules, assets and trademarks require separate review. No code was copied and no module was installed. [7.6.10 license](https://github.com/PowerShell/PowerShell/blob/v7.6.10/LICENSE.txt).

## Bounded follow-up, not a result

For a later permitted compatibility test, inventory the executable actually invoked, host architecture, package channel, profiles and required modules without exporting credentials. Use disposable non-sensitive fixtures to check complete JSON error reporting, native-process arguments, encodings and module behavior. Compare the intended workflow against its existing baseline before recommending migration; the LTS label alone does not establish compatibility or speed.

No user settings, execution policy, remoting, account access, credentials, scheduled jobs or binaries were changed. No support, security or performance verdict is asserted for the user's installed environment.
