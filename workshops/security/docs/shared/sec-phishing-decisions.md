# Handle a suspicious request without escalating harm

Separate message clues, business verification and safe reporting.

**Estimated study:** about 40 minutes, with pauses and practice.

## You will learn to

- Recognize urgency and authority as persuasion rather than proof.
- Choose a trusted verification path.
- Explain why authentication signals do not guarantee a benign request.

## Learn

Social engineering persuades someone to take an action that serves the sender. Phishing can arrive by message, call, QR code or a collaboration invitation. A familiar name, a logo or correct personal details can make a request convincing without proving authority. Pressure to act quickly often tries to remove the pause in which a person would verify.

Start with the requested action and its consequence. Is someone asking for a sign-in, a one-time code, an unusual payment, a new download or a change to account recovery? Compare it with the normal workflow. A real organization can send an unexpected legitimate request, so suspicious clues are reasons to verify, not proof that a particular person is guilty.

Use a channel you already trust: open the known application yourself or contact the person using a previously verified directory entry. Do not use a number, reply address or login link supplied only by the suspicious request as your independent check. In this course, verification is a paper decision, not permission to contact anyone.

Email protections such as SPF, DKIM and DMARC help with specific sender-domain and message-authentication checks. A message that passes them can still be malicious, for example when an attacker controls a legitimate domain or an account is compromised. A display name and the exact domain are different things. Do not teach “authentication passed” as “the business request is safe.”

If a person already clicked or entered information, respond calmly and follow the organization’s approved process. Preserve useful details, report promptly, and let authorized responders decide on sessions, account recovery and device handling. Blame and embarrassment discourage early reporting. Do not ask someone to send you their password or a one-time code as evidence.

Our examples are plain invented text. They contain no clickable phishing page, executable attachment or live destination. The safe skill is deciding what to verify and how to describe the uncertainty. Do not forward a suspicious message broadly, download its attachment to investigate casually, or send a payment to “test” whether it is real.

## Worked example

A fictional message says: “I am covering finance today. We need the supplier bank details changed before 16:00. Skip the usual second approval; the manager already agreed.” The important issue is the requested financial change and bypass of an established control, not whether the grammar is good. Pause the change, verify through the known supplier-change process, and preserve the message for the approved report. You can describe the concern without accusing the named manager of misconduct.

## Practice safely

1. Read the three message cards in the worksheet without opening any external destinations.
2. Underline the requested action, claimed authority and potential consequence.
3. Choose an independent verification channel for each.
4. Write a two-sentence internal report using observations, not accusations.
5. Describe what changes if the user already entered credentials, without collecting those credentials.
6. Explain one reason a legitimate-looking or authenticated message can still be unsafe.

Executable exercises and paper alternatives are in the [offline lab guide](../../labs/security-foundations/README.md).

## Three original checks

### Check 1

A message requests a supplier payment change and supplies a callback number. What is the strongest independent check?

A. Use the established supplier verification process and a previously trusted contact
B. Call only that supplied number
C. Reply with account credentials
D. Approve because the logo looks correct

<details><summary>Reveal the answer and reasoning</summary>

A. Use the established supplier verification process and a previously trusted contact. An independently established contact/process avoids using attacker-controlled evidence to verify itself.

</details>

### Check 2

A message passes domain authentication. What should you conclude?

A. The business request is definitely safe
B. That signal alone does not establish benign intent or authority
C. All attachments are harmless
D. No further policy applies

<details><summary>Reveal the answer and reasoning</summary>

B. That signal alone does not establish benign intent or authority. Domain/message authentication is not a guarantee about the request’s purpose or the account holder’s intentions.

</details>

### Check 3

What response best encourages useful early reporting?

A. Blame the person who clicked
B. Ask for their password to investigate
C. Calmly collect non-secret facts and follow the approved incident process
D. Tell everyone the sender is criminal

<details><summary>Reveal the answer and reasoning</summary>

C. Calmly collect non-secret facts and follow the approved incident process. Prompt, nonjudgmental reporting helps responders. Secrets and unsupported allegations are unnecessary.

</details>

## Evidence to keep

- Three reasoned verification decisions.
- Reports exclude credentials and unsupported accusations.
- A post-click escalation path is distinguished from preventive advice.

## Limits

This lesson does not send messages, investigate a real sender or provide legal conclusions about fraud.

## Primary sources and further study

- https://www.ftc.gov/business-guidance/small-businesses/cybersecurity
- https://pages.nist.gov/800-63-4/sp800-63b.html
- https://www.rfc-editor.org/rfc/rfc7489.html
