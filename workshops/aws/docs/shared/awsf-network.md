# Explain VPC reachability as several independent conditions

Use routes and security-group ideas without equating a toy path with working connectivity.

## Learning goals

- Distinguish route selection from traffic permission.
- Explain stateful security-group response handling conceptually.
- List the missing checks before claiming real end-to-end reachability.

## Learn

A VPC design describes where network interfaces live, how traffic is directed and which controls permit it. A route table answers where packets for a destination should go. A security group answers whether selected traffic is permitted at an associated resource interface. Neither question replaces the other. A permitted application port cannot compensate for a missing route, and a route toward a destination does not grant permission to use the application listening there.

AWS route tables use destination matching, including the most specific applicable prefix. A default route is a fallback, not evidence that every destination should follow it. A more specific route can direct one destination range elsewhere. Sketch the source subnet, destination, matching route and intended next hop before discussing security rules. Prefix matching is a paper concept here. The local exercise instead uses invented node labels and graph edges without addresses or prefix evaluation. It does not create a subnet, attach a gateway or inspect a live route table.

Security groups are stateful: response traffic for permitted connections is handled differently from requiring a separate independent inbound rule for every return packet. This principle does not mean that all related application behavior is automatically permitted. A separate new connection still needs its own applicable permission. Network ACLs introduce a different, stateless layer with inbound and outbound rules. Our small model does not reproduce connection tracking or evaluate all of these controls, so retain their differences in the explanation.

Calling a subnet public depends on its routing relationship to an internet gateway, but that label alone does not establish that a particular instance is reachable from the internet. Addressing, attachment, route choice, permissions and the application itself all matter. DNS may resolve an unexpected address; a process may be stopped; a host firewall may refuse traffic. A convincing connectivity claim therefore names the source, destination, protocol, port and time of an observed test, not just a subnet nickname.

For the fictional receipt application, the local graph has a route from client through edge and app to db. The policy-edge list permits client to edge and edge to app, but omits app to db. Predict why the full route exists while no fully permitted path does. This is graph reasoning, not prefix matching or security-group evaluation. Keep the omitted gateway state, return traffic, DNS, network ACLs and host behavior on a separate checklist so the graph does not imply real reachability.

The Python command performs local reasoning only and opens no sockets. It is safe to run without an AWS account or network access. Keep a diagram alongside the receipt so another learner can see why the route and policy checks were considered separately. In a real environment, authorized configuration inspection and bounded connectivity tests would be needed. No result from this workshop certifies VPC isolation, exposure, security-group configuration or a functioning production connection.

## Worked example

The route graph contains client → edge → app → db, but app → db is missing from the allowed-edge list. The local receipt therefore has a route and no permitted path. It evaluates neither real routes nor AWS packet filtering.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py network
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Draw source, destination and intended next hop.
2. Record protocol and port separately from destination prefix.
3. Run python3 labs/aws-workshop/run_lab.py network.
4. Explain why the route exists but the missing app-to-db allow edge blocks a permitted path.
5. Name at least four omitted end-to-end conditions.
6. Write a narrow conclusion that avoids saying a real VPC was tested.

## Evidence to keep

- A labeled source-to-destination sketch.
- The observed route and missing app-to-db policy edge, with a narrow local conclusion.
- An explicit list of omitted network and application checks.

## Original check 1

A security group permits a port but no route reaches the destination. What is missing?

A. A longer resource name
B. A second identical allow rule
C. A larger billing budget
D. A usable routing path

<details><summary>Answer and reasoning</summary>

D. A usable routing path

Permission and route selection solve separate problems; an allow rule cannot create a network path.

</details>

## Original check 2

What does stateful security-group behavior mean conceptually?

A. Response traffic for a permitted connection is tracked
B. Every new connection is allowed
C. Network ACLs become stateful
D. DNS always resolves correctly

<details><summary>Answer and reasoning</summary>

A. Response traffic for a permitted connection is tracked

Statefulness concerns connection tracking and responses, not blanket permission for unrelated connections or other network layers.

</details>

## Original check 3

Both local route and permission checks pass. What is justified?

A. The application is publicly reachable
B. The modeled necessary conditions passed, with other checks outstanding
C. A real gateway was attached
D. A penetration test passed

<details><summary>Answer and reasoning</summary>

B. The modeled necessary conditions passed, with other checks outstanding

The model omits real network configuration and application behavior, so its conjunction is not a full reachability proof.

</details>

## Limits

No VPC, subnet, gateway, security group, network ACL, DNS request or socket is created or tested. Route plus permission is necessary only within a simplified model, not sufficient real reachability proof.

## Official references

- https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html
- https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html
