# Responsive desktop architecture

**Reviewed 2026-10-26. No blanket rewrite recommendation.**

Keep window/input coordination small and predictable. Measure main-process scheduling, renderer long tasks, worker/process queue time and native service work separately. Replacing a button between pointer-down and pointer-up can lose the action even when hit-testing is correct: use stable keyed UI identity and test interrupted input, not just screenshots.

## Electron

Long-running work must not block the main/UI path. Prefer asynchronous IO and carefully scoped worker/service boundaries; synchronous IPC can serialize unrelated work. Utility processes provide a separate Node process with message ports, but add lifecycle and serialization costs. [E01](sources.md#e01)[E02](sources.md#e02)

The official October 21, 2026 Electron 45 release describes startup/native-call improvements and changes to tracing. Stable 45 uses Perfetto protobuf traces and nativeHeapProfiling options instead of the earlier experimental enableHeapProfiling method. Check exact release documentation: a cached generic API page can lag migration notes. An alpha build and stable release with the same major number are not identical. [E03](sources.md#e03)[E04](sources.md#e04)

A runtime upgrade is a controlled experiment, not proof that the application algorithm improved. Audit preload API changes, native ABI compatibility, security defaults and rollback before promotion.

## Tauri and native Windows alternatives

Tauri separates a core process and webview processes; privilege boundaries still need explicit commands/scopes and target-webview testing. WinUI/Windows App SDK is a Windows-native candidate when that platform is the product target. Choose from constraints and measurements, not framework fan clubs. [T01](sources.md#t01)[W01](sources.md#w01)

## Acceptance checklist

Ordinary installed shortcut launch; restored session; second launch before readiness; tab switching during background updates; drag/reorder/close; maximize/minimize/restore; keyboard and accessibility focus; multiple DPI/window sizes; clean exit and restart. Record the actual installed artifact, not only a development server.
