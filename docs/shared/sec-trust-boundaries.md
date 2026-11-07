# Draw boundaries and allowed flows

Use an explicit flow matrix instead of trusting a network label.

## Learning goals

- Identify a trust boundary in a simple service.
- Separate network reachability from identity and application authorization.
- Apply default-deny reasoning without changing a real firewall.

## Learn

Draw Cedar’s service as components: staff device, web front end, booking application, database and backup storage. Draw arrows for necessary operations, not just boxes for products. Each arrow should say who starts the communication, what it carries and why it is needed. This is a small data-flow model.

A trust boundary is a place where assumptions or authority change. Moving from a staff browser to a server crosses one; moving from an application identity to a database crosses another. Input must be checked where it is used, and authority must be scoped at each boundary. A trusted internal label does not make every request legitimate.

Segmentation limits allowed communication between zones or workloads. A VLAN separates Layer 2 broadcast domains; routing and enforcement determine which inter-zone flows are possible. A firewall decision may use addresses, ports, protocol or additional context. Merely placing a system in a private address range is not a complete access policy.

Zero trust does not mean blocking everything or distrusting every human. It rejects automatic trust based only on location or ownership and makes access decisions around resources and context. Network controls, device state, identity checks and application permissions can complement one another. Buying a product does not by itself establish a zero-trust architecture.

Choose a default-deny model for the paper exercise: a flow must match an explicit allow rule. Staff-to-web TCP 443 and application-to-database TCP 5432 may be justified; guest-to-database should not be. Port numbers are examples, not proof of protocol identity. The toy model ignores return traffic, stateful inspection, DNS, management and many operational dependencies.

Test positive and negative paths. An allowed flow must support its intended user task; a denied flow must actually be denied under the specified conditions. Include failure recovery and administrative access in a real design review. Do not try the matrix against real addresses or edit your device’s network settings for this lesson.

## Worked example

The synthetic flow matrix permits staff → web on TCP 443 and app → database on TCP 5432. It denies guest → database and staff → database because no rule justifies either. A permitted web connection still needs server identity checks and per-request authorization. If the application is compromised, its permitted database path could still be abused within its privileges. That residual risk calls for narrower database permissions, application controls and monitoring, not the claim that segmentation solved everything.

## Practice safely

1. Draw the five Cedar components and label each necessary arrow.
2. Mark two boundaries and write the assumptions that change at them.
3. Predict the supplied flows.json decisions.
4. Run python3 labs/security-foundations/offline_lab.py flows.
5. Add a paper-only backup or monitoring dependency, including identity and purpose.
6. Explain a misuse that remains possible through an allowed flow and a separate control for it.

## Evidence to keep

- Labeled data-flow sketch and policy justifications.
- Predicted and actual results for six synthetic flows.
- One allowed-path residual risk and an appropriate separate control.

## Original check 1

A database uses a private IP address. Which conclusion follows?

- Every internal user is authorized
- A complete security policy already exists
- TLS is unnecessary
- It is not by itself proof of access control or safe configuration

<details><summary>Answer and explanation</summary>

It is not by itself proof of access control or safe configuration. Address scope and authorization are different properties.

</details>

## Original check 2

An allowed network connection proves which result?

- The intended application action is authorized
- The client is a trustworthy person
- A network rule permits the modeled flow; other checks remain
- The data is backed up

<details><summary>Answer and explanation</summary>

A network rule permits the modeled flow; other checks remain. Reachability is only one gate. Identity, application permissions and business correctness are separate.

</details>

## Original check 3

Which test is missing from a plan that checks only approved flows?

- A scan of unrelated public systems
- A weaker password policy
- A change to the real router
- A check that forbidden flows are denied

<details><summary>Answer and explanation</summary>

A check that forbidden flows are denied. Negative tests show that intended boundaries are actually enforced in the modeled scope.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

This is a pure rule comparison, not a firewall emulator, packet test, network scan or complete architecture.

## Official references

- [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)

- [NIST SP 800-30 Revision 1: Guide for Conducting Risk Assessments](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-30r1.pdf)

