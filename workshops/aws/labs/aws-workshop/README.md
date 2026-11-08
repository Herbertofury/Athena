# AWS foundations: architecture reasoning on your own computer

Ten original, deterministic Python demonstrations turn architectural questions into inspectable evidence. They use **fictional records and explicit toy assumptions**, not an AWS account. Athena is the learning product here, not Amazon Athena the analytics service.

Requirements: Python 3.10 or later, standard library only. No installation, AWS CLI, SDK, credentials, network, account, deployment or charges. The runner accepts only a fixed exercise name, reads one bundled JSON fixture, and prints JSON. It does not write application files. Bytecode caching is disabled in the CLI before importing the lab.

From the AWS workshop folder:

```sh
python3 labs/aws-workshop/run_lab.py --help
python3 labs/aws-workshop/run_lab.py identity
python3 labs/aws-workshop/run_lab.py network
python3 labs/aws-workshop/run_lab.py storage
python3 labs/aws-workshop/run_lab.py compute
python3 labs/aws-workshop/run_lab.py queues
python3 labs/aws-workshop/run_lab.py database
python3 labs/aws-workshop/run_lab.py resilience
python3 labs/aws-workshop/run_lab.py operations
python3 labs/aws-workshop/run_lab.py cost
python3 labs/aws-workshop/run_lab.py capstone
python3 -B -m unittest discover -s tests -p test_aws_lab.py -v
```

Every result identifies `execution_kind: synthetic_offline_model` and `real_aws_executed: false`. The capstone refuses to convert local success into deployment approval. Invalid CLI arguments return exit status 2 with a JSON error on stdout; success and help use status 0. There is no arbitrary file argument or hidden live mode.

## Learning loop

1. Read the relevant section of WORKSHEET.md and predict the output before running it.
2. Run exactly one fixed command. Compare the evidence with your prediction.
3. Inspect the corresponding fixture and short function in lab.py. Explain the assumption that makes the answer true.
4. Check ANSWER-KEY.md. Write one additional fact needed before applying the idea to AWS.
5. Complete the paper variations without provisioning anything. Optional local function edits are separate experiments, not new AWS evidence.

## Why these models are narrow

- Identity makes exact-match allow/deny and missing approval visible. It does **not** implement IAM policy evaluation.
- Network intersects two small directed graphs. It does **not** emulate VPC routing, security groups, network ACLs, NAT or return traffic.
- Storage, compute and database use one requirements matrix. All feasible candidates and ties remain visible; there is no universal recommendation.
- Queues show repeated delivery, an atomic toy idempotency record, acknowledgment loss and redrive. They do **not** implement SQS or promise exactly-once business processing.
- Resilience separates surviving replica count from provided restore/data-age measurements. No failover or restore is performed.
- Operations classify fictional evidence. No CloudWatch, CloudTrail or Config records were collected.
- Cost uses invented Decimal rates. A budget comparison is neither a quote nor a spending cap.

Read CONTRACTS.md for exact data and error rules. Read the workshop's research references for verified AWS facts and currency caveats. This pack supports selected Cloud Practitioner and Solutions Architect concepts, not comprehensive exam preparation, certification readiness, cloud security validation or production readiness.
