# AI & local models

Run and evaluate model-assisted workflows with explicit hardware and licensing limits.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=ai) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

11 applications. Reviewed 2026-11-14; individual records identify inherited research.

## AI coding assistants

### Aider

Terminal coding assistant that edits repository files with model-provider support and Git integration.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Make reviewable AI-assisted changes in an existing source repository.
- **Compare when:** Models may transmit code externally and can introduce incorrect edits requiring review.
- **Strengths:** Repository edits and Git integration keep AI-generated changes available for ordinary diff review.
- **Limitations:** Models may transmit code externally and can introduce incorrect edits requiring review.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-05-22. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/Aider-AI/aider))
- [Official project](https://aider.chat/) · [Official installation / downloads](https://github.com/Aider-AI/aider/releases) · [Repository](https://github.com/Aider-AI/aider)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/Aider-AI/aider) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/Aider-AI/aider/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://aider.chat/) (2026-11-14; identity, features); [Official release inspected: v0.86.0](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) (2026-11-14; downloads, maintenance)
### Cline

Editor-based coding assistant that can propose file edits and tool actions using configured model providers.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Review an assistant's proposed multi-step programming changes inside an editor.
- **Compare when:** Tool execution and generated code need review, and provider use may incur fees.
- **Strengths:** A visible sequence of proposed edits and tool actions supports review during assisted coding.
- **Limitations:** Tool execution and generated code need review, and provider use may incur fees.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/cline/cline))
- [Official project](https://cline.bot/) · [Official installation / downloads](https://github.com/cline/cline/releases) · [Repository](https://github.com/cline/cline)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/cline/cline) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/cline/cline/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://cline.bot/) (2026-11-14; identity, features); [Official release inspected: v4.1.26](https://github.com/cline/cline/releases/tag/v4.1.26) (2026-11-14; downloads, maintenance)
### Continue

Configurable coding-assistant tooling with editor integrations and selectable model providers.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Configure coding assistance around chosen local or hosted models.
- **Compare when:** The privacy and cost profile depends on provider and feature configuration.
- **Strengths:** Model configuration lets teams adapt coding assistance to selected providers and policies.
- **Limitations:** The privacy and cost profile depends on provider and feature configuration.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/continuedev/continue))
- [Official project](https://continue.dev/) · [Official installation / downloads](https://github.com/continuedev/continue/releases) · [Repository](https://github.com/continuedev/continue)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/continuedev/continue) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/continuedev/continue/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://continue.dev/) (2026-11-14; identity, features); [Official release inspected: v2.0.0-vscode](https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode) (2026-11-14; downloads, maintenance)

## Document question answering

### AnythingLLM

AI workspace combining document ingestion, retrieval, model connections, and configurable agents.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Ask questions over a controlled document collection with an explicit model provider.
- **Compare when:** Local deployment does not guarantee local processing when remote providers are selected.
- **Strengths:** Document ingestion and retrieval can be organized into separate workspaces.
- **Limitations:** Local deployment does not guarantee local processing when remote providers are selected.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/Mintplex-Labs/anything-llm))
- [Official project](https://anythingllm.com/) · [Official installation / downloads](https://github.com/Mintplex-Labs/anything-llm/releases) · [Repository](https://github.com/Mintplex-Labs/anything-llm)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/Mintplex-Labs/anything-llm) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://anythingllm.com/) (2026-11-14; identity, features); [Official release inspected: v1.19.0](https://github.com/Mintplex-Labs/anything-llm/releases/tag/v1.19.0) (2026-11-14; downloads, maintenance, platforms)

## Local AI interfaces

### GPT4All

Desktop application and tooling for running supported language models locally and working with local documents.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Experiment with local conversational models through a desktop interface.
- **Compare when:** Compatible models and document processing have hardware and model-license constraints.
- **Strengths:** Local model chat and document context are combined in a desktop-oriented workflow.
- **Limitations:** Compatible models and document processing have hardware and model-license constraints.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.; Repository activity is older than one year; current maintenance has not been established.
- **Maintenance:** unverified — Repository not archived; latest repository push observed 2025-05-27. Activity is not a runtime, security, or support guarantee. No push within the preceding year was observed; current support status needs reassessment. ([evidence](https://api.github.com/repos/nomic-ai/gpt4all))
- [Official project](https://www.nomic.ai/gpt4all) · [Official installation / downloads](https://github.com/nomic-ai/gpt4all/releases) · [Repository](https://github.com/nomic-ai/gpt4all)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/nomic-ai/gpt4all) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/nomic-ai/gpt4all/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://www.nomic.ai/gpt4all) (2026-11-14; identity, features); [Official release inspected: v3.10.0](https://github.com/nomic-ai/gpt4all/releases/tag/v3.10.0) (2026-11-14; downloads, maintenance, platforms)
### Jan

Desktop AI chat application that can use local models and configured remote providers.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0; attribution request in upstream notice. **Pricing model:** free.
- **Pick for:** Use a graphical AI chat workspace with a local-model option.
- **Compare when:** Hardware requirements and privacy behavior depend on the selected model and provider.
- **Strengths:** A desktop interface lowers setup friction for experimenting with supported local chat models.
- **Limitations:** Hardware requirements and privacy behavior depend on the selected model and provider.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/janhq/jan))
- [Official project](https://www.jan.ai/) · [Official installation / downloads](https://github.com/janhq/jan/releases) · [Repository](https://github.com/janhq/jan)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/janhq/jan) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/janhq/jan/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/janhq/jan/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://www.jan.ai/) (2026-11-14; identity, features); [Official release inspected: v0.8.8](https://github.com/janhq/jan/releases/tag/v0.8.8) (2026-11-14; downloads, maintenance, platforms)
### Open WebUI

Self-hostable web interface for model chat, retrieval workflows, and connections to compatible model APIs.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Open WebUI License with branding conditions; earlier contributions retain original licenses. **Pricing model:** mixed.
- **Pick for:** Provide a shared local-network chat interface for configured models.
- **Compare when:** Current licensing includes additional branding conditions; deployment and provider configuration require review.
- **Strengths:** A self-hosted interface can present several configured model APIs consistently.
- **Limitations:** Current licensing includes additional branding conditions; deployment and provider configuration require review.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/open-webui/open-webui))
- [Official project](https://openwebui.com/) · [Official installation / downloads](https://github.com/open-webui/open-webui#quick-start) · [Repository](https://github.com/open-webui/open-webui)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/open-webui/open-webui) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/open-webui/open-webui/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms, license); [Official license text](https://raw.githubusercontent.com/open-webui/open-webui/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://openwebui.com/) (2026-11-14; identity, features); [Official release inspected: v0.13.3](https://github.com/open-webui/open-webui/releases/tag/v0.13.3) (2026-11-14; downloads, maintenance)

## Local model runtimes

### llama.cpp

C/C++ inference toolkit for supported language models with quantization and multiple hardware backends.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Deploy local inference with explicit control over model files and runtime options.
- **Compare when:** Supported architectures, build options, and model terms need separate checks.
- **Strengths:** Explicit model files and backend choices provide detailed control over inference deployment.
- **Limitations:** Supported architectures, build options, and model terms need separate checks.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/ggml-org/llama.cpp))
- [Official project](https://github.com/ggml-org/llama.cpp) · [Official installation / downloads](https://github.com/ggml-org/llama.cpp#quick-start) · [Repository](https://github.com/ggml-org/llama.cpp)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/ggml-org/llama.cpp) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/ggml-org/llama.cpp/HEAD/README.md) (2026-11-14; identity, features); [Official release inspected: v1.0.0](https://github.com/ggml-org/llama.cpp/releases/tag/v1.0.0) (2026-11-14; downloads, maintenance)
### llamafile

Local inference distribution approach that packages model-serving software into portable executables.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0; included components and models retain separate terms. **Pricing model:** free.
- **Pick for:** Distribute a supported local model runtime with fewer installation steps.
- **Compare when:** Executable size limits and model compatibility depend on platform and build.
- **Strengths:** Portable packaging can reduce runtime setup for distributing supported inference workloads.
- **Limitations:** Executable size limits and model compatibility depend on platform and build.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-09. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mozilla-ai/llamafile))
- [Official project](https://github.com/mozilla-ai/llamafile) · [Official installation / downloads](https://github.com/mozilla-ai/llamafile/releases) · [Repository](https://github.com/mozilla-ai/llamafile)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mozilla-ai/llamafile) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/mozilla-ai/llamafile/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official license text](https://raw.githubusercontent.com/mozilla-ai/llamafile/HEAD/LICENSE) (2026-11-14; license); [Official release inspected: 0.10.6](https://github.com/mozilla-ai/llamafile/releases/tag/0.10.6) (2026-11-14; downloads, maintenance)
### LocalAI

Self-hosted inference server exposing compatible APIs for supported language, image, and audio backends.

- **Platforms:** macOS, Linux, Web. **License:** MIT. **Pricing model:** free.
- **Pick for:** Host an application-facing inference service with configurable model backends.
- **Compare when:** Native installation documentation targets Linux and Apple Silicon macOS; Windows requires a supported container or WSL path. Backend acceleration varies.
- **Strengths:** Compatible application APIs allow different inference backends to be exposed through one service.
- **Limitations:** Native installation documentation targets Linux and Apple Silicon macOS; Windows requires a supported container or WSL path. Backend acceleration varies.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mudler/LocalAI))
- [Official project](https://localai.io/) · [Official installation / downloads](https://github.com/mudler/LocalAI/releases) · [Repository](https://github.com/mudler/LocalAI)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mudler/LocalAI) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/mudler/LocalAI/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official official documentation](https://localai.io/) (2026-11-14; identity, features); [Official installation documentation](https://localai.io/basics/getting_started/) (2026-11-14; downloads); [Official release inspected: v4.12.1](https://github.com/mudler/LocalAI/releases/tag/v4.12.1) (2026-11-14; downloads, maintenance, platforms)
### Ollama

Local model runtime with model management, a command-line interface, and an API for applications.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Run supported language models locally and connect applications through an API.
- **Compare when:** Memory, acceleration support, and model licenses vary; optional cloud use changes data handling.
- **Strengths:** Model management and a local API simplify connecting compatible applications to local inference.
- **Limitations:** Memory, acceleration support, and model licenses vary; optional cloud use changes data handling.; Software licensing does not cover model weights, optional hosted services, or provider usage charges; verify those separately.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/ollama/ollama))
- [Official project](https://ollama.com/) · [Official installation / downloads](https://github.com/ollama/ollama/releases) · [Repository](https://github.com/ollama/ollama)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/ollama/ollama) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/ollama/ollama/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://ollama.com/) (2026-11-14; identity, features); [Official release inspected: v0.40.16](https://github.com/ollama/ollama/releases/tag/v0.40.16) (2026-11-14; downloads, maintenance, platforms)
