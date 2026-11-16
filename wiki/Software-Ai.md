# AI & local models

Run and evaluate model-assisted workflows with explicit hardware and licensing limits.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=ai) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

27 applications. Reviewed 2026-11-15; individual records identify inherited research.

## AI command-line assistants

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Fai-command-line)

### AIChat

Command-line model client with interactive chat, shell assistance, retrieval and tool integrations.

- **Platforms:** Windows, macOS, Linux. **License:** MIT OR Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Use models from a terminal while keeping provider configuration in one place.
- **Compare when:** Provider keys and model/runtime costs are separate; executing suggested shell commands requires checking their effects.
- **Strengths:** Terminal-oriented interactions can share one configuration across several model services.
- **Limitations:** Provider keys and model/runtime costs are separate; executing suggested shell commands requires checking their effects.
- **Maintenance:** unverified — The observed upstream release is dated 2025-07-06; an older release alone does not establish abandonment or current support.
- [Official project](https://github.com/sigoden/aichat) · [Official installation / downloads](https://github.com/sigoden/aichat/releases) · [Repository](https://github.com/sigoden/aichat)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/sigoden/aichat/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/sigoden/aichat/HEAD/LICENSE-MIT) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/sigoden/aichat/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-aarch64-apple-darwin.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/sigoden/aichat/releases/tag/v0.30.0) (2026-11-14; downloads, maintenance)
### LLM

Command-line and Python interface for model prompts, plugins, embeddings and locally stored conversation logs.

- **Platforms:** macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** This review establishes documented macOS/Linux installation; additional platform support depends on the Python package and selected plugins.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Run reusable model prompts from scripts and inspect their recorded outputs.
- **Compare when:** Provider charges and local model requirements vary by plugin; stored prompts may contain sensitive work data.
- **Strengths:** Logged prompt history and shell pipelines support repeatable model-assisted data work.
- **Limitations:** Provider charges and local model requirements vary by plugin; stored prompts may contain sensitive work data.
- **Maintenance:** active — An upstream release was observed dated 2026-11-11. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/simonw/llm/releases/tag/0.37.2))
- [Official project](https://llm.datasette.io/en/stable/) · [Official installation / downloads](https://llm.datasette.io/en/stable/setup.html) · [Repository](https://github.com/simonw/llm)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/simonw/llm/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/simonw/llm/main/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://llm.datasette.io/en/stable/setup.html) (2026-11-14; downloads); [Official documentation: Python package installation and documented macOS/Linux configuration paths.](https://llm.datasette.io/en/latest/setup.html) (2026-11-14; platforms, downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/43/70/8a4de4f81d7e7eba291569d9acd7fa77ec794f37ed9cc78fd1d493a43953/llm-0.37.2-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/simonw/llm/releases/tag/0.37.2) (2026-11-14; downloads, maintenance)

## AI evaluation

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Fai-evaluation)

### DeepEval

LLM evaluation runner with test cases, metrics and integration into Python test workflows.

