# Authentication, authorization and accounting

Separate who you are from what you may do.

## Learn

Authentication verifies an identity. Authorization determines permitted actions on resources. Accounting/auditing records activity. A successful login does not imply permission to administer every resource.

MFA uses different factor categories; two passwords are not two independent factors. Prefer phishing-resistant mechanisms where supported. Recovery procedures are part of the security design, not an afterthought.

Role-based and attribute-based policies must be evaluated with scope, conditions and explicit denials. Assign least privilege, review access periodically and remove unused identities. Machine identities require the same lifecycle care.

## Worked example

An authenticated analyst can read a report but cannot change the dataset. This is normal authorization, not a failed login.

## Practice safely

1. Create a fictitious access matrix for support, analyst and administrator roles.
2. Identify the minimum permissions for each workflow.
3. Use the policy lab to test allow and explicit-deny decisions.
4. Write an access-review checklist without creating real accounts.

## Check your understanding

A valid login followed by “access denied” most likely concerns which layer?

- Authentication always failed
- DNS alone
- Authorization
- Storage capacity

<details><summary>Answer and explanation</summary>

Authorization. Identity can be valid while the requested operation is not permitted.

</details>

## Further study

- https://csrc.nist.gov/publications/detail/sp/800-63/4/final

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

