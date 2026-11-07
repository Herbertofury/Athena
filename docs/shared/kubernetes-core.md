# Kubernetes desired state and workloads

Understand control loops, Pods, Deployments and Services.

## Learn

The API server exposes cluster state. Controllers reconcile actual state toward declared desired state. The scheduler assigns Pods to nodes; node components run workloads. A manifest accepted by the API is not proof of healthy application behavior.

Pods are the smallest deployable units and may contain cooperating containers. Deployments manage replicated stateless workloads through ReplicaSets. Services provide a stable access abstraction to selected endpoints.

Use readiness, liveness and startup probes carefully. A bad liveness probe can create restart loops. Requests guide scheduling; limits constrain resources with behavior that differs for CPU and memory.

## Worked example

A Deployment has three Pods but only one is ready. The replica count is not the same as three healthy serving instances. Inspect events, probes, logs and resource pressure.

## Practice safely

1. Read a small Deployment and Service manifest.
2. Explain labels and selectors.
3. In an approved disposable cluster, inspect rollout status and events.
4. Document a rollback and never target a production context by accident.

## Check your understanding

Which mechanism continually reconciles desired and actual state?

- A README alone
- A DNS TTL
- A local browser cache
- A controller loop

<details><summary>Answer and explanation</summary>

A controller loop. Controllers observe state and take actions toward the declared target.

</details>

## Further study

- https://kubernetes.io/docs/concepts/architecture/
- https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

