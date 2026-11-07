# Describe the service before choosing the cloud

Separate cloud characteristics, service models and deployment models using one fictional workload.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Explain the five NIST characteristics in ordinary language.
- Distinguish service model from deployment model.
- Write a workload contract before naming a vendor product.

## Learn

Cloud is an operating model, not a synonym for any remote computer. NIST describes five essential characteristics: self-service provisioning, broad network access, pooled resources, rapid elasticity and measured use. A hosted server that needs a support ticket for every capacity change may still be useful, but a label alone does not show which cloud characteristics it provides.

Service models describe what the consumer receives and controls. IaaS provides infrastructure on which the consumer manages operating systems and applications. PaaS offers a managed application platform. SaaS supplies an application the consumer uses. Real solutions combine models, and the boundary depends on the specific service. A convenient service name is not a complete responsibility agreement.

Deployment models answer a different question. NIST distinguishes private, community, public and hybrid clouds by use and composition. Private does not simply mean physically in your office. Public does not mean your data should be publicly readable. Hybrid is a composition with integration between distinct cloud infrastructures; two unrelated vendor accounts do not by themselves explain an architecture.

Our fictional workload is a workshop report service. Staff submit small reports; a dashboard reads them; a background job prepares summaries. Start with who uses it, which data is retained, normal and peak demand, downtime tolerance, data-loss tolerance and the team’s operating skills. These requirements help compare options before an attractive product name biases the decision.

Write a service contract in plain language: what must work, who maintains each part, what can fail, what evidence would demonstrate success and what is out of scope. A managed database may reduce one maintenance burden while adding service limits or recovery choices you still need to understand. Fewer servers to administer does not mean no operational decisions remain.

This workshop does not open an account or deploy the fictional service. You will classify a workload, calculate bounded scenarios, inspect a local change report and perform one actual temporary-file restore. Those activities build reasoning habits. They do not demonstrate provider-console fluency, real network behavior, service quotas or a successful cloud deployment.

## Worked example

The team could run its own application on virtual machines, deploy it to a managed runtime or buy a suitable hosted reporting application. The choice changes control and work, not the underlying need to manage users and data. Record two requirements that favor each option, then one uncertainty to check in current service documentation. Do not infer that the cheapest-looking compute rate answers the entire decision.

## Practice safely

1. Write a five-line description of the fictional report service and its users.
2. Explain each NIST characteristic with your own example and counterexample.
3. Classify three candidate approaches as IaaS, PaaS or SaaS, noting mixed components.
4. State a deployment model separately from the service model.
5. List five questions that must be answered before a real deployment.
6. Mark the entire cloud deployment as unexecuted in your evidence worksheet.

Use the [offline lab guide](../../labs/cloud-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Which statement correctly separates two cloud classifications?

A. IaaS is a service model; public is a deployment model
B. IaaS is a deployment model and public is a programming language
C. SaaS means every resource is publicly readable
D. Private cloud must be in your own office

<details><summary>Answer and reasoning</summary>

A. IaaS is a service model; public is a deployment model. Service models describe the delivered capability and control boundary; deployment models describe how cloud infrastructure is used and composed.

</details>

### Check 2

What does public cloud imply about the fictional reports?

A. They should be public files
B. Their access still needs an explicit design
C. Their confidentiality no longer matters
D. They cannot be encrypted

<details><summary>Answer and reasoning</summary>

B. Their access still needs an explicit design. Public describes the cloud deployment model, not authorization to expose customer data.

</details>

### Check 3

Which evidence is missing after completing only this pack?

A. A local calculation
B. An original worksheet
C. An executed real-cloud deployment and its validation
D. A synthetic fixture

<details><summary>Answer and reasoning</summary>

C. An executed real-cloud deployment and its validation. All provider-side labs remain unexecuted; local exercises cannot substitute for deployment evidence.

</details>

## Evidence to keep

- A workload contract and comparison of three approaches.
- Separate service/deployment classifications with reasons.
- An explicit unexecuted real-cloud status.

## Limits

This is a vendor-neutral conceptual foundation. It is not a deployed architecture, procurement recommendation or complete cloud certification curriculum.

## Official references

- https://csrc.nist.gov/pubs/sp/800/145/final
- https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf
