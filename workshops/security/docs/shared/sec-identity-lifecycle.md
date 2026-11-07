# Design access that ends when the job ends

Connect authentication, least privilege, access review and safe recovery.

**Estimated study:** about 40 minutes, with pauses and practice.

## You will learn to

- Distinguish authentication, authorization and auditing.
- Evaluate factor categories and recovery weaknesses.
- Test lifecycle and object-level access with synthetic identities.

## Learn

Authentication checks a claim about identity; authorization decides whether that identity may perform this action on this resource; auditing records relevant activity. Cedar’s receptionist can be correctly signed in yet forbidden to export all records. That denial is normal least privilege, not necessarily a broken login.

A role is a convenient bundle of job permissions, not a reason to grant everything. Attribute-based decisions can also consider the resource owner, device state or an approved temporary assignment. A server must enforce decisions on every relevant request. Hiding an export button in the interface does not stop a direct request.

Two pieces of the same kind of evidence are not automatically two factors. Two passwords are both knowledge. A device-held cryptographic credential activated with a local PIN or biometric can combine possession with another factor. A biometric alone is not a secret that can be replaced after disclosure. Different mechanisms and deployments have different assurance properties.

Phishing-resistant authentication binds the proof to the intended service rather than simply asking someone to copy a reusable secret or code. Prefer supported phishing-resistant methods, but examine enrollment, device replacement, session management and recovery too. A strong normal login can be undermined by a weak recovery path. Do not infer that every method called MFA has equal resistance.

Access has a lifecycle: approve and provision for a real need, change access when the role changes, review it, and remove it when the need ends. Machine identities need owners and scoped permissions as well. Time-limited administrative access reduces standing exposure, but only if expiration and revocation are actually enforced.

For this exercise, policy inputs are invented. Our evaluator requires an active identity, an approved managed device and a role/action match. It denies everything else. These rules teach explicit policy and negative testing; they are not a model of every cloud IAM system. No real account, device policy, password or authenticator is changed.

## Worked example

Synthetic policy: receptionist may read and update bookings; auditor may read bookings; backup-service may read a backup snapshot; administrator may manage accounts but does not inherit booking-export rights. Dana is a departed receptionist, so active=false must deny even an otherwise permitted read. Ari is an active auditor on an unmanaged device, so the toy policy denies that read too. The important test is not only “a permitted request works”; forbidden action, wrong resource, inactive identity and missing conditions must fail.

## Practice safely

1. Read access-cases.json and predict each allow/deny outcome before using the tool.
2. Run python3 labs/security-foundations/offline_lab.py access from the pack root.
3. Match each decision to a written policy rule and inspect denied cases.
4. Explain why account administration and data export need not be the same role.
5. Write a fictional joiner, role-change and leaver checklist with a revocation check.
6. Record a recovery threat and how an approved help process would verify identity without asking for a password.

Executable exercises and paper alternatives are in the [offline lab guide](../../labs/security-foundations/README.md).

## Three original checks

### Check 1

A valid user cannot access another customer’s record. Which security function is deciding?

A. DNS
B. Disk encryption alone
C. Authentication must always have failed
D. Authorization

<details><summary>Reveal the answer and reasoning</summary>

D. Authorization. The decision concerns an action on an object after an identity is known.

</details>

### Check 2

Which pair is not two different factor categories?

A. Two different memorized passwords
B. A device-held key and a local activation PIN
C. Possession and knowledge
D. Possession and a biometric activation factor

<details><summary>Reveal the answer and reasoning</summary>

A. Two different memorized passwords. Changing the number of passwords does not change the factor category.

</details>

### Check 3

Why test an inactive identity with an otherwise valid role?

A. Because role membership should bypass termination
B. Because it checks that lifecycle revocation overrides an old entitlement
C. Because successful login proves every permission
D. Because auditors need administrator access

<details><summary>Reveal the answer and reasoning</summary>

B. Because it checks that lifecycle revocation overrides an old entitlement. A leaver can retain an old role record. An active-status gate must still prevent access in this toy policy.

</details>

## Evidence to keep

- Predictions and actual outcomes for all eight access cases.
- At least four different deny reasons explained.
- Lifecycle checklist includes a verification step.

## Limits

This toy authorization engine does not implement federation, OAuth, SAML, vendor IAM evaluation, account recovery or real authentication.

## Primary sources and further study

- https://pages.nist.gov/800-63-4/sp800-63b.html
- https://csrc.nist.gov/pubs/sp/800/207/final
