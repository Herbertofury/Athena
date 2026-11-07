# Trace access and choose a data interface

Keep routing, network rules, service behavior, identity and storage semantics distinct.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Separate assumed network reachability from authorized application access.
- Compare object, file and block interfaces by workload need.
- Explain why storage durability is not the same as a recoverable backup.

## Learn

A request can fail at several layers. A route may be absent, a network rule may exclude traffic, a service may not be listening or the application may reject an identity. Treat these as different hypotheses. Opening a wider network range does not fix a stopped process or missing application permission, and it can create unnecessary exposure.

AWS security groups are one provider example of controls on associated resources’ traffic. Their rules and stateful behavior are specific to that service. Our exercise does not implement them. It simply receives four explicit boolean assumptions and reports whether all are true. No packet is sent, no firewall is changed and no actual identity is tested.

Data interfaces also differ. Object storage addresses objects through a service interface, file storage provides shared-file semantics and block storage supplies disk-like blocks for a host or other consumer. Azure documents examples of each; S3 is an object-storage example. Choosing among them starts with how the application reads and writes, not with a generic request for more storage.

The fictional report documents fit an object-oriented access pattern, while an application that requires a shared filesystem may need a different interface. That is a starting hypothesis, not a universal recommendation. Check update patterns, consistency behavior, metadata, maximum sizes, access controls and integration requirements for the exact service before committing to a design.

Separate durability, availability and recoverability. Data can remain intact while a service is temporarily unavailable. A highly durable copy can faithfully preserve an accidental overwrite or an unwanted change. Recovery planning therefore needs a usable earlier point, retention decisions and a tested way to restore, not merely confidence that a storage service rarely loses bits.

In the fixture, the route and network assumptions pass but the service-listening assumption fails. A second case passes those three but fails the identity assumption. Neither result diagnoses a live system. Write what evidence you would collect next, such as authorized service-health observations or an intended user’s access result, without scanning a target or broadening permissions.

## Worked example

The network command returns service_listening as the failed baseline assumption and identity_allows for the second case. It does not claim an actual connection was blocked. For storage, write why a report object and a virtual-machine disk have different access patterns. Later, the restore exercise will prove only that a local synthetic earlier copy can be recovered into a new file.

## Practice safely

1. Draw a request path with routing, network, service and identity checkpoints.
2. Predict both fixed network-model results.
3. Run python3 labs/cloud-workshop/run_lab.py network.
4. Choose an object, file or block interface for three invented needs and explain each choice.
5. Give an example of durable data that still needs recovery from an earlier point.
6. List which network and storage behaviors remain untested in a real cloud.

Use the [offline lab guide](../../labs/cloud-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

All network assumptions pass, but the service is not listening. What follows?

A. Open every port
B. The data must be deleted
C. A wider network rule alone does not start the service
D. The identity check is proven correct

<details><summary>Answer and reasoning</summary>

C. A wider network rule alone does not start the service. Different layers require different evidence and remedies; broad exposure does not repair a stopped service.

</details>

### Check 2

Which interface is most directly disk-like?

A. An email inbox
B. Every SaaS application
C. An authorization role
D. Block storage

<details><summary>Answer and reasoning</summary>

D. Block storage. Block storage exposes blocks for a consumer such as a host; object and file interfaces have different semantics.

</details>

### Check 3

Why can durable storage still need backups or earlier recovery points?

A. An accidental overwrite may itself be stored durably
B. Durability prevents all mistakes
C. Availability and durability are identical
D. Backups always prove zero data loss

<details><summary>Answer and reasoning</summary>

A. An accidental overwrite may itself be stored durably. Preserving current bits does not guarantee a usable earlier state or a verified restore process.

</details>

## Evidence to keep

- An annotated request path and two model outputs.
- Three interface choices with assumptions.
- A durability/availability/recovery distinction.

## Limits

No live traffic, provider networking, object-store API or cloud storage durability is tested. The four-gate exercise is not a firewall or full connectivity simulator.

## Official references

- https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html
- https://learn.microsoft.com/en-us/azure/architecture/storage/storage-get-started
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
