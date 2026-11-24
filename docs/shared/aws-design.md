# AWS architecture decisions

Choose services from access, resilience and operational requirements.

## Learn

EC2 offers virtual machines, Lambda runs event-driven functions, and managed container services support other execution models. The best choice depends on duration, scaling, state and operational needs.

S3 is object storage, EBS provides block storage for supported compute use, and EFS provides a shared file interface. RDS and DynamoDB serve different relational and key-value/document access patterns.

Design IAM, networking, encryption, backup and observability alongside compute. Multi-AZ and multi-Region choices have different cost, latency and failure properties. Read the specific service guarantees instead of generalizing from a name.

## Worked example

An application stores immutable images and serves them globally. Object storage with a content-delivery layer is a plausible design. It is not a replacement for a transactional database that needs relational constraints.

## Practice safely

1. Draw a small web application with a managed database and object storage.
2. Mark public and private paths.
3. Describe one-zone failure behavior and backup recovery.
4. Explain why each service matches the access pattern.

## Check your understanding

Which requirement most directly favors object storage?

- A shared POSIX filesystem for all workloads
- A CPU instruction scheduler
- Durable retrieval of objects by key
- An IAM login session

<details><summary>Answer and explanation</summary>

Durable retrieval of objects by key. Object storage is organized around objects and keys, not arbitrary block-device semantics.

</details>

## Further study

- https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