- **Platforms:** Windows, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Official quickstart documents local Python execution and Linux/Windows result-path setup; a supported Python environment is required.
- **Pricing details:** Open-source runner is free; model inference and optional Confident AI services have separate terms and costs.
- **Pick for:** You want programmable evaluations that fit a Python test suite.
- **Compare when:** Use human review and held-out examples to calibrate metrics; use Promptfoo for configuration-driven comparisons.
- **Strengths:** Evaluation criteria can be checked repeatedly during development; Test cases integrate with an existing Python workflow
- **Limitations:** Model-based judges have uncertainty and may incur API fees; Local runner execution does not make remote judge calls offline
- **Maintenance:** active — Official release python-v4.2.4 is dated 2026-09-22; installation and performance were not independently tested. ([evidence](https://github.com/confident-ai/deepeval/releases/tag/python-v4.2.4))
- [Official project](https://github.com/confident-ai/deepeval) · [Official installation / downloads](https://deepeval.com/docs/getting-started) · [Repository](https://github.com/confident-ai/deepeval)
- **Sources:** [Official product overview](https://github.com/confident-ai/deepeval) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/confident-ai/deepeval/main/README.md) (2026-11-15; identity, features, downloads, pricing); [Official licensing terms](https://raw.githubusercontent.com/confident-ai/deepeval/main/LICENSE.md) (2026-11-15; license); [Documented deployment and platform scope](https://deepeval.com/docs/getting-started) (2026-11-15; platforms, downloads); [Official dated release](https://github.com/confident-ai/deepeval/releases/tag/python-v4.2.4) (2026-11-15; maintenance, downloads)
### Langfuse

LLM application observability with traces, evaluations, prompt management and dataset workflows.

- **Platforms:** Web. **License:** MIT core; enterprise directories use separate commercial terms. **Pricing model:** freemium.
- **Compatibility details:** Browser service with official container deployment; SDKs instrument applications separately.
- **Pricing details:** Core can be self-hosted; hosted free/paid plans and enterprise capabilities are separate.
- **Pick for:** You need to understand model behavior across real application traces.
- **Compare when:** Use a local evaluation runner for isolated tests and review hosted versus self-hosted data handling.
- **Strengths:** Connects model calls and application steps in a shared history; Prompts and evaluation results can be reviewed together
- **Limitations:** Self-hosting requires several backing services; Traces can contain sensitive application data and need deliberate retention rules
- **Maintenance:** active — Official release v4.80.0 is dated 2026-11-13; installation and performance were not independently tested. ([evidence](https://github.com/langfuse/langfuse/releases/tag/v4.80.0))
- [Official project](https://github.com/langfuse/langfuse) · [Official installation / downloads](https://github.com/langfuse/langfuse#self-host-langfuse) · [Repository](https://github.com/langfuse/langfuse)
- **Sources:** [Official product overview](https://github.com/langfuse/langfuse) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/langfuse/langfuse/main/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/langfuse/langfuse/main/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/langfuse/langfuse#self-host-langfuse) (2026-11-15; downloads); [Official dated release](https://github.com/langfuse/langfuse/releases/tag/v4.80.0) (2026-11-15; maintenance, downloads)
### Promptfoo

CLI and local viewer for evaluating prompts and model-backed applications against repeatable test cases.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Regression-test model responses on a defined set of cases.
- **Compare when:** Evaluation quality depends on test design and graders; many providers charge per request and test success does not establish general safety.
- **Strengths:** The same test cases can compare changes in prompts, models and application configuration.
- **Limitations:** Evaluation quality depends on test design and graders; many providers charge per request and test success does not establish general safety.
- **Maintenance:** active — An upstream release was observed dated 2026-10-25. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/promptfoo/promptfoo/releases/tag/0.125.1))
- [Official project](https://www.promptfoo.dev/) · [Official installation / downloads](https://www.promptfoo.dev/docs/installation/) · [Repository](https://github.com/promptfoo/promptfoo)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/promptfoo/promptfoo/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/promptfoo/promptfoo/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://www.promptfoo.dev/docs/installation/) (2026-11-14; downloads, platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://registry.npmjs.org/promptfoo/-/promptfoo-0.125.1.tgz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/promptfoo/promptfoo/releases/tag/0.125.1) (2026-11-14; downloads, maintenance)

## AI coding assistants

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Fcoding-assistants)

### Aider

Terminal coding assistant that edits repository files with model-provider support and Git integration.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Make reviewable AI-assisted changes in an existing source repository.
- **Compare when:** Models may transmit code externally and can introduce incorrect edits requiring review.
- **Strengths:** Repository edits and Git integration keep AI-generated changes available for ordinary diff review.
- **Limitations:** Models may transmit code externally and can introduce incorrect edits requiring review.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-05-22. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/Aider-AI/aider))
- [Official project](https://aider.chat/) · [Official installation / downloads](https://github.com/Aider-AI/aider/releases) · [Repository](https://github.com/Aider-AI/aider)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/Aider-AI/aider) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/Aider-AI/aider/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://aider.chat/) (2026-11-14; identity, features); [Official release inspected: v0.86.0](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://files.pythonhosted.org/packages/75/f7/e20749d9a510673e7adf910b005e3efe4ceaf9c194f1dd40d6931a3f34b9/aider_chat-0.86.2-py3-none-any.whl) (2026-11-14; downloads, pricing); [Official source: Official installation paths are provided for Windows PowerShell and macOS/Linux shells.](https://aider.chat/docs/install.html) (2026-11-14; platforms, downloads)
### Cline

Editor-based coding assistant that can propose file edits and tool actions using configured model providers.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Windows, macOS and Linux are documented for the CLI/editor workflow. Desktop-app availability and release maturity are a separate surface and should be checked independently.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Review an assistant's proposed multi-step programming changes inside an editor.
- **Compare when:** Tool execution and generated code need review, and provider use may incur fees.
- **Strengths:** A visible sequence of proposed edits and tool actions supports review during assisted coding.
- **Limitations:** Tool execution and generated code need review, and provider use may incur fees.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/cline/cline))
- [Official project](https://cline.bot/) · [Official installation / downloads](https://github.com/cline/cline/releases) · [Repository](https://github.com/cline/cline)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/cline/cline) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/cline/cline/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://cline.bot/) (2026-11-14; identity, features); [Official release inspected: v4.1.26](https://github.com/cline/cline/releases/tag/v4.1.26) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/cline/cline/releases/download/v4.1.26/cline-4.1.26.vsix) (2026-11-14; downloads, pricing); [Official source: Official CLI documentation lists macOS, Linux and Windows binaries on arm64 and x64.](https://github.com/cline/cline/blob/main/apps/cli/README.md) (2026-11-14; platforms, downloads)
### Continue

Configurable coding-assistant tooling with editor integrations and selectable model providers.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** CLI and editor integrations have different installation paths; VS Code/JetBrains compatibility and provider setup must be checked.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Configure coding assistance around chosen local or hosted models.
- **Compare when:** The privacy and cost profile depends on provider and feature configuration.
- **Strengths:** Model configuration lets teams adapt coding assistance to selected providers and policies.
- **Limitations:** The privacy and cost profile depends on provider and feature configuration.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/continuedev/continue))
- [Official project](https://continue.dev/) · [Official installation / downloads](https://github.com/continuedev/continue/releases) · [Repository](https://github.com/continuedev/continue)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/continuedev/continue) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/continuedev/continue/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://continue.dev/) (2026-11-14; identity, features); [Official release inspected: v2.0.0-vscode](https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode) (2026-11-14; downloads, maintenance); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/continuedev/continue/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Official source: The CLI documentation provides Windows and macOS/Linux installation paths.](https://github.com/continuedev/continue/blob/main/extensions/cli/README.md) (2026-11-14; platforms, downloads); [Official source: Editor integrations require a supported VS Code or JetBrains installation.](https://docs.continue.dev/ide-extensions/install) (2026-11-14; platforms, downloads)
### Goose

Local AI agent available as a desktop application and CLI with extensible tools and model-provider choices.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Automate a development workflow through a local extensible agent.
- **Compare when:** Connected providers can incur costs, and extensions grant capabilities that must fit the intended workflow.
- **Strengths:** Extensions let one agent connect development and general desktop workflows.
- **Limitations:** Connected providers can incur costs, and extensions grant capabilities that must fit the intended workflow.
- **Maintenance:** active — An upstream release was observed dated 2026-11-14. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/aaif-goose/goose/releases/tag/v1.59.1))
- [Official project](https://goose-docs.ai/) · [Official installation / downloads](https://goose-docs.ai/docs/getting-started/installation/) · [Repository](https://github.com/aaif-goose/goose)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/aaif-goose/goose/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/aaif-goose/goose/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://goose-docs.ai/docs/getting-started/installation/) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/aaif-goose/goose/releases/download/v1.59.1/goose-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/aaif-goose/goose/releases/tag/v1.59.1) (2026-11-14; downloads, maintenance)
### OpenCode

Open-source coding agent with terminal and desktop interfaces and support for multiple model providers.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Use an AI coding agent with a chosen supported model provider.
- **Compare when:** Model access may require paid API usage or subscriptions; generated edits and tool actions need project-specific review.
- **Strengths:** The client can be paired with a preferred supported provider rather than one fixed model service.
- **Limitations:** Model access may require paid API usage or subscriptions; generated edits and tool actions need project-specific review.
- **Maintenance:** active — An upstream release was observed dated 2026-10-28. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/anomalyco/opencode/releases/tag/v1.19.5))
- [Official project](https://opencode.ai/) · [Official installation / downloads](https://github.com/anomalyco/opencode/releases) · [Repository](https://github.com/anomalyco/opencode)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/anomalyco/opencode/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/anomalyco/opencode/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/anomalyco/opencode/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/anomalyco/opencode/releases/download/v1.19.5/opencode-darwin-arm64.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/anomalyco/opencode/releases/tag/v1.19.5) (2026-11-14; downloads, maintenance)
### Tabby

Self-hosted coding assistant with a local model server, editor integrations and optional team features.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 core; ee directory and incorporated components have separate licenses. **Pricing model:** freemium.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Host coding assistance for an editor or a controlled team environment.
- **Compare when:** Model hosting needs suitable hardware; Team and Enterprise features are paid and enterprise source has separate licensing.
- **Strengths:** Teams can operate the assistant near their own repositories and control the serving environment.
- **Limitations:** Model hosting needs suitable hardware; Team and Enterprise features are paid and enterprise source has separate licensing.
- **Maintenance:** active — An upstream release was observed dated 2026-01-25. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/tabbyml/tabby/releases/tag/v0.32.0))
- [Official project](https://www.tabbyml.com/) · [Official installation / downloads](https://github.com/TabbyML/tabby/releases) · [Repository](https://github.com/tabbyml/tabby)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/tabbyml/tabby/HEAD/README.md) (2026-11-14; downloads, features, identity); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/tabbyml/tabby/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/TabbyML/tabby/releases) (2026-11-14; downloads); [Official documentation: Community is free; Team and Enterprise features require the appropriate paid license.](https://tabby.tabbyml.com/docs/administration/license/) (2026-11-14; pricing); [Official documentation: Windows server installation has hardware and runtime prerequisites.](https://tabby.tabbyml.com/docs/quick-start/installation/windows/) (2026-11-14; platforms, downloads); [Official documentation: Linux server installation and accelerator choices.](https://tabby.tabbyml.com/docs/quick-start/installation/linux/) (2026-11-14; platforms, downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/TabbyML/tabby/releases/download/v0.32.0/tabby_aarch64-apple-darwin.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/tabbyml/tabby/releases/tag/v0.32.0) (2026-11-14; downloads, maintenance)

## Data Labeling

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Fdata-labeling)

