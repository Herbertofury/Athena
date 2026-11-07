# Containers, images and isolation

Separate an image, a running container and an orchestrator.

## Learn

A container image packages filesystem content and metadata. A running container adds process state and runtime configuration. Containers share the host kernel rather than providing a separate kernel like a full VM.

Images are layered and should be pinned appropriately. Keep secrets out of image layers, minimize privileges, and scan/update dependencies. Rebuilding an image is not enough if old vulnerable workloads remain running.

Orchestration coordinates placement, health and desired state. It does not automatically make an application stateless, secure or highly available. Storage and identity still require explicit design.

## Worked example

Deleting a container may remove its writable layer. Data that must survive needs a suitable persistent storage design and backup strategy.

## Practice safely

1. Inspect an official small image’s manifest or Dockerfile.
2. Identify base image, process and exposed ports.
3. Design a non-root runtime with read-only paths where possible.
4. Explain image versus volume persistence.

## Check your understanding

What do containers normally share with their host?

- Every process’s private memory
- All user passwords
- The host kernel
- A guaranteed backup

<details><summary>Answer and explanation</summary>

The host kernel. Kernel sharing is a core distinction from full virtual machines.

</details>

## Further study

- https://kubernetes.io/docs/concepts/containers/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

