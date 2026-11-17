# PowerToys Workspaces: project launch-state research

Reviewed 2026-11-17. Documentation study only; no installation, system changes or Windows runtime test.

## New catalog knowledge

[Workspaces](https://learn.microsoft.com/en-us/windows/powertoys/workspaces) captures application positions and accepts app-specific launch arguments. Its launch panel distinguishes progress, success and failure and supports cancellation. Re-capturing clears prior arguments/settings. Microsoft documents elevated-window positioning limitations; this is not unsaved-document recovery.

**Athena design inference:** project launchers should preserve argument configuration explicitly, show per-app outcomes, and avoid equating an overall launch button with successful restoration. Test interrupted launches and existing windows before adopting a similar feature. This pass adds knowledge, not an implemented Athena launcher.

## Compatibility and rights

The [installation guide](https://learn.microsoft.com/en-us/windows/powertoys/install) lists Windows 11 or Windows 10 2004/build 19041+, x64/ARM64, and WebView2 setup. PowerToys uses the [MIT license](https://github.com/microsoft/PowerToys/blob/main/LICENSE). No source or artwork was imported.

## Release evidence boundary

A search-indexed 0.103.3099.0 tag returned 404 when opened directly. It is not recorded as an available release. This update deliberately teaches documented workflow behavior without inventing latest-version availability.

## Integration

Updated the existing PowerToys enrichment record, retaining its stable identity and prior evidence. The software builder carries its guidance into the searchable catalog and generated Wiki. Existing records remain intact. Runtime verification is still outstanding.

## Validation

`npm run test:software`: generated-output check passed; 26 Python tests and 38 JavaScript tests passed. Application count remains 1,069; all 105 original PC records remain preserved. No Windows/browser runtime acceptance claimed.
