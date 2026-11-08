# Separate workspace capability from row visibility

Use a hypothetical policy matrix to expose privilege and role-union mistakes without creating real security.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Distinguish workspace roles, Build permission and a row-filtering role.
- Predict the bounded policy outcomes for viewers and editors.
- Explain why a readable local fixture cannot be a security boundary.

## Learn

Security questions must identify both the action and the data. Permission to read a report is different from permission to edit a workspace, and both differ from the rows a particular reader should see. Start with a matrix naming the intended person, their capabilities and their allowed regions. Use fictional identities only. A convincing-looking report filter does not establish enforcement against someone who can inspect the underlying data.

In the documented Power BI workspace case, RLS constrains Viewers rather than Admins, Members or Contributors. Our bounded policy matrix therefore shows a North Viewer at 7000 cents and those editor-level roles at the full 16000. That outcome warns against giving an intended restricted reader an elevated workspace role. It is not a general authorization engine for every sharing, embedding or export arrangement.

Build permission and workspace editing are not the same permission. In the fixed case, a Viewer with Build remains restricted to the assigned North data, still totaling 7000. Treat this as a deliberately scoped scenario and verify effective permissions in the actual service before deployment. A permissions label alone is insufficient if group membership or another access route grants additional capability.

Multiple allowed region roles combine as a union in this exercise. Assigning both North and South produces all 16000 cents, not an empty intersection and not the smaller subtotal. This demonstrates why adding another role can widen visibility. A Viewer with no assigned permitted role is denied by the teaching policy. That explicit local rule must not be mistaken for a universal description of every possible platform access arrangement.

The command performs classification and set filtering over fully readable synthetic data. A learner can open the fixture or change Python, so none of the data is protected by this exercise. The distinction matters: successful tests here validate a policy explanation, not protection of secrets. Actual enforcement needs a real semantic model, effective identities, configured role membership and tests of relevant access paths.

Record expected and observed results for a restricted Viewer, Viewer with Build, elevated workspace role, two-region membership and missing membership. Then write a separate service-side test plan covering intended and unintended users, group overlap and relevant export behavior. No sharing, publication or account modification is performed. The capstone should retain the untested security items instead of treating local arithmetic as a deployment approval.

## Worked example

The fixed model predicts North Viewer 7000 cents; North Viewer with Build 7000; Member, Contributor or Admin 16000; combined North/South roles 16000. Missing Viewer membership is denied by the classroom policy. All facts remain locally readable, so none of these outputs implements actual authorization.

```sh
# Power BI, M and DAX remain unexecuted.
# Hypothetical permission classification and set filtering only.
python3 labs/bi-workshop/run_lab.py access
```

Only fixed Python wrapper commands are runnable instructions. Commented M/DAX snippets are illustrative and unexecuted. This pack does not run Power BI or implement its engines.

## Practice safely

1. Create a fictional capability-and-region matrix without any real user identifiers.
2. Predict the restricted Viewer and Viewer-with-Build totals.
3. Run the fixed access command and compare elevated-role and union-role outcomes.
4. Inspect the missing-membership denial as a teaching policy, not a universal platform guarantee.
5. Explain why access to the readable fixture defeats any claim of actual protection.
6. Write the separately required real-service identity, membership and access-path tests.

## Evidence to keep

- A scoped hypothetical permissions matrix with predicted and observed totals.
- An explanation of elevated privileges and unioned role membership.
- A real-service validation plan explicitly marked unexecuted.

## Original check 1

Which workspace-role choice is unsafe for a person who must be restricted by RLS in this scenario?

A. Viewer with the intended row role
B. A tested restricted Viewer
C. Contributor
D. A read-only Viewer assignment

<details><summary>Answer and reasoning</summary>

C. Contributor

The documented workspace RLS restriction does not apply to Contributor, Member or Admin roles.

</details>

## Original check 2

What happens when the fixed Viewer has both North and South region roles?

A. Only the smaller region remains
B. Both roles cancel all access
C. The source records are permanently deleted
D. The union includes all 16000 cents

<details><summary>Answer and reasoning</summary>

D. The union includes all 16000 cents

These allowed-role populations union, so an additional role broadens the visible rows.

</details>

## Original check 3

Why is this local command not a security boundary?

A. The complete fixture remains readable and the code is modifiable
B. All permission reasoning is useless
C. A green test automatically grants workspace access
D. Python establishes cloud identities automatically

<details><summary>Answer and reasoning</summary>

A. The complete fixture remains readable and the code is modifiable

Local set filtering can illustrate policy but cannot protect a dataset that the learner can directly inspect.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

No authentication, authorization, real RLS, identity resolution, export protection or account changes occur. Every synthetic fixture row remains locally accessible.

## Official references

- https://learn.microsoft.com/en-us/fabric/fundamentals/roles-workspaces
- https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security