### Argilla

Collaborative dataset curation application for collecting human feedback on text and model outputs.

- **Platforms:** Web. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Browser UI and server with a Python SDK; the SDK alone is not the full application.
- **Pricing details:** Apache source and client are free; hosted infrastructure has separate terms.
- **Pick for:** A project already benefits from Argilla-style human feedback datasets and accepts its maintenance scope.
- **Compare when:** Prefer an actively evolving annotation platform when new capabilities and long-term vendor development are necessary.
- **Strengths:** Connects domain reviewers with programmatic dataset workflows; Feedback fields can be adapted to a project
- **Limitations:** Authors state that new feature development has ended and maintenance is limited to fixes; Requires a server as well as the Python client
- **Maintenance:** unverified — Official release v2.8.0 is dated 2025-03-11; installation and performance were not independently tested. ([evidence](https://github.com/argilla-io/argilla/releases/tag/v2.8.0))
- [Official project](https://github.com/argilla-io/argilla) · [Official installation / downloads](https://github.com/argilla-io/argilla#-getting-started) · [Repository](https://github.com/argilla-io/argilla)
- **Sources:** [Official product overview](https://github.com/argilla-io/argilla) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/argilla-io/argilla/develop/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/argilla-io/argilla/develop/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/argilla-io/argilla#-getting-started) (2026-11-15; downloads); [Official dated release](https://github.com/argilla-io/argilla/releases/tag/v2.8.0) (2026-11-15; maintenance, downloads)
### Label Studio

Configurable annotation application for text, images, audio, video and time-series datasets.

- **Platforms:** Web. **License:** Apache-2.0 Community; commercial editions separate. **Pricing model:** freemium.
- **Compatibility details:** Browser interface backed by local or hosted Python/container deployment.
- **Pricing details:** Community is publicly installable; enterprise and hosted services have separate pricing.
- **Pick for:** You need configurable annotation across more than one kind of media.
- **Compare when:** Compare specialist tools for detailed image workflows or Argilla for feedback-oriented text datasets.
- **Strengths:** Different annotation tasks can share one project system; Templates reduce the need for a custom labeling interface
- **Limitations:** Team governance and review capabilities differ by edition; Dataset storage, access control and label quality need separate planning
- **Maintenance:** active — Official release 1.23.2 is dated 2026-09-29; installation and performance were not independently tested. ([evidence](https://github.com/HumanSignal/label-studio/releases/tag/1.23.2))
- [Official project](https://github.com/HumanSignal/label-studio) · [Official installation / downloads](https://github.com/HumanSignal/label-studio#try-out-label-studio) · [Repository](https://github.com/HumanSignal/label-studio)
- **Sources:** [Official product overview](https://github.com/HumanSignal/label-studio) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/HumanSignal/label-studio/develop/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/HumanSignal/label-studio/develop/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/HumanSignal/label-studio#try-out-label-studio) (2026-11-15; downloads); [Official dated release](https://github.com/HumanSignal/label-studio/releases/tag/1.23.2) (2026-11-15; maintenance, downloads)

## Document question answering

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Fdocument-ai)

### AnythingLLM

AI workspace combining document ingestion, retrieval, model connections, and configurable agents.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** freemium.
- **Compatibility details:** Desktop is a single-user app on Windows, macOS and Linux. Shared browser access and multi-user controls use the Docker deployment; documented Pro feature availability is Windows and macOS.
- **Pricing details:** Core desktop document chat is free; optional Desktop Pro subscriptions raise limits on additional Magic features. External provider fees remain separate.
- **Pick for:** Ask questions over a controlled document collection with an explicit model provider.
- **Compare when:** Local deployment does not guarantee local processing when remote providers are selected.
- **Strengths:** Document ingestion and retrieval can be organized into separate workspaces.
- **Limitations:** Local deployment does not guarantee local processing when remote providers are selected.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/Mintplex-Labs/anything-llm))
- [Official project](https://anythingllm.com/) · [Official installation / downloads](https://github.com/Mintplex-Labs/anything-llm/releases) · [Repository](https://github.com/Mintplex-Labs/anything-llm)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/Mintplex-Labs/anything-llm) (2026-11-14; identity, maintenance, license); [Official PDF support and desktop distributions](https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/HEAD/README.md) (2026-11-15; downloads, features, identity, platforms); [Official official documentation](https://anythingllm.com/) (2026-11-14; identity, features); [Official release inspected: v1.19.0](https://github.com/Mintplex-Labs/anything-llm/releases/tag/v1.19.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/Mintplex-Labs/anything-llm/releases/download/v1.19.0/AnythingLLMDesktop.dmg) (2026-11-14; downloads, pricing); [Official desktop offline operation and telemetry policy](https://docs.anythingllm.com/installation-desktop/privacy) (2026-11-15; features); [Official local embedder and first-use model download](https://docs.anythingllm.com/setup/embedder-configuration/local/built-in) (2026-11-15; features); [Official local LLM provider and model setup](https://docs.anythingllm.com/setup/llm-configuration/local/built-in) (2026-11-15; features); [Official attachment and retrieval context limits](https://docs.anythingllm.com/chatting-with-documents/introduction) (2026-11-15; features); [Official free core and optional Desktop Pro limits](https://docs.anythingllm.com/pro/overview) (2026-11-15; pricing, features, platforms)
- **Documented task support — Chat with PDF documents offline:** Use the desktop app with a local LLM, local embedder and local vector database.; Download models, run the first embedding and prepare any optional reranker before disconnecting; avoid remote providers and web-connected agents. **Limits:** Retrieval sends selected chunks to the model; attached documents are constrained by its context window.; The built-in embedding model is primarily trained on English; test retrieval quality for other languages. [Evidence 1](https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/HEAD/README.md) [Evidence 2](https://docs.anythingllm.com/installation-desktop/privacy) [Evidence 3](https://docs.anythingllm.com/setup/embedder-configuration/local/built-in) [Evidence 4](https://docs.anythingllm.com/setup/llm-configuration/local/built-in) [Evidence 5](https://docs.anythingllm.com/chatting-with-documents/introduction)

## Local AI interfaces

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Flocal-ai-clients)

### GPT4All

Desktop application and tooling for running supported language models locally and working with local documents.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Experiment with local conversational models through a desktop interface.
- **Compare when:** Compatible models and document processing have hardware and model-license constraints.
- **Strengths:** Local model chat and document context are combined in a desktop-oriented workflow.
- **Limitations:** Compatible models and document processing have hardware and model-license constraints.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.; Repository activity is older than one year; current maintenance has not been established.
- **Maintenance:** unverified — Repository not archived; latest repository push observed 2025-05-27. Activity is not a runtime, security, or support guarantee. No push within the preceding year was observed; current support status needs reassessment. ([evidence](https://api.github.com/repos/nomic-ai/gpt4all))
- [Official project](https://www.nomic.ai/gpt4all) · [Official installation / downloads](https://github.com/nomic-ai/gpt4all/releases) · [Repository](https://github.com/nomic-ai/gpt4all)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/nomic-ai/gpt4all) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/nomic-ai/gpt4all/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://www.nomic.ai/gpt4all) (2026-11-14; identity, features); [Official release inspected: v3.10.0](https://github.com/nomic-ai/gpt4all/releases/tag/v3.10.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/nomic-ai/gpt4all/releases/download/v3.10.0/gpt4all-installer-win64-v3.10.0.exe) (2026-11-14; downloads, pricing); [Official LocalDocs workflow and on-device indexing](https://docs.gpt4all.io/gpt4all_desktop/localdocs.html) (2026-11-15; features); [Official PDF file support and off-device embedding switch](https://docs.gpt4all.io/gpt4all_desktop/settings.html) (2026-11-15; features)
- **Documented task support — Chat with PDF documents offline:** Download a compatible local chat model and the embedding model before disconnecting.; Keep Use Nomic Embed API off and use a local model for the chat. **Limits:** LocalDocs retrieves selected text snippets; it does not guarantee complete-document coverage or correct answers. [Evidence 1](https://docs.gpt4all.io/gpt4all_desktop/localdocs.html) [Evidence 2](https://docs.gpt4all.io/gpt4all_desktop/settings.html)
### Jan

Desktop AI chat application that can use local models and configured remote providers.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0; attribution request in upstream notice. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Use a graphical AI chat workspace with a local-model option.
- **Compare when:** Hardware requirements and privacy behavior depend on the selected model and provider.
- **Strengths:** A desktop interface lowers setup friction for experimenting with supported local chat models.
- **Limitations:** Hardware requirements and privacy behavior depend on the selected model and provider.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/janhq/jan))
- [Official project](https://www.jan.ai/) · [Official installation / downloads](https://github.com/janhq/jan/releases) · [Repository](https://github.com/janhq/jan)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/janhq/jan) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/janhq/jan/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/janhq/jan/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://www.jan.ai/) (2026-11-14; identity, features); [Official release inspected: v0.8.8](https://github.com/janhq/jan/releases/tag/v0.8.8) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/janhq/jan/releases/download/v0.8.8/Jan_0.8.8_x64-setup.exe) (2026-11-14; downloads, pricing)
### KoboldCpp

Portable local-model runner with a bundled browser interface, GGUF model support and local APIs.

- **Platforms:** Windows, macOS, Linux. **License:** AGPL-3.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Run a local GGUF model through a ready-made interface.
- **Compare when:** Models remain separate downloads with their own terms; available memory, model architecture and backend determine usable workloads.
- **Strengths:** A bundled interface and executable reduce the pieces needed to try a compatible local model.
- **Limitations:** Models remain separate downloads with their own terms; available memory, model architecture and backend determine usable workloads.
- **Maintenance:** active — An upstream release was observed dated 2026-10-31. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/LostRuins/koboldcpp/releases/tag/v1.124.2))
- [Official project](https://koboldcpp.net/) · [Official installation / downloads](https://github.com/LostRuins/koboldcpp/releases) · [Repository](https://github.com/LostRuins/koboldcpp)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/LostRuins/koboldcpp/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/LostRuins/koboldcpp/HEAD/LICENSE.md) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/LostRuins/koboldcpp/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/LostRuins/koboldcpp/releases/download/v1.124.2/koboldcpp-nocuda.exe) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/LostRuins/koboldcpp/releases/tag/v1.124.2) (2026-11-14; downloads, maintenance)
### LM Studio

Desktop application for discovering, downloading and running supported local language models with chat and API interfaces.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary LM Studio app terms; bundled components and models retain separate licenses. **Pricing model:** freemium.
- **Compatibility details:** Officially supports Windows, Linux and Apple Silicon macOS; check the system-requirements page for current CPU, OS and RAM requirements.
- **Pricing details:** Local model use remains available on the free plan. Optional Bionic cloud-inference subscriptions and usage credits are paid; model licenses remain separate.
- **Pick for:** Try supported local language models through a desktop interface.
- **Compare when:** The app is proprietary and model terms are separate; hardware requirements include Apple Silicon for current macOS builds and sufficient memory.
- **Strengths:** A graphical setup path helps users run compatible models without assembling a serving stack.
- **Limitations:** The app is proprietary and model terms are separate; hardware requirements include Apple Silicon for current macOS builds and sufficient memory.; Choosing cloud inference or web search sends requests outside the local workflow; the offline claim applies to local models and local document processing.
- **Maintenance:** unverified — Official sources and distribution pages were reviewed; current maintenance commitments were not independently established.
- [Official project](https://lmstudio.ai/) · [Official installation / downloads](https://lmstudio.ai/download)
- **Sources:** [Official product page: identity and documented features](https://lmstudio.ai/) (2026-11-14; features, identity); [Official downloads or installation instructions](https://lmstudio.ai/download) (2026-11-14; downloads); [Official documentation: Official announcement makes LM Studio free for personal and workplace use.](https://lmstudio.ai/blog/free-for-work) (2026-11-14; pricing); [Official documentation: Windows, Apple Silicon macOS and Linux hardware/system requirements.](https://lmstudio.ai/docs/app/system-requirements) (2026-11-14; platforms); [Official documentation: The LM Studio application is governed by proprietary app terms; models and bundled components have separate terms.](https://lmstudio.ai/app-terms) (2026-11-14; license); [Official documentation: Desktop model discovery, local chat and local model-serving workflows.](https://lmstudio.ai/docs/app/basics) (2026-11-14; identity, features, downloads); [Official offline operation and network-dependent actions](https://lmstudio.ai/docs/app/offline) (2026-11-15; features); [Official PDF attachments and retrieval behavior](https://lmstudio.ai/docs/app/basics/rag) (2026-11-15; features); [Current app privacy policy distinguishes local and cloud processing](https://lmstudio.ai/app-privacy) (2026-11-15; features); [Current free local plan and optional paid cloud tiers](https://lmstudio.ai/pricing) (2026-11-15; pricing)
- **Documented task support — Chat with PDF documents offline:** Download a supported local model and its runtime before disconnecting.; Use local inference and document attachments; cloud models, web search and new downloads require connectivity. **Limits:** Long documents use retrieval of selected content; prompt detail and model context affect answer coverage. [Evidence 1](https://lmstudio.ai/docs/app/offline) [Evidence 2](https://lmstudio.ai/docs/app/basics/rag) [Evidence 3](https://lmstudio.ai/app-privacy)
### Open WebUI

Self-hostable web interface for model chat, retrieval workflows, and connections to compatible model APIs.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Open WebUI License with branding conditions; earlier contributions retain original licenses. **Pricing model:** mixed.
- **Pick for:** Provide a shared local-network chat interface for configured models.
- **Compare when:** Current licensing includes additional branding conditions; deployment and provider configuration require review.
- **Strengths:** A self-hosted interface can present several configured model APIs consistently.
- **Limitations:** Current licensing includes additional branding conditions; deployment and provider configuration require review.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/open-webui/open-webui))
- [Official project](https://openwebui.com/) · [Official installation / downloads](https://github.com/open-webui/open-webui#quick-start) · [Repository](https://github.com/open-webui/open-webui)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/open-webui/open-webui) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/open-webui/open-webui/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms, license); [Official license text](https://raw.githubusercontent.com/open-webui/open-webui/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://openwebui.com/) (2026-11-14; identity, features); [Official release inspected: v0.13.3](https://github.com/open-webui/open-webui/releases/tag/v0.13.3) (2026-11-14; downloads, maintenance); [Official source: Standard branded use is free; branding changes and enterprise-exclusive offerings require the appropriate enterprise license.](https://docs.openwebui.com/enterprise/) (2026-11-14; pricing)
### TextGen

Desktop local-model interface with portable builds, multiple generation modes and optional inference backends.

- **Platforms:** Windows, macOS, Linux. **License:** AGPL-3.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Compare local model workflows and switch between chat and free-form generation.
- **Compare when:** Advanced loaders, training and extensions have additional dependencies; model licenses and hardware requirements are separate.
- **Strengths:** The interface supports chat, free-form generation and backend experimentation in one workspace.
- **Limitations:** Advanced loaders, training and extensions have additional dependencies; model licenses and hardware requirements are separate.
- **Maintenance:** active — An upstream release was observed dated 2026-05-20. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/oobabooga/textgen/releases/tag/v4.9))
- [Official project](https://github.com/oobabooga/textgen) · [Official installation / downloads](https://github.com/oobabooga/textgen/releases) · [Repository](https://github.com/oobabooga/textgen)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/oobabooga/textgen/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/oobabooga/textgen/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/oobabooga/textgen/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/oobabooga/textgen/releases/download/v4.9/textgen-portable-4.9-windows-cpu.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/oobabooga/textgen/releases/tag/v4.9) (2026-11-14; downloads, maintenance)

## Local model runtimes

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Flocal-model-runtimes)

### llama.cpp

C/C++ inference toolkit for supported language models with quantization and multiple hardware backends.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Windows, macOS and Linux builds are documented; acceleration backends, compiler requirements and model compatibility differ by host.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Deploy local inference with explicit control over model files and runtime options.
- **Compare when:** Supported architectures, build options, and model terms need separate checks.
- **Strengths:** Explicit model files and backend choices provide detailed control over inference deployment.
- **Limitations:** Supported architectures, build options, and model terms need separate checks.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/ggml-org/llama.cpp))
- [Official project](https://github.com/ggml-org/llama.cpp) · [Official installation / downloads](https://github.com/ggml-org/llama.cpp#quick-start) · [Repository](https://github.com/ggml-org/llama.cpp)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/ggml-org/llama.cpp) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/ggml-org/llama.cpp/HEAD/README.md) (2026-11-14; identity, features); [Official release inspected: v1.0.0](https://github.com/ggml-org/llama.cpp/releases/tag/v1.0.0) (2026-11-14; downloads, maintenance); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/ggml-org/llama.cpp/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Official source: Build instructions cover Windows, macOS and Linux, with backend-specific prerequisites.](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) (2026-11-14; platforms, downloads)
### llamafile

Local inference distribution approach that packages model-serving software into portable executables.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0; included components and models retain separate terms. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Distribute a supported local model runtime with fewer installation steps.
- **Compare when:** Executable size limits and model compatibility depend on platform and build.
- **Strengths:** Portable packaging can reduce runtime setup for distributing supported inference workloads.
- **Limitations:** Executable size limits and model compatibility depend on platform and build.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-09. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mozilla-ai/llamafile))
- [Official project](https://github.com/mozilla-ai/llamafile) · [Official installation / downloads](https://github.com/mozilla-ai/llamafile/releases) · [Repository](https://github.com/mozilla-ai/llamafile)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mozilla-ai/llamafile) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/mozilla-ai/llamafile/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text](https://raw.githubusercontent.com/mozilla-ai/llamafile/HEAD/LICENSE) (2026-11-14; license); [Official release inspected: 0.10.6](https://github.com/mozilla-ai/llamafile/releases/tag/0.10.6) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/mozilla-ai/llamafile/releases/download/0.10.6/llamafile-0.10.6.zip) (2026-11-14; downloads, pricing)
### LocalAI

Self-hosted inference server exposing compatible APIs for supported language, image, and audio backends.

- **Platforms:** macOS, Linux, Web. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Host an application-facing inference service with configurable model backends.
- **Compare when:** Native installation documentation targets Linux and Apple Silicon macOS; Windows requires a supported container or WSL path. Backend acceleration varies.
- **Strengths:** Compatible application APIs allow different inference backends to be exposed through one service.
- **Limitations:** Native installation documentation targets Linux and Apple Silicon macOS; Windows requires a supported container or WSL path. Backend acceleration varies.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mudler/LocalAI))
- [Official project](https://localai.io/) · [Official installation / downloads](https://github.com/mudler/LocalAI/releases) · [Repository](https://github.com/mudler/LocalAI)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mudler/LocalAI) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/mudler/LocalAI/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official official documentation](https://localai.io/) (2026-11-14; identity, features); [Official installation documentation](https://localai.io/basics/getting_started/) (2026-11-14; downloads); [Official release inspected: v4.12.1](https://github.com/mudler/LocalAI/releases/tag/v4.12.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/mudler/LocalAI/releases/download/v4.12.1/LocalAI-Launcher-x86_64.AppImage) (2026-11-14; downloads, pricing)
### Ollama

Local model runtime with model management, a command-line interface, and an API for applications.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Run supported language models locally and connect applications through an API.
- **Compare when:** Memory, acceleration support, and model licenses vary; optional cloud use changes data handling.
- **Strengths:** Model management and a local API simplify connecting compatible applications to local inference.
- **Limitations:** Memory, acceleration support, and model licenses vary; optional cloud use changes data handling.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/ollama/ollama))
- [Official project](https://ollama.com/) · [Official installation / downloads](https://github.com/ollama/ollama/releases) · [Repository](https://github.com/ollama/ollama)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/ollama/ollama) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/ollama/ollama/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://ollama.com/) (2026-11-14; identity, features); [Official release inspected: v0.40.16](https://github.com/ollama/ollama/releases/tag/v0.40.16) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/ollama/ollama/releases/download/v0.40.16/ollama-windows-amd64.zip) (2026-11-14; downloads, pricing)
### vLLM

Model inference and serving engine with batched execution, attention-memory management and an API server.

- **Platforms:** Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Primary supported deployment is Linux. Windows requires WSL or community forks; experimental macOS CPU support is not counted as a native supported platform here.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Serve compatible language models to several clients on a supported workstation.
- **Compare when:** Linux is the primary supported host; GPU/runtime compatibility and model memory requirements are substantial, while macOS support is experimental.
- **Strengths:** A dedicated serving engine suits concurrent inference requests on supported hardware.
- **Limitations:** Linux is the primary supported host; GPU/runtime compatibility and model memory requirements are substantial, while macOS support is experimental.
- **Maintenance:** active — An upstream release was observed dated 2026-11-02. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. The observed stream may include prereleases or nightly builds; use the official stable download route for normal installation. ([evidence](https://github.com/vllm-project/vllm/releases/tag/v0.33.0rc3))
- [Official project](https://vllm.ai/) · [Official installation / downloads](https://docs.vllm.ai/en/latest/getting_started/installation/gpu/) · [Repository](https://github.com/vllm-project/vllm)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/vllm-project/vllm/HEAD/README.md) (2026-11-14; downloads, features, identity); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/vllm-project/vllm/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://docs.vllm.ai/en/latest/getting_started/installation/gpu/) (2026-11-14; downloads, platforms); [Official documentation: CPU installation varies by architecture; macOS support is experimental and is not treated as equivalent to the primary Linux deployment.](https://docs.vllm.ai/en/latest/getting_started/installation/cpu/) (2026-11-14; platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/vllm-project/vllm/releases/download/v0.33.0rc3/vllm-0.33.0+cpu-cp38-abi3-macosx_11_0_arm64.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/vllm-project/vllm/releases/tag/v0.33.0rc3) (2026-11-14; downloads, maintenance)

## Speech Transcription

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=ai%2Fspeech-transcription)

### Buzz

Desktop speech transcription application with local Whisper backends, subtitle exports and batch workflows.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Current official README covers Windows, Linux and Apple Silicon macOS. Intel Macs require the older 1.4.5 release.
- **Pricing details:** Public desktop packages and source are free; optional remote models or plugins may have separate costs.
- **Pick for:** You want a GUI for local transcription with subtitle output and repeatable file handling.
- **Compare when:** Compare whisper.cpp for custom command-line integration and verify the backend fits the available hardware.
- **Strengths:** A desktop interface exposes local speech models without building a pipeline; Subtitle exports and folder watching fit repeated media workflows
- **Limitations:** Models require downloads and sufficient local resources; Current macOS version requires Apple Silicon; older Intel support stopped at 1.4.5
- **Maintenance:** active — Official release v1.4.5 is dated 2026-08-23; installation and performance were not independently tested. ([evidence](https://github.com/chidiwilliams/buzz/releases/tag/v1.4.5))
- [Official project](https://github.com/chidiwilliams/buzz) · [Official installation / downloads](https://sourceforge.net/projects/buzz-captions/files/) · [Repository](https://github.com/chidiwilliams/buzz)
- **Sources:** [Official product overview](https://github.com/chidiwilliams/buzz) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/chidiwilliams/buzz/main/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/chidiwilliams/buzz/main/LICENSE) (2026-11-15; license); [Distribution and pricing qualification](https://sourceforge.net/projects/buzz-captions/files/) (2026-11-15; pricing, downloads); [Official dated release](https://github.com/chidiwilliams/buzz/releases/tag/v1.4.5) (2026-11-15; maintenance, downloads)
### whisper.cpp

C/C++ implementation of Whisper speech recognition with command-line tools and several acceleration backends.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** The reviewed upstream source is distributed at no charge and includes a documented build/install route. This does not establish free prebuilt binaries for every platform.
- **Pick for:** Transcribe audio locally from a script or command line.
- **Compare when:** Recognition quality depends on the model and audio; model downloads, compatible audio input and backend build options require setup.
- **Strengths:** Speech can be transcribed locally using the backend appropriate to the machine.
- **Limitations:** Recognition quality depends on the model and audio; model downloads, compatible audio input and backend build options require setup.
- **Maintenance:** active — An upstream release was observed dated 2026-10-06. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.5))
- [Official project](https://github.com/ggml-org/whisper.cpp) · [Official installation / downloads](https://github.com/ggml-org/whisper.cpp#quick-start) · [Repository](https://github.com/ggml-org/whisper.cpp)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/ggml-org/whisper.cpp/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/ggml-org/whisper.cpp/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/ggml-org/whisper.cpp#quick-start) (2026-11-14; downloads); [Public upstream source distribution; binary packaging is separate](https://github.com/ggml-org/whisper.cpp/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.5) (2026-11-14; downloads, maintenance)
