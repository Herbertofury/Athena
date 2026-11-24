# Kubernetes networking, storage and troubleshooting

Trace failures across workload, node and cluster layers.

## Learn

Pod networking, Service routing and external ingress/gateway behavior are separate layers. NetworkPolicy enforcement depends on a compatible network implementation. A policy manifest alone is not proof of enforcement.

PersistentVolumeClaims request storage through cluster storage mechanisms. Access modes, reclaim policy and storage-class behavior affect availability and deletion. Backups need application-consistent data and tested recovery.

Troubleshoot from evidence: context/namespace, resource status, events, logs, endpoints, DNS, node health and control-plane signals. Use the least disruptive diagnostic first.

## Worked example

A Service has no endpoints because its selector does not match ready Pods. Changing the external load balancer is unlikely to fix that internal selection error.

## Practice safely

1. Inspect a fictitious Service selector and Pod labels.
2. Find the mismatch.
3. Compare a PVC’s status, storage class and reclaim policy.
4. Write a non-destructive cluster troubleshooting checklist.

## Check your understanding

A Service has no endpoints. What should you check early?

- Pod labels, selectors and readiness
- The color of the dashboard
- Every cloud account password
- Only the container image logo

<details><summary>Answer and explanation</summary>

Pod labels, selectors and readiness. Service selection and ready backing Pods are essential to endpoint creation.

</details>

## Further study

- https://kubernetes.io/docs/concepts/services-networking/
- https://kubernetes.io/docs/tasks/debug/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

