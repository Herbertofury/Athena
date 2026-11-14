"""Original AWS foundation lessons. Local models are not AWS engines or configurations.

Each authored lesson is explicit and self-contained; source URLs were verified
against research/aws-sources.json on 2026-11-08. No network calls on import.
"""

LESSONS = [{'id': 'awsf-identity',
  'title': 'Trace AWS identity decisions without inventing an IAM engine',
  'category': 'Cloud & infrastructure',
  'summary': 'Separate who is calling, what they request and the layers that constrain access.',
  'learningGoals': ['Distinguish a role session from a long-lived identity credential.',
                    'Trace allow, implicit deny and explicit deny in a bounded example.',
                    'Explain why a local decision is not proof of real AWS authorization.'],
  'explain': ['An application that reads order receipts needs an identity, a permitted action and an '
              'intended resource. Those are separate design choices. In AWS, IAM roles can provide temporary '
              'credentials for an assumed role session, avoiding the need to distribute a permanent '
              'application access key. The architectural question is not simply whether the developer can '
              'log in. It is which workload will act, how it obtains its session, which operations it needs '
              'and when that access should end.',
              'Start a permission ledger with principal, action, resource and context. A reader needs a '
              'narrowly described read operation on the intended objects, rather than every operation on '
              'every bucket. A different component may need to write new objects without deleting existing '
              'ones. Keeping those responsibilities separate makes review and later investigation easier. A '
              'convenient wildcard is a decision to expand authority, not merely shorthand for a long list. '
              'Record why each permission is necessary.',
              'IAM policy evaluation includes default denial and explicit deny, but a classroom evaluator is '
              'not IAM. Identity policies, resource policies, permissions boundaries, organization controls '
              'and session policies can interact, with important exceptions and principal-specific behavior. '
              'Our model separately checks a fictional allow/deny ledger and a required human approval '
              'label. That approval gate is a teaching workflow, not an IAM policy feature. A model-level '
              'allow therefore cannot establish actual AWS authorization or substitute for the required '
              'owner decision.',
              'Separate authorization from authentication and from audit. Authentication establishes an '
              'identity or session. Authorization determines whether that identity may perform a particular '
              'request under applicable controls. An audit record helps explain what occurred, but its '
              'existence does not grant permission. Similarly, encrypting a receipt does not automatically '
              'make its readers appropriate. The review should ask independent questions about access scope, '
              'credential handling, data protection and the records needed to investigate misuse.',
              'In the fictional receipt service, the read request matches the reader allow, while the write '
              'guard applies to a different action. However, the required owner approval is missing, so the '
              'local outcome is approval_required. Predict that result before running the command. Discuss a '
              'separate paper-only request with a conflicting explicit deny, and another with no matching '
              'allow. Keep those paper cases distinct from the actual fixed receipt. This avoids pretending '
              'the default fixture executed cases it never received.',
              'Use invented resource labels and no credentials in this workshop. The executable snippet is '
              'ordinary local Python, not an AWS CLI request or a policy deployment. Before applying a real '
              'design, an authorized team would inspect the actual policy documents, trust relationships, '
              'account boundaries and service behavior, then validate the intended requests safely. Your '
              'evidence here is a reasoning trace and a list of missing real-world checks. It is not an IAM '
              'approval, security certification or production access test.'],
  'example': 'The fixed read/orders request matches reader, while write-guard does not match its action. The '
             'separate teaching approval gate requires owner, but approvals is empty: the observed outcome '
             'is approval_required. Explicit-deny and missing-allow cases are paper reasoning, not the '
             'default fixture outcome.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py identity',
  'codeLanguage': 'sh',
  'lab': ['Write a principal/action/resource/context ledger for the fictional reader.',
          'Predict why a matching read allow still leaves the owner approval missing.',
          'Run python3 labs/aws-workshop/run_lab.py identity from the workshop directory.',
          'Compare approval_required and the missing owner with your prediction.',
          'Discuss an explicit-deny conflict on paper and label it unexecuted.',
          'Keep the receipt and explain why a teaching approval gate is not IAM.'],
  'question': 'A matching allow and explicit deny conflict in this teaching case. What wins?',
  'options': ['The explicit deny',
              'The most recently written statement',
              'The allow because reading is harmless',
              'The shorter policy'],
  'answer': 0,
  'why': 'An explicit deny overrides an allow in this bounded case; actual IAM evaluation has additional '
         'policy layers and context.',
  'additionalChecks': [{'question': 'Why prefer a workload role over distributing a permanent application '
                                    'access key?',
                        'options': ['A role removes the need to review permissions',
                                    'The workload can use temporary role-session credentials',
                                    'Roles guarantee all actions are denied',
                                    'Temporary credentials never expire'],
                        'answer': 1,
                        'why': 'Temporary role credentials avoid distributing a permanent application key, '
                               'while permission scope and credential use still require review.'},
                       {'question': 'What does this local receipt establish?',
                        'options': ['That the real bucket is secure',
                                    'That an AWS session was authenticated',
                                    'How the supplied simplified rules treated the fictional request',
                                    'That all organization policies were checked'],
                        'answer': 2,
                        'why': 'The model has no AWS connection, session or full policy engine, so its '
                               'evidence is limited to its own inputs and rules.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['iam-evaluation', 'shared-responsibility'],
  'sources': ['https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html',
              'https://aws.amazon.com/compliance/shared-responsibility-model/'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A four-part request ledger with a narrow purpose.',
               'An observed missing-owner approval result, separate from paper deny reasoning.',
               'A list of real IAM layers and trust checks left untested.'],
  'limitations': 'No IAM APIs, real credentials, role assumptions, policy deployment, trust-policy '
                 'validation or authorization boundary are executed. The local approval gate is a teaching '
                 'workflow, not an IAM feature.'},
 {'id': 'awsf-network',
  'title': 'Explain VPC reachability as several independent conditions',
  'category': 'Cloud & infrastructure',
  'summary': 'Use routes and security-group ideas without equating a toy path with working connectivity.',
  'learningGoals': ['Distinguish route selection from traffic permission.',
                    'Explain stateful security-group response handling conceptually.',
                    'List the missing checks before claiming real end-to-end reachability.'],
  'explain': ['A VPC design describes where network interfaces live, how traffic is directed and which '
              'controls permit it. A route table answers where packets for a destination should go. A '
              'security group answers whether selected traffic is permitted at an associated resource '
              'interface. Neither question replaces the other. A permitted application port cannot '
              'compensate for a missing route, and a route toward a destination does not grant permission to '
              'use the application listening there.',
              'AWS route tables use destination matching, including the most specific applicable prefix. A '
              'default route is a fallback, not evidence that every destination should follow it. A more '
              'specific route can direct one destination range elsewhere. Sketch the source subnet, '
              'destination, matching route and intended next hop before discussing security rules. Prefix '
              'matching is a paper concept here. The local exercise instead uses invented node labels and '
              'graph edges without addresses or prefix evaluation. It does not create a subnet, attach a '
              'gateway or inspect a live route table.',
              'Security groups are stateful: response traffic for permitted connections is handled '
              'differently from requiring a separate independent inbound rule for every return packet. This '
              'principle does not mean that all related application behavior is automatically permitted. A '
              'separate new connection still needs its own applicable permission. Network ACLs introduce a '
              'different, stateless layer with inbound and outbound rules. Our small model does not '
              'reproduce connection tracking or evaluate all of these controls, so retain their differences '
              'in the explanation.',
              'Calling a subnet public depends on its routing relationship to an internet gateway, but that '
              'label alone does not establish that a particular instance is reachable from the internet. '
              'Addressing, attachment, route choice, permissions and the application itself all matter. DNS '
              'may resolve an unexpected address; a process may be stopped; a host firewall may refuse '
              'traffic. A convincing connectivity claim therefore names the source, destination, protocol, '
              'port and time of an observed test, not just a subnet nickname.',
              'For the fictional receipt application, the local graph has a route from client through edge '
              'and app to db. The policy-edge list permits client to edge and edge to app, but omits app to '
              'db. Predict why the full route exists while no fully permitted path does. This is graph '
              'reasoning, not prefix matching or security-group evaluation. Keep the omitted gateway state, '
              'return traffic, DNS, network ACLs and host behavior on a separate checklist so the graph does '
              'not imply real reachability.',
              'The Python command performs local reasoning only and opens no sockets. It is safe to run '
              'without an AWS account or network access. Keep a diagram alongside the receipt so another '
              'learner can see why the route and policy checks were considered separately. In a real '
              'environment, authorized configuration inspection and bounded connectivity tests would be '
              'needed. No result from this workshop certifies VPC isolation, exposure, security-group '
              'configuration or a functioning production connection.'],
  'example': 'The route graph contains client → edge → app → db, but app → db is missing from the '
             'allowed-edge list. The local receipt therefore has a route and no permitted path. It evaluates '
             'neither real routes nor AWS packet filtering.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py network',
  'codeLanguage': 'sh',
  'lab': ['Draw source, destination and intended next hop.',
          'Record protocol and port separately from destination prefix.',
          'Run python3 labs/aws-workshop/run_lab.py network.',
          'Explain why the route exists but the missing app-to-db allow edge blocks a permitted path.',
          'Name at least four omitted end-to-end conditions.',
          'Write a narrow conclusion that avoids saying a real VPC was tested.'],
  'question': 'A security group permits a port but no route reaches the destination. What is missing?',
  'options': ['A longer resource name',
              'A second identical allow rule',
              'A larger billing budget',
              'A usable routing path'],
  'answer': 3,
  'why': 'Permission and route selection solve separate problems; an allow rule cannot create a network '
         'path.',
  'additionalChecks': [{'question': 'What does stateful security-group behavior mean conceptually?',
                        'options': ['Response traffic for a permitted connection is tracked',
                                    'Every new connection is allowed',
                                    'Network ACLs become stateful',
                                    'DNS always resolves correctly'],
                        'answer': 0,
                        'why': 'Statefulness concerns connection tracking and responses, not blanket '
                               'permission for unrelated connections or other network layers.'},
                       {'question': 'Both local route and permission checks pass. What is justified?',
                        'options': ['The application is publicly reachable',
                                    'The modeled necessary conditions passed, with other checks outstanding',
                                    'A real gateway was attached',
                                    'A penetration test passed'],
                        'answer': 1,
                        'why': 'The model omits real network configuration and application behavior, so its '
                               'conjunction is not a full reachability proof.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['vpc-route-tables', 'vpc-nacls'],
  'sources': ['https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html',
              'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A labeled source-to-destination sketch.',
               'The observed route and missing app-to-db policy edge, with a narrow local conclusion.',
               'An explicit list of omitted network and application checks.'],
  'limitations': 'No VPC, subnet, gateway, security group, network ACL, DNS request or socket is created or '
                 'tested. Route plus permission is necessary only within a simplified model, not sufficient '
                 'real reachability proof.'},
 {'id': 'awsf-storage',
  'title': 'Choose storage by interface, access pattern and recovery need',
  'category': 'Cloud & infrastructure',
  'summary': 'Distinguish object, block and shared-file requirements before comparing lifecycle and recovery '
             'tradeoffs.',
  'learningGoals': ['Distinguish foundational object, block and shared-file access patterns.',
                    'Reject a candidate that lacks a required interface.',
                    'Separate capability matching from proven recoverability and real pricing.'],
  'explain': ['Storage selection starts with how the application reads and writes, not with a familiar '
              'product logo. Uploaded receipt assets can be independent objects addressed through an object '
              'API. A virtual machine boot volume needs block-device behavior. A group of compatible clients '
              'may need a shared filesystem. These are different interfaces and operating assumptions. An '
              'attractive price or durability statement cannot compensate for an interface the application '
              'does not support. Write the access pattern before looking at candidate services.',
              'Foundational Amazon S3 object usage, Amazon EBS block storage and Amazon EFS shared file '
              'storage illustrate these distinctions. The workshop uses S3-shaped, EBS-shaped and EFS-shaped '
              'teaching records rather than full product descriptions. Current service portfolios and '
              'specialized offerings are broader than this introduction; do not infer that every AWS product '
              'fits a single immutable category. The comparison concerns the declared foundational '
              'capabilities only. Real selection still needs attachment, client, Region, performance and '
              'access-control details.',
              'A capability ledger makes rejection useful rather than arbitrary. Our fixture requires '
              'object_api and independent_objects. The S3-shaped record declares both; the block and '
              'shared-file records do not. That is sufficient for a local match, but not for a final service '
              'recommendation. A real application may also require access latency, maximum object behavior, '
              'retention, encryption, concurrency or migration compatibility. Missing requirements can '
              'change a decision, so preserve them explicitly instead of claiming that two matched labels '
              'capture the workload.',
              'Lifecycle decisions address retention and movement over time. Keeping every object '
              'indefinitely can increase retained storage and preserve data beyond its intended use. '
              'Expiring data too quickly can remove a needed recovery window. Different storage classes and '
              'access patterns can introduce retrieval and timing considerations. This exercise uses no real '
              'prices, transitions or retrieval measurements. Describe what must be checked rather than '
              'assuming that the lowest headline storage rate produces the lowest complete cost or meets the '
              'application response target.',
              'Storage redundancy and recoverable history address different failures. Replication can '
              'preserve availability during some infrastructure failures while also copying an accidental '
              'deletion or corruption. A backup or version history may help recover an earlier state, but '
              'only when retention, access and the restore procedure are adequate. Verify expected content, '
              'not just the existence of a restored filename. This is a paper recovery discussion: the '
              'capability matcher does not create object versions, perform restoration or validate any '
              'provider durability claim.',
              'Run the storage command to inspect the feasible and rejected candidates. Retain the '
              'requirements and missing-capability reasons so another learner can reproduce the decision. No '
              'S3 bucket, EBS volume or EFS filesystem is created or accessed. A real recommendation would '
              'require authorized service configuration review, workload measurements, current cost analysis '
              'and a restore exercise. Your conclusion should say that one teaching record meets two '
              'declared interface requirements, then identify the most important unanswered question before '
              'deployment.'],
  'example': 'Requirements object_api and independent_objects retain only S3-shaped. EBS-shaped and '
             'EFS-shaped are rejected because their declared capabilities do not meet this fixture. The '
             'result is a local interface match, not an S3 deployment or restore test.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py storage',
  'codeLanguage': 'sh',
  'lab': ['Write the object API and independent-object requirements.',
          'Predict why block and shared-file candidates will not match.',
          'Run python3 labs/aws-workshop/run_lab.py storage.',
          'Inspect feasible candidates and each missing-capability reason.',
          'Write a lifecycle-versus-recovery tradeoff without inventing a price.',
          'Record one performance, access or restoration check still needed.'],
  'question': 'Why does S3-shaped remain feasible in this fixture?',
  'options': ['It is guaranteed to be cheapest',
              'A real bucket was tested',
              'It declares both required object capabilities',
              'All storage interfaces are identical'],
  'answer': 2,
  'why': 'The local match compares declared requirements with declared capabilities, not price or actual '
         'service behavior.',
  'additionalChecks': [{'question': 'What is stronger recovery evidence than seeing a filename return?',
                        'options': ['Changing the resource label',
                                    'Assuming every replica is a backup',
                                    'Reading only the cost subtotal',
                                    'Verifying expected recovered content'],
                        'answer': 3,
                        'why': 'Recovery needs content integrity and usability checks, which this capability '
                               'exercise does not execute.'},
                       {'question': 'What should follow a two-capability local match?',
                        'options': ['Review missing performance, access, retention and recovery requirements',
                                    'Deploy without review',
                                    'Treat all quotas as unlimited',
                                    'Claim an AWS restore succeeded'],
                        'answer': 0,
                        'why': 'A narrow interface match is useful but leaves substantial service-specific '
                               'and operational requirements unresolved.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['storage-choice', 'dr-strategies'],
  'sources': ['https://docs.aws.amazon.com/decision-guides/latest/decision-guides/choosing-aws-storage-service.html',
              'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A required-interface ledger.',
               'The feasible candidate and rejected-candidate reasons.',
               'A retention/recovery tradeoff and real-service validation checklist.'],
  'limitations': 'No S3, EBS or EFS configuration, transfer, lifecycle transition, access check, version '
                 'history, durability measurement or restore occurs. Candidate labels are not complete AWS '
                 'product descriptions.'},
 {'id': 'awsf-compute',
  'title': 'Fit compute capacity to demand and failure assumptions',
  'category': 'Cloud & infrastructure',
  'summary': 'Compare EC2, scaling and event-driven compute through workload requirements.',
  'learningGoals': ['Relate throughput demand to a stated per-worker capacity.',
                    'Separate scaling policy from application health.',
                    'Describe EC2 and Lambda tradeoffs without assuming universal performance.'],
  'explain': ['Compute selection begins with work, not a favorite service name. A receipt processor has an '
              'arrival rate, processing time, memory requirement, execution environment and acceptable '
              'delay. A steady service with specialized operating-system needs poses a different problem '
              'from a short event-triggered function. Amazon EC2 gives control over instances and their '
              'operating environment. AWS Lambda provides a managed function execution model with its own '
              'runtime, concurrency and execution constraints. Neither is automatically the cheapest or most '
              'reliable answer for every workload.',
              'Capacity arithmetic is useful only when its assumptions are visible. Suppose each healthy '
              'worker can process a declared number of requests per interval under a representative '
              'workload. Divide demand by that capacity and round upward to estimate a minimum worker count. '
              'That calculation ignores warm-up, uneven distribution, contention and dependency limits '
              'unless you add them explicitly. Treat it as a planning model, not a benchmark. A capacity '
              'number copied from another application is a hypothesis requiring measurement.',
              'EC2 Auto Scaling can change group capacity using configured policies and health information. '
              'Scaling does not repair every application failure: a newly launched instance may still have '
              'bad configuration, an unavailable dependency or a broken release. Health checks need to '
              'reflect useful service behavior, and deployment design needs to account for startup and '
              'replacement time. Increasing instance count can even increase load on a constrained database. '
              'Trace the entire request path before assuming that more compute removes the bottleneck.',
              'Event-driven compute shifts some operational responsibilities but does not remove workload '
              'design. Retry behavior, duplicate events, downstream capacity and concurrent executions '
              'affect correctness and cost. A short function can still perform the same business action '
              'twice unless the application makes repetition safe. A concurrency limit can protect a '
              'dependency while increasing waiting time or rejection elsewhere. Document that tradeoff in '
              'user-facing terms, such as delayed receipts, rather than presenting a limit as an unqualified '
              'improvement.',
              'The fictional capability exercise asks for event_triggered and no_host_management. Both '
              'function-shaped and managed-container-shaped records match, so the model reports ambiguity. '
              'These labels do not promise identical real event integration: orchestration and triggering '
              'must still be designed. Compare runtime needs, persistent-process behavior, workload '
              'measurements and operational responsibility to refine the decision. Any worker-count '
              'arithmetic from earlier in this lesson is a separate paper planning exercise, not an output '
              'of this capability command.',
              'Run the local compute command and retain both feasible candidates and their caveats. No EC2 '
              'instance is launched, no Lambda function is invoked and no scaling policy is installed. The '
              'receipt cannot establish latency, provider limits, regional availability or production cost. '
              'Real selection would require authorized workload measurements and current service '
              'constraints. Your result should recommend what to measure next and explain which workload '
              'facts could change the choice, rather than declaring a winner from two matching capability '
              'labels.'],
  'example': 'event_triggered and no_host_management retain function-shaped and managed-container-shaped, '
             'leaving ambiguous true. vm-shaped lacks the declared pair. This is a requirement matcher, not '
             'a benchmark, autoscaler or promise that real services have identical integrations.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py compute',
  'codeLanguage': 'sh',
  'lab': ['State workload units and acceptable waiting behavior.',
          'Predict which candidates declare both required capabilities.',
          'Run python3 labs/aws-workshop/run_lab.py compute.',
          'Record both feasible candidates and the ambiguity flag.',
          'Identify one runtime or integration requirement that could change the choice.',
          'Keep optional worker arithmetic on paper and distinguish it from the executed matcher.'],
  'question': 'Why round a minimum worker calculation upward?',
  'options': ['AWS always rounds every bill upward by instance',
              'A fraction of a worker does not meet the stated whole-worker model',
              'Rounding proves low latency',
              'It removes the need for health checks'],
  'answer': 1,
  'why': 'The model allocates whole workers, so a fractional demand-to-capacity ratio needs the next whole '
         'count; this says nothing about actual billing.',
  'additionalChecks': [{'question': 'Which problem can remain after adding compute workers?',
                        'options': ['All workload constraints necessarily disappear',
                                    'Duplicate events become impossible',
                                    'A saturated downstream database',
                                    'All deployment bugs are repaired'],
                        'answer': 2,
                        'why': 'More workers can increase pressure on a shared dependency and do not '
                               'inherently correct application defects.'},
                       {'question': 'What is needed to turn hypothetical throughput into production '
                                    'evidence?',
                        'options': ['A service logo',
                                    'Only a local arithmetic result',
                                    'An assumed universal AWS quota',
                                    'Representative measurements with documented workload and conditions'],
                        'answer': 3,
                        'why': 'Capacity planning requires actual workload evidence and current constraints, '
                               'not universal values inferred from a classroom model.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['compute-choice', 'fargate-lambda'],
  'sources': ['https://docs.aws.amazon.com/decision-guides/latest/decision-guides/choosing-aws-compute-service.html',
              'https://docs.aws.amazon.com/decision-guides/latest/decision-guides/fargate-or-lambda.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A capability requirement ledger with workload assumptions.',
               'Both feasible candidates and the unresolved choice.',
               'A service-selection question requiring real measurements.'],
  'limitations': 'No EC2, Lambda, load balancer or Auto Scaling deployment occurs. The executable compares '
                 'declared capabilities; capacity arithmetic is paper-only, and no real benchmark, quota, '
                 'latency, cost or scaling behavior is measured.'},
 {'id': 'awsf-queues',
  'title': 'Make duplicate delivery safe at the business boundary',
  'category': 'Cloud & infrastructure',
  'summary': 'Separate receiving a message from completing and acknowledging its business effect.',
  'learningGoals': ['Distinguish SQS buffering from SNS fanout and EventBridge routing.',
                    'Explain the crash window between committing an effect and acknowledging delivery.',
                    'Trace deduplication, retries and dead-letter handling without claiming exactly once.'],
  'explain': ['A queue separates the arrival of work from the availability of a worker. In an '
              'upload-processing service, the producer can record that work is waiting while consumers '
              'process at a controlled pace. Amazon SQS provides queue-based consumption; Amazon SNS '
              'provides publication and fanout; Amazon EventBridge routes events according to rules. These '
              'are different interaction patterns, and an architecture may combine them. Choose based on who '
              'must receive an event, how work is buffered and what happens when a consumer is unavailable.',
              'Standard SQS queues can deliver a message more than once. That fact matters at the business '
              'boundary, not just in a log counter. If a consumer adds an order amount every time it sees a '
              'delivery, a retry can charge or credit twice. A stable business identifier gives the '
              'application a way to recognize that the same intended operation has already been applied. The '
              'identifier must represent the operation correctly; two legitimate purchases must not be '
              'collapsed just because their amounts match.',
              'Consider the failure window after a worker commits its business effect but before its '
              'acknowledgment is accepted. A later delivery may carry work that already succeeded. Retrying '
              'the effect blindly is wrong, while refusing all retries can lose genuinely unfinished work. '
              'An idempotent consumer makes repeated handling converge on the intended result. In production '
              'this usually requires durable, coordinated state or an appropriate conditional transition. A '
              'process-local set in our model illustrates the idea but disappears with the process.',
              'A retry policy also needs a stopping and investigation path. A permanently malformed or '
              'unprocessable message can otherwise consume repeated attempts and delay useful work. '
              'Dead-letter handling collects such cases for controlled diagnosis and a deliberate replay '
              'decision. It does not automatically repair the payload or establish that replay is safe. '
              'Preserve the reason, business identifier and attempt history so an operator can decide what '
              'correction is needed without silently dropping evidence of unfinished work.',
              'The fictional ledger includes a repeated order and a failing order. Predict the total from '
              'successful unique business operations, not from the number of deliveries. Then inspect which '
              'repetition is suppressed, which message is acknowledged and which reaches the local '
              'dead-letter outcome after the configured attempt count. Keep delivery count separate from '
              'business-effect count. This distinction is a useful operational metric because a system can '
              'receive many deliveries while correctly applying only a smaller number of unique effects.',
              'Run the fixed Python command without any queue account, network connection or real financial '
              'data. The in-memory receipt demonstrates the fixture’s duplicate suppression and retry '
              'transitions only. It does not execute SQS visibility timeouts, durable transactions, FIFO '
              'behavior or service-level acknowledgment. A real design needs an authorized test of restart '
              'persistence, concurrency races, partial failures and replay procedures. Label those remaining '
              'tests explicitly rather than converting a successful local ledger into an end-to-end '
              'exactly-once guarantee.'],
  'example': 'The local ledger applies 1200 cents once for order-1, suppresses and acknowledges its '
             'duplicate, and sends failing order-2 to the modeled dead-letter outcome at attempt three. '
             'These cents are synthetic business values, not payments or AWS charges.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py queues',
  'codeLanguage': 'sh',
  'lab': ['Predict the total for unique successful business operations.',
          'Draw the commit-before-acknowledgment crash window.',
          'Run python3 labs/aws-workshop/run_lab.py queues.',
          'Reconcile 1200 cents with the duplicate and dead-letter trace.',
          'Explain why a process-local deduplication set is not durable production protection.',
          'Specify one restart or concurrent-consumer test still needed.'],
  'question': 'A standard SQS message is delivered again after its business effect succeeded. What should '
              'protect the result?',
  'options': ['An idempotent business operation using suitable durable state',
              'Adding the amount again without checking',
              'Assuming duplicates never happen',
              'Deleting all business history'],
  'answer': 0,
  'why': 'Duplicate delivery must not repeat a completed effect; production protection needs durable '
         'coordination, not merely receipt counting.',
  'additionalChecks': [{'question': 'Which service pattern primarily buffers work for consumer processing?',
                        'options': ['An SNS fanout alone',
                                    'An SQS queue',
                                    'An EventBridge routing rule alone',
                                    'A budget threshold'],
                        'answer': 1,
                        'why': 'Queues buffer pending work for consumers; fanout and routing answer '
                               'different delivery-pattern questions.'},
                       {'question': 'What does sending a failed case to a dead-letter destination establish?',
                        'options': ['Its business operation succeeded',
                                    'Its payload was automatically corrected',
                                    'It is separated for investigation under the configured retry policy',
                                    'Replay is always safe'],
                        'answer': 2,
                        'why': 'Dead-letter handling makes persistent failure inspectable; repair and replay '
                               'still require explicit reasoning.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['integration-choice', 'sqs-duplicates'],
  'sources': ['https://docs.aws.amazon.com/decision-guides/latest/decision-guides/sns-or-sqs-or-eventbridge.html',
              'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A delivery-to-business-effect reconciliation.',
               'A crash-window sketch and idempotency explanation.',
               'A dead-letter diagnosis and untested durability checklist.'],
  'limitations': 'No SQS, SNS or EventBridge engine is executed. Deduplication is in memory, not durable or '
                 'concurrency-safe production processing, and no exactly-once business guarantee is '
                 'established.'},
 {'id': 'awsf-database',
  'title': 'Separate relational failover, read scaling and access patterns',
  'category': 'Cloud & infrastructure',
  'summary': 'Compare database architectures against explicit requirements rather than a single availability '
             'label.',
  'learningGoals': ['Distinguish RDS Multi-AZ DB instance and DB cluster standby behavior.',
                    'Separate read-replica scaling from failover and recovery requirements.',
                    'Explain why multiple feasible candidates require further evidence.'],
  'explain': ['Database selection begins with the questions the application must answer and the invariants '
              'it must preserve. A receipt service may require relational transactions, joined reports, '
              'predictable key-based lookups or a mixture of patterns. Amazon RDS provides managed '
              'relational database options, while Amazon DynamoDB provides managed key-value and document '
              'storage with its own modeling choices. Managed operation does not make access-pattern design '
              'optional. Nor does a familiar service name prove that a particular query, transaction or '
              'consistency requirement is satisfied.',
              'Availability and read scaling are related but different goals. An RDS Multi-AZ DB instance '
              'deployment has a standby for failover that does not serve read traffic. An RDS Multi-AZ DB '
              'cluster has two readable standby instances. The words Multi-AZ alone therefore do not '
              'identify the read-serving behavior. State the exact deployment form in your recommendation. '
              'This avoids a common mistake in which a learner applies the single-standby rule to every '
              'Multi-AZ offering or expects read capacity from the wrong configuration.',
              'Readable DB instance replicas use asynchronous replication and can help serve reads; engine '
              'and replica-mode exceptions require verification. Replication lag matters when a user expects '
              'to read a change immediately after writing it. A read replica is not automatically equivalent '
              'to the failover arrangement of another deployment type, and promotion behavior depends on the '
              'actual architecture. Ask separately about writer failure, read throughput, acceptable '
              'staleness and recovery from a mistaken update. One feature label should not be allowed to '
              'answer all four questions without evidence.',
              'Conventional Aurora architecture separates replicated cluster storage from writer and reader '
              'compute. Storage redundancy does not imply that an appropriately sized reader is already '
              'running and ready to take over under every failure. DynamoDB also requires deliberate key and '
              'access-pattern design; it is not a drop-in relational JOIN engine. This lesson does not rank '
              'all database products. Instead, it practices identifying when a requirement calls for '
              'detailed engine-specific investigation rather than a generic claim that a managed database '
              'solves everything.',
              'The fictional decision model evaluates a bounded set of declared capabilities. Its fixture '
              'leaves both a Multi-AZ-cluster-shaped candidate and a read-replica-shaped candidate feasible. '
              'That ambiguity is useful: the inputs have not fully expressed every deployment and '
              'operational requirement. Do not pick the first row merely because it appears first. Add a '
              'written question about failover behavior, lag, recovery, engine support or measured load, and '
              'explain how the answer could eliminate a candidate or require combining capabilities.',
              'The executable command compares local records; it creates no RDS instance, Aurora cluster or '
              'DynamoDB table. It does not run SQL, measure replica lag or initiate failover. Keep the '
              'feasible candidate list and the unresolved requirement together in your evidence. A real '
              'recommendation requires current engine and Region support, authorized measurements, an '
              'operating plan and actual recovery testing. The model’s ambiguity flag is not a defect to '
              'hide; it is a signal that responsible architecture still needs more information.'],
  'example': 'The local fixture retains multi-az-cluster-shaped and read-replica-shaped candidates and '
             'reports ambiguity. This is a simplified capability comparison, not a claim that those real AWS '
             'deployments offer identical failover, consistency or operating behavior.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py database',
  'codeLanguage': 'sh',
  'lab': ['List relational, read, recovery and failure requirements separately.',
          'Predict why a single Multi-AZ label is insufficient.',
          'Run python3 labs/aws-workshop/run_lab.py database.',
          'Record both feasible candidates and the ambiguity flag.',
          'Write a missing requirement that would change the decision.',
          'Explain the instance-standby versus cluster-standby distinction.'],
  'question': 'Which statement correctly distinguishes RDS deployment forms?',
  'options': ['Every Multi-AZ standby is unreadable',
              'Every Multi-AZ deployment has the same read behavior',
              'A read replica always has zero lag',
              'A Multi-AZ DB instance standby is not readable; DB cluster standbys can serve reads'],
  'answer': 3,
  'why': 'The deployment form matters: the single standby DB instance and the two readable DB cluster '
         'standbys must not be conflated.',
  'additionalChecks': [{'question': 'What issue deserves attention with asynchronous read replicas?',
                        'options': ['Readers may observe replication lag',
                                    'All writes necessarily disappear',
                                    'The replica is always the writer',
                                    'Every query becomes a relational JOIN'],
                        'answer': 0,
                        'why': 'Asynchronous replication can expose stale reads, so the application’s '
                               'consistency expectations need explicit review.'},
                       {'question': 'Two model candidates remain feasible. What is the best next step?',
                        'options': ['Choose the first alphabetically',
                                    'Identify missing requirements and collect decision-changing evidence',
                                    'Claim their production behavior is identical',
                                    'Declare a real failover test complete'],
                        'answer': 1,
                        'why': 'A bounded comparison can leave multiple candidates because important engine, '
                               'recovery and operational requirements remain unspecified.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['rds-multiaz', 'rds-replicas', 'aurora-availability', 'dynamodb-introduction'],
  'sources': ['https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html',
              'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html',
              'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html',
              'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A requirement ledger separating reads, writes, failure and recovery.',
               'Both local candidates and an explicit ambiguity statement.',
               'A correct RDS deployment distinction and one next investigation.'],
  'limitations': 'No database engine, query, transaction, replica, lag measurement, failover or restoration '
                 'is executed. Candidate labels are teaching records, not deployable configurations or '
                 'verified service equivalence.'},
 {'id': 'awsf-resilience',
  'title': 'Test failure scope and recovery objectives independently',
  'category': 'Cloud & infrastructure',
  'summary': 'Distinguish surviving resources, sufficient capacity, data freshness and restoration time.',
  'learningGoals': ['Calculate RTO and RPO comparisons with explicit units.',
                    'Separate surviving instances from adequate service capacity.',
                    'Explain why replication is not a universal backup substitute.'],
  'explain': ['A reliable architecture names the failures it intends to tolerate. Losing one process, one '
              'Availability Zone and an entire Region are different scenarios with different dependencies '
              'and recovery costs. Spreading workers across zones may reduce one failure concentration, but '
              'it does not prove that the remaining workers, database, routing and credentials can serve the '
              'workload. Draw the failure boundary explicitly. Otherwise an availability claim can quietly '
              'slide from one small incident to a much larger disaster without supporting evidence.',
              'Recovery time objective, or RTO, describes the acceptable restoration interval. Recovery '
              'point objective, or RPO, describes the acceptable age of recovered data. They measure '
              'different harms: being unavailable and losing recent work. A service can restore quickly from '
              'an old backup, meeting its time target while missing its data target. Conversely, a recent '
              'recoverable point can preserve data while a slow restore exceeds the tolerated outage. Report '
              'both comparisons separately instead of using one green indicator for recovery.',
              'Survival is also different from capacity. If one worker remains after a zone failure but the '
              'application needs two equivalent workers to meet demand, the system has surviving '
              'infrastructure without sufficient modeled capacity. Actual capacity is more complicated than '
              'a count: workers may have different sizes, warm-up periods or dependency bottlenecks. The '
              'exercise intentionally uses an equivalent-worker assumption. State it when interpreting the '
              'result so a count comparison is not mistaken for a production load test.',
              'Replication is valuable for availability, but it can reproduce an accidental deletion or '
              'corruption. A recoverable history, backup or point-in-time mechanism addresses a different '
              'failure mode. Those mechanisms still need access, retained encryption keys, compatible '
              'software and a restoration procedure. A backup job reporting success does not prove that the '
              'application can use restored data. A meaningful drill checks integrity and dependencies as '
              'well as elapsed time, and records the point from which business work can resume.',
              'In the local scenario, app-3 survives the selected zone failure, but the fixture reports '
              'insufficient remaining capacity. A 45-minute restoration interval is within a 60-minute RTO; '
              'a 20-minute backup age exceeds a 15-minute RPO. Predict all three conclusions before '
              'execution. The mixed outcome is the lesson: a successful time comparison does not cancel the '
              'capacity shortfall or the missed data objective. Write the consequence of each miss in terms '
              'of delayed or lost fictional receipts.',
              'Run the resilience model and preserve its units, thresholds and outcome reasons. No real '
              'outage, backup, failover or restore is performed. The fixed numbers are scenario assumptions '
              'rather than observed AWS recovery times. A real recovery claim would need an authorized drill '
              'with timestamps, integrity checks, dependency validation and measured service behavior under '
              'the chosen failure. Your handoff should state which target needs a better design and which '
              'evidence remains hypothetical, even when one part of the local result passes.'],
  'example': 'One survivor, app-3, does not meet the model’s capacity requirement. Restoration takes 45 of '
             'the allowed 60 minutes, while recoverable data is 20 minutes old against a 15-minute '
             'allowance. RTO meets; RPO misses; capacity remains insufficient.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py resilience',
  'codeLanguage': 'sh',
  'lab': ['Draw the selected failure boundary and affected dependencies.',
          'Predict the survivor set and capacity outcome.',
          'Run python3 labs/aws-workshop/run_lab.py resilience.',
          'Compare 45≤60 for RTO and 20>15 for RPO.',
          'Explain why the three outcomes must remain separate.',
          'Specify an authorized restore drill and integrity evidence still needed.'],
  'question': 'Restoration is fast enough but the restored data is too old. Which conclusion fits?',
  'options': ['Both targets necessarily meet',
              'Only availability percentage matters',
              'RTO meets while RPO misses',
              'RPO measures worker count'],
  'answer': 2,
  'why': 'Restoration duration and recoverable-data age are independent comparisons with separate business '
         'consequences.',
  'additionalChecks': [{'question': 'One worker survives but two equivalent workers are required. What '
                                    'follows?',
                        'options': ['Survival proves full service performance',
                                    'The backup is necessarily corrupt',
                                    'The Region was restored',
                                    'The modeled capacity requirement is not met'],
                        'answer': 3,
                        'why': 'A nonempty survivor set does not establish enough capacity; the conclusion '
                               'remains bounded by the equivalent-worker assumption.'},
                       {'question': 'Why is replication not always a backup replacement?',
                        'options': ['It can propagate unwanted deletion or corruption',
                                    'It always prevents any outage',
                                    'Backups never need testing',
                                    'RTO and RPO become identical'],
                        'answer': 0,
                        'why': 'Availability replicas may copy mistakes, so recovery history and tested '
                               'restoration address additional failure modes.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['dr-objectives', 'dr-strategies'],
  'sources': ['https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html',
              'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A failure-boundary and dependency sketch.',
               'Separate survivor/capacity, RTO and RPO conclusions.',
               'A proposed real restore drill clearly labeled unexecuted.'],
  'limitations': 'No AWS failure injection, backup, restore, failover or load test occurs. All times and '
                 'capacities are fixture assumptions; objectives are not measured production guarantees.'},
 {'id': 'awsf-operations',
  'title': 'Match an incident question to the right operational evidence',
  'category': 'Cloud & infrastructure',
  'summary': 'Use CloudWatch, CloudTrail and AWS Config as complementary evidence sources.',
  'learningGoals': ['Choose telemetry, actor/activity or configuration evidence for a stated question.',
                    'Separate temporal correlation from a supported causal claim.',
                    'Explain recording coverage and retention as explicit design decisions.'],
  'explain': ['An incident begins with a question, not a dashboard collection. Users report slow receipt '
              'processing after a configuration change. You need to establish whether the symptom is real, '
              'when it started, what changed and who or what performed the change. Those questions call for '
              'different evidence. A metric can show a latency increase without identifying the actor. An '
              'activity record can identify a request without proving its effect on application performance. '
              'Keep the questions separate before combining the timeline.',
              'Amazon CloudWatch supports operational visibility through metrics, logs, alarms and '
              'dashboards. Useful evidence depends on appropriate instrumentation, dimensions, collection '
              'and retention. A graph labeled latency needs a defined measurement point and aggregation '
              'interval; an average can hide a small population of very slow requests. An alarm threshold is '
              'an operational choice, not a guarantee that every user-visible failure will trigger it. The '
              'lesson classifies fictional evidence and does not configure agents, dashboards, alarm actions '
              'or workload telemetry.',
              'AWS CloudTrail provides records of AWS activity that can help answer actor, action and time '
              'questions. Recording scope matters: management-event history and configured trails or other '
              'recording choices are not a promise that every application operation and data event is '
              'present by default. A missing record can mean missing coverage, retention or an incorrect '
              'search, not necessarily that no action occurred. State the source and scope whenever an audit '
              'conclusion depends on the absence of an event.',
              'AWS Config tracks recorded resource configuration, relationships and rule evaluations. It can '
              'help compare before-and-after resource state, while CloudTrail helps explain an API activity '
              'and CloudWatch helps show the symptom. A rule’s compliant result means something specific '
              'about that rule and recording scope. It is not blanket regulatory compliance or proof that '
              'the application is secure. Combining these sources is often useful precisely because none '
              'independently answers every operational and governance question.',
              'The local fixture includes four synthetic evidence items. One is classified as '
              'CloudWatch-shaped telemetry, one as CloudTrail-shaped activity, one as AWS-Config-shaped '
              'configuration, and one remains unclassified. Preserve the unknown rather than forcing it into '
              'the closest familiar category. The fixture has no timestamps, so a timeline cannot be derived '
              'from it. Record timestamps and ordering as missing evidence, then write a paper hypothesis: a '
              'configuration change might be related to a symptom. To support causation, a real '
              'investigation would need additional context, dependency checks and appropriately controlled '
              'validation.',
              'Run the operations command and keep the classification reasons. No AWS logs are queried and '
              'no real audit history is accessed. The exercise does not establish recording coverage, '
              'retention, incident response readiness or regulatory compliance. Your evidence should include '
              'an owner and retention question for each required source, plus one unresolved diagnostic '
              'question. A useful incident handoff makes uncertainty visible so the next person can test it, '
              'rather than turning coincident timestamps into a confident but unsupported root-cause '
              'statement.'],
  'example': 'The receipt classifies e1 as CloudWatch, e2 as CloudTrail, e3 as AWS_Config and e4 as '
             'unclassified. Treat those as local labels for synthetic records. The fixture contains no '
             'timestamps or event ordering. A timeline and any causal claim require additional evidence.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py operations',
  'codeLanguage': 'sh',
  'lab': ['Write separate symptom, actor/action and configuration questions.',
          'Predict the source category for each synthetic record.',
          'Run python3 labs/aws-workshop/run_lab.py operations.',
          'Retain the unclassified record and explain its uncertainty.',
          'Record timestamps and event ordering as missing evidence; write only a paper incident hypothesis.',
          'Record real-source coverage, retention and ownership questions.'],
  'question': 'Which evidence most directly addresses an AWS actor/action question?',
  'options': ['Only a latency average',
              'Relevant CloudTrail activity records',
              'Only an object size',
              'A synthetic price table'],
  'answer': 1,
  'why': 'CloudTrail activity evidence addresses who or what performed AWS actions, subject to recording '
         'scope and retention.',
  'additionalChecks': [{'question': 'A Config rule reports compliant. What is warranted?',
                        'options': ['All regulations are satisfied',
                                    'All application bugs are fixed',
                                    'The recorded resource satisfied that rule under its evaluated scope',
                                    'Every data event was audited'],
                        'answer': 2,
                        'why': 'A rule result has bounded meaning and must not be inflated into universal '
                               'compliance or security assurance.'},
                       {'question': 'A configuration change precedes a latency spike. What follows '
                                    'immediately?',
                        'options': ['The change is certainly the only cause',
                                    'All unrelated dependencies can be ignored',
                                    'A rollback has already succeeded',
                                    'There is a hypothesis to investigate, not proven causation'],
                        'answer': 3,
                        'why': 'Temporal association is evidence for investigation but cannot alone identify '
                               'cause or establish a successful remedy.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['cloudwatch', 'cloudtrail', 'config'],
  'sources': ['https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html',
              'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html',
              'https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A question-to-evidence-source ledger.',
               'The four local classifications, including the unknown.',
               'A paper incident hypothesis with explicit timestamp, coverage and retention gaps.'],
  'limitations': 'No CloudWatch, CloudTrail or Config API, telemetry collection, real log search, alarm '
                 'action or compliance assessment occurs. Local classification is not AWS recording '
                 'evidence.'},
 {'id': 'awsf-cost',
  'title': 'Reconcile synthetic costs without pretending a budget is a cap',
  'category': 'Cloud & infrastructure',
  'summary': 'Keep units, ownership, omissions and alert timing visible in cost decisions.',
  'learningGoals': ['Compute a subtotal from explicit synthetic quantities and rates.',
                    'Distinguish a budget notification from a guaranteed spending ceiling.',
                    'Identify missing cost drivers and governance decisions before a real estimate.'],
  'explain': ['A useful estimate states what is being counted, over which period, at which rate and in which '
              'currency. A bare total hides assumptions that often dominate the decision. Compute usage, '
              'retained storage, requests, transfer, logging and backups may change independently. Some '
              'architectures also introduce fixed or minimum charges and licensing questions. This workshop '
              'uses invented integer-cent values to make the arithmetic inspectable. None of the rates or '
              'totals is a quotation for an AWS service, Region or account.',
              'Match the units before multiplying. A storage amount measured at one instant is not '
              'automatically a full month of retained storage. A request count is not a data-transfer '
              'volume. An average demand can conceal a burst that changes capacity or concurrency needs. '
              'Write one ledger row for each modeled category and mark omitted categories explicitly. An '
              'incomplete estimate can still support learning if its exclusions are clear; presenting it as '
              'a complete bill would be misleading.',
              'Cost optimization is a requirements problem as well as an arithmetic problem. Removing '
              'redundancy can lower a hypothetical subtotal while violating a recovery objective. Retaining '
              'fewer logs can reduce storage while undermining investigation. Selecting a lower-priced '
              'storage option can add retrieval delay or other charges. Compare feasible designs against the '
              'same workload and obligations before choosing the lowest subtotal. The cost lesson should not '
              'undo the security, recovery and evidence requirements established earlier in the workshop.',
              'AWS Budgets can track actual or forecast costs and provide notifications or configured '
              'actions. Billing and notification delays mean spending can pass a threshold before someone '
              'responds. Existing resources can continue to incur charges, and configured actions have their '
              'own scope and constraints. A budget is therefore not a guaranteed hard spending cap. Make the '
              'response owner, expected action and delay assumptions explicit. An alert with no responsible '
              'person or permitted response is only a signal, not an operating control.',
              'The fixed local fixture totals 1390 cents against a 1300-cent budget, exceeding it by 90 '
              'cents. Predict the threshold result, then inspect the separate spending-cap field. The '
              'arithmetic should show the overage while the cap remains false. Do not reinterpret that field '
              'as a live account setting: it communicates the teaching limitation that a comparison does not '
              'halt real usage. Keep the synthetic currency amounts distinct from the order-ledger amounts '
              'in the queue lesson.',
              'Run the cost command and retain the category ledger, total, threshold and omissions. No '
              'Pricing API, Cost Explorer report, billing account, purchase or AWS Budgets configuration is '
              'accessed. Before a real estimate, verify current prices, service modes, Regions, usage '
              'quantities, applicable commitments and relevant taxes or fees. Before spending, obtain the '
              'required authorization. Your final recommendation should name the largest uncertainty and a '
              'useful next measurement, not claim that a classroom budget can protect a real payment '
              'method.'],
  'example': 'The synthetic receipt totals 1390 cents, compares it with a 1300-cent threshold and reports a '
             '90-cent overage. threshold_reached is true while spending_cap is false. No amount is an AWS '
             'price or a real charge.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py cost',
  'codeLanguage': 'sh',
  'lab': ['Write units and period for every synthetic ledger category.',
          'Predict the total and 90-cent overage.',
          'Run python3 labs/aws-workshop/run_lab.py cost.',
          'Explain why an exceeded threshold does not stop spending.',
          'Identify three omitted or uncertain real cost drivers.',
          'Name an owner and authorized response for a hypothetical alert.'],
  'question': 'What does an AWS budget threshold guarantee about the final bill?',
  'options': ['It does not guarantee a hard ceiling',
              'The bill can never exceed it',
              'All running services stop instantly',
              'All taxes and fees disappear'],
  'answer': 0,
  'why': 'Budget data, notifications and actions have timing and scope constraints; spending can exceed a '
         'threshold.',
  'additionalChecks': [{'question': 'The total is 1390 cents and the threshold is 1300 cents. What is the '
                                    'difference?',
                        'options': ['90 cents under the threshold',
                                    '90 cents over the threshold',
                                    '1300 cents over the threshold',
                                    'A verified AWS invoice'],
                        'answer': 1,
                        'why': 'Subtracting the threshold from the synthetic total gives 90 cents; neither '
                               'number is a real AWS charge.'},
                       {'question': 'Why might the lowest subtotal be the wrong design?',
                        'options': ['Requirements never affect cost choices',
                                    'Every omitted charge is always zero',
                                    'It may violate required recovery, access or operational needs',
                                    'A low subtotal proves exam readiness'],
                        'answer': 2,
                        'why': 'Compare designs that meet the same requirements and account for relevant '
                               'omitted costs before treating price as decisive.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['budgets', 'pillars'],
  'sources': ['https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html',
              'https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A unit-labeled synthetic ledger and reconciled total.',
               'A threshold-versus-cap explanation with the 90-cent overage.',
               'A real-estimate gap list and hypothetical alert owner.'],
  'limitations': 'No actual AWS rates, quotas, billing data, budget configuration, commitment, purchase or '
                 'spend authorization is used. Synthetic arithmetic is not a quote, and budgets are not hard '
                 'caps.'},
 {'id': 'awsf-capstone',
  'title': 'Defend an AWS-shaped design with evidence and unresolved risks',
  'category': 'Cloud & infrastructure',
  'summary': 'Assemble a bounded architecture review across six pillars without declaring deployment or exam '
             'readiness.',
  'learningGoals': ['Connect each architectural decision to a requirement and evidence item.',
                    'Review tradeoffs using the six Well-Architected pillars.',
                    'Produce an honest handoff that separates local results from unexecuted AWS work.'],
  'explain': ['The capstone concerns a fictional upload-and-receipt service with no customer data. Uploads '
              'arrive, queued work is processed, results are stored and operators investigate failures. '
              'Begin with the data classification, expected arrival pattern, permitted readers, acceptable '
              'delay and recovery objectives. These requirements should explain the design. Starting with a '
              'diagram full of AWS logos and retrofitting a justification later encourages accidental '
              'complexity and makes it difficult to tell whether each component solves a real problem.',
              'Use the six AWS Well-Architected pillars as review questions: operational excellence, '
              'security, reliability, performance efficiency, cost optimization and sustainability. For '
              'each, record a decision, an alternative you rejected, evidence you have and a remaining risk. '
              'The pillars are not independent scoring boxes. Extra redundancy can improve resilience while '
              'increasing idle capacity and cost; shorter retention can reduce storage while weakening '
              'investigation. A useful review explains the tradeoff and its owner instead of claiming that '
              'every dimension was maximized.',
              'The previous lessons supply different kinds of evidence. Identity work highlights a missing '
              'approval owner rather than granting real access. Network work separates an available route '
              'from a missing policy edge. Storage and compute selection compare declared capabilities, '
              'while the database comparison leaves an unresolved choice. Queue processing demonstrates a '
              'bounded duplicate-safe ledger. Recovery separates a sufficient restoration time from a missed '
              'data objective and insufficient surviving capacity. Preserve these failures and ambiguities '
              'rather than hiding them to make the capstone look complete.',
              'Operational and cost evidence complete the handoff but do not erase its gaps. The event '
              'classifier leaves an unknown record for investigation. The synthetic cost ledger exceeds its '
              'budget and explicitly does not enforce a spending cap. Assign a next question and responsible '
              'role to each unresolved result. A good architecture review can conclude that the design is '
              'not ready for deployment. That is a substantive outcome when the reasons and next actions are '
              'clear, not a failed exercise to bypass.',
              'Run the capstone command to aggregate the fixed local receipts and inspect its '
              'deployment_approved value. It remains false because this workshop is not a real '
              'implementation or an approval authority. Attach your six-pillar review and trace every claim '
              'back to an observed receipt, a paper prediction or an official concept reference. Keep those '
              'evidence types distinct. If you did not run a command, say so; a predicted answer can '
              'demonstrate reasoning but cannot stand in for an executed result.',
              'The official CLF-C02 and SAA-C03 guides provide a partial learning map, not an exam-readiness '
              'score. The guide revisions published October 29, 2026 describe approximately a one-month lead '
              'before corresponding exam changes; no exact effective date is established here. This workshop '
              'is mapped to the guides reviewed November 8, 2026 and leaves substantial objectives '
              'uncovered. AWS APIs, consoles, deployments, service engines, recovery drills and pricing '
              'validation remain unexecuted. Finish with a prioritized learning and validation plan rather '
              'than a certification or production-readiness claim.'],
  'example': 'The aggregate receipt preserves the missing identity owner, blocked policy path, ambiguous '
             'candidate choices, duplicate-safe 1200-cent ledger, mixed recovery outcomes, unknown '
             'operational event and synthetic cost overage. real_aws_executed and deployment_approved remain '
             'false.',
  'workedCode': '# Local synthetic model only; no AWS calls or configuration.\n'
                'python3 labs/aws-workshop/run_lab.py capstone',
  'codeLanguage': 'sh',
  'lab': ['Write a concise workload contract and data classification.',
          'Predict which earlier outcomes block a confident handoff.',
          'Run python3 labs/aws-workshop/run_lab.py capstone.',
          'Write one decision, alternative, evidence and risk for each pillar.',
          'Prioritize missing owners, policy review, capacity, recovery and cost questions.',
          'Compare the dated partial objective map and label all AWS execution unperformed.'],
  'question': 'What is the strongest capstone handoff?',
  'options': ['Only a diagram of service logos',
              'A claim that every AWS objective is complete',
              'A fabricated deployment success',
              'Requirements, evidence, unresolved risks and prioritized next checks'],
  'answer': 3,
  'why': 'A defensible handoff connects decisions to evidence and makes limitations actionable rather than '
         'hiding uncertainty.',
  'additionalChecks': [{'question': 'What does October 29, 2026 represent in the guide discussion?',
                        'options': ['A guide revision publication date, not a verified exact exam-effective '
                                    'date',
                                    'A guaranteed universal exam transition date',
                                    'The date this workshop deployed AWS',
                                    'A permanent freeze of service features'],
                        'answer': 0,
                        'why': 'AWS describes an approximate lead time, so publication and exact exam effect '
                               'must not be conflated.'},
                       {'question': 'Why is deployment_approved false in the aggregate receipt?',
                        'options': ['Every arithmetic operation failed',
                                    'Local teaching evidence is not deployment validation or authorization',
                                    'AWS has no recovery features',
                                    'A completion badge grants permission'],
                        'answer': 1,
                        'why': 'No real AWS environment or deployment checks were executed, and the model '
                               'cannot authorize a deployment.'}],
  'tags': ['aws', 'cloud', 'architecture'],
  'sourceKeys': ['pillars', 'clf-guide', 'saa-guide', 'clf-revisions', 'saa-revisions'],
  'sources': ['https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html',
              'https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html',
              'https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html',
              'https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/clf-02-revisions.html',
              'https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-revisions.html'],
  'depth': 'AWS conceptual foundation + bounded offline teaching model; AWS execution unperformed',
  'estimatedMinutes': 50,
  'evidence': ['A six-pillar decision/alternative/evidence/risk review.',
               'An aggregate receipt preserving failures and ambiguities.',
               'A dated objective-gap map and prioritized unexecuted-validation plan.'],
  'limitations': 'No AWS deployment, account configuration, full Well-Architected review, exam-readiness '
                 'assessment or production approval occurs. Local model completion does not establish '
                 'service behavior or complete objective coverage.'}]

PATH = {'id': 'aws-workshop',
 'title': 'AWS Foundations: Evidence Before Architecture',
 'summary': 'Ten substantial lessons connect AWS service concepts to bounded local reasoning models, '
            'explicit evidence and honest gaps.',
 'lessonIds': ['awsf-identity',
               'awsf-network',
               'awsf-storage',
               'awsf-compute',
               'awsf-queues',
               'awsf-database',
               'awsf-resilience',
               'awsf-operations',
               'awsf-cost',
               'awsf-capstone'],
 'prerequisites': ['cloud-model-contract', 'cloud-responsibility-scope', 'aws-design'],
 'certificationIds': ['aws-clf', 'aws-saa'],
 'caseIds': [],
 'limits': 'No AWS APIs, console, CLI, SDK, credentials, network, provisioning, CloudFormation, Terraform or '
           'paid services are used. Local models are not AWS engines or real configurations. Partial '
           'conceptual coverage is not exam readiness or deployment approval.'}
