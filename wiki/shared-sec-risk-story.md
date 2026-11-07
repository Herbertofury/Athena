# Describe the risk before choosing a tool

Turn a vague security worry into a concrete scenario, a control and a test.

## Learning goals

- Separate assets, threats, vulnerabilities and consequences.
- Explain confidentiality, integrity and availability in a business workflow.
- Record residual risk without pretending a simple score is a forecast.

## Learn

Begin with something people need to accomplish. A fictional repair cooperative, Cedar Workshop, keeps booking records and equipment instructions. The valuable assets include the records, the booking service, the staff identities and the ability to open on time. A security decision should preserve a useful outcome, not merely accumulate products.

Confidentiality means restricting disclosure to the intended people. Integrity means preventing or detecting inappropriate changes. Availability means that authorized people can use the service when needed. Publishing a customer list harms confidentiality; changing appointment times harms integrity; losing the service during opening hours harms availability. One event can affect all three.

A threat is a possible cause of harm. A vulnerability is a weakness that could contribute to it. Risk describes the possibility and consequences of a scenario in context. Write a sentence: a former contractor could use an account left active to change bookings, interrupting service. The person, stale account, unwanted change and business impact have different roles in that sentence.

A control changes that scenario. An access review can find stale accounts; disabling an account can prevent future use; an audit trail can help detect changes; a tested restore can recover records. Preventive, detective and corrective describe a control’s purpose. Technical, administrative and physical describe how it is implemented. These are different axes, and a control can serve more than one purpose.

Use a simple likelihood/impact scale only with written meanings. Multiplying two labels from 1 to 3 can organize discussion, but does not estimate a precise probability or expected loss. Two risks with equal products may require different decisions. Record exposure, assumptions, uncertainty and the owner who can accept the remaining risk.

Avoidance stops the risky activity, mitigation reduces the risk, transfer or sharing changes who bears some consequences, and acceptance deliberately keeps a risk within an authorized tolerance. Buying insurance does not prevent an outage or erase operational duties. After controls, residual risk remains. Revisit it when the service, threat, evidence or business need changes.

## Worked example

Cedar has 12 staff and one departed contractor. Fictional scenario R1 is unauthorized booking changes through the contractor’s active account. The service owner chooses account removal, a monthly access review and change logging. Verification is not “we bought identity software”: inspect the approved account inventory, test a simulated deny for the departed identity, and check that a synthetic change produces an audit event. Residual risk includes misuse by a current authorized staff member. Name the service owner and a review date instead of claiming zero risk.

## Practice safely

1. Use the supplied evidence worksheet; do not inventory real customers.
2. Write three Cedar scenarios, each naming asset, threat, weakness and consequence.
3. For each scenario identify confidentiality, integrity and/or availability impact.
4. Choose one preventive and one detective or corrective control, with a named fictional owner.
5. State a concrete verification observation and a residual risk.
6. Explain one case where the highest numeric score should not automatically dictate the next action.

## Evidence to keep

- Three scenario records with distinct threats and weaknesses.
- Control purpose and verification are connected to each scenario.
- Uncertainty, residual risk and owner are stated.

## Original check 1

A contractor leaves but their account still permits booking changes. Which item is the vulnerability?

- The account remains usable without a valid business need
- The booking service’s business value
- All contractors are attackers
- The cost of cancelling appointments

<details><summary>Answer and explanation</summary>

The account remains usable without a valid business need. The stale access is the weakness. Intent, asset value and consequences are separate parts of the risk story.

</details>

## Original check 2

A change log helps discover unauthorized edits. What is its primary purpose in this scenario?

- It guarantees confidentiality
- Detective
- It eliminates all residual risk
- It transfers legal responsibility

<details><summary>Answer and explanation</summary>

Detective. The log supports detection and investigation. It does not automatically prevent editing or remove responsibility.

</details>

## Original check 3

What makes a residual-risk entry useful?

- A guarantee that nothing bad can happen
- A product name alone
- A stated remaining scenario, owner and review trigger
- A bigger unexplained score

<details><summary>Answer and explanation</summary>

A stated remaining scenario, owner and review trigger. Residual risk must be understood and owned; a score or product label is not a decision record.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

A small qualitative exercise is not an enterprise risk assessment or a financial loss forecast.

## Official references

- [NIST SP 800-30 Revision 1: Guide for Conducting Risk Assessments](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-30r1.pdf)

- [NIST Cybersecurity Framework resource center](https://www.nist.gov/cyberframework)

