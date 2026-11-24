# Certified Kubernetes Administrator

**Blueprint:** Rolling Kubernetes version; provider page reports v1.37 on review date

**Reviewed:** 2026-11-07

**Verification:** Official Linux Foundation page read; rolling version requires pre-booking recheck

**Coverage:** Introductory lessons + guided lab roadmap; not a complete exam-preparation course

## Ordered study path

1. [Containers, images and isolation](../shared/containers.md)
2. [Kubernetes desired state and workloads](../shared/kubernetes-core.md)
3. [Kubernetes networking, storage and troubleshooting](../shared/kubernetes-operations.md)
4. [Authentication, authorization and accounting](../shared/identity.md)
5. [Metrics, logs, traces and SLOs](../shared/observability.md)
6. [Availability, backup, RTO and RPO](../shared/resilience.md)

## Domain roadmap

These are paraphrased domain headings, not an exhaustive official-objective transcript. Every row remains a roadmap until detailed instruction and assessment are verified.

- [ ] Storage administration: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Cluster and workload diagnosis: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Workload deployment and scheduling: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Cluster setup, lifecycle and access: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Services, DNS and networking: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.

## Guided capstone

### Diagnose a disposable Kubernetes workload

1. Use an approved disposable cluster and record Kubernetes version, context and namespace.
2. Deploy a small workload and Service with explicit labels, requests and readiness behavior.
3. Introduce a harmless selector mismatch, diagnose endpoints/events and repair it.
4. Exercise rollout and rollback; inspect a storage claim only in a disposable environment.
5. Map results to the current CKA curriculum and record missing cluster lifecycle/networking/storage tasks.

### Acceptance evidence

- Correct context/namespace and version evidence.
- Ready endpoints, rollout/rollback and failure diagnosis outputs.
- Explicit teardown and no claim of whole-exam readiness.

## Version and booking notes

- Two-hour performance-based command-line assessment. Environment moves with recent Kubernetes minor versions; keep lab version independent and visible.
- Current domain summary explicitly includes Helm, Kustomize, operators/CRDs, extension interfaces, Gateway API, Ingress and CoreDNS.

**Price status:** Official exam-only price; page includes two exam attempts and two simulator attempts

## Official sources

- [Current domains, environment, price and linked curriculum](https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/)
