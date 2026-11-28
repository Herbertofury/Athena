# visual-editor-core

Framework-independent state operations for editable feed dashboards. This module
exposes `VisualEditorCore` in browsers and CommonJS in Node; load `feed-core` first
for the shared presentation schema. It performs no rendering, storage, network
access or drag event handling. A host can use the same reorder operation for
pointer dragging, keyboard controls and programmatic layout edits.

```js
const dashboard = VisualEditorCore.normalizeDashboard({
  id: 'workspace', name: 'Daily reading', widgets: [
    { id: 'security', title: 'Security', view: 'list', query: 'security patch',
      category: '', sourceIds: [], limit: 12, span: 1 },
    { id: 'releases', title: 'Releases', view: 'gallery', query: 'release',
      category: '', sourceIds: [], limit: 24, span: 2 }
  ]
});
const reordered = VisualEditorCore.moveWidget(dashboard, 'security', 1);
const updated = VisualEditorCore.updateWidget(reordered, 'releases', { limit: 18 });
```

`normalizeDashboard` preserves an explicit ID, name and ordered widgets. An empty
dashboard stays empty; the product chooses any starter layout. Widgets have stable
unique IDs and bounded titles, queries and source selections; supported views
come from `FeedCore.VIEWS`, limits are 1–100 items and spans are 1–2 columns. At
most 32 widgets are retained. Invalid unknown fields and raw HTML/CSS are excluded.

`moveWidget`, `updateWidget`, `deleteWidget` and `addWidget` return a new normalized
dashboard without mutating the caller. Updates cannot change an existing stable
ID. Duplicate IDs are ignored, absent targets do not damage other widgets, and
move targets are clamped to valid positions. Exported feed preferences preserve
`dashboards` and `activeDashboardId`; presentation presets omit both.

This is the feed-dashboard editor's state core, not an arbitrary page designer.
The [feed-widget-core](../feed-widget-core/README.md) provides reusable feed
presentation and editor controls. Hosts remain responsible for pointer and
keyboard access, focus restoration, undo policy, persistence and layout display.

```sh
node --test cores/visual-editor-core/tests/*.test.cjs
```

Tests cover stable ordering, immutable updates, bounded values, duplicate IDs,
deletion and workspace import/export. These private source files are `UNLICENSED`
pending an explicit owner licensing decision.
