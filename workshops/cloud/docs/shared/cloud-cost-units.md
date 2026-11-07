# Forecast usage and keep budget alerts in perspective

Calculate an explicit fictional bill and compare always-on with scheduled compute.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Multiply compatible usage and rate units.
- Keep continuing storage and transfer costs visible.
- Explain why a budget notification is not an instant spending cap.

## Learn

A cloud estimate is a model of usage and rates, not merely a virtual-machine price. Record the period, compute hours, retained storage, requests or transfers that matter, and the services you left out. A small rate multiplied by an unexpected duration or number of resources can dominate the result. Units make those assumptions inspectable.

This exercise deliberately uses fictional credits, not currency or any provider’s prices. Three replicas run for 720 hours at five credits per replica-hour: compute costs 10800 credits. Storage contributes 100 GiB-months times two credits, or 200. Transfer contributes 50 GiB times three credits, or 150. The total is 11150 credits against a 10000-credit planning budget.

The alternative runs those replicas for 160 hours while leaving the same storage and transfer assumptions. Compute becomes 2400 credits and the total becomes 2750. This is not a promise that stopping a real instance eliminates every charge. Attached storage, retained data, networking components or commitments may continue to matter, depending on the exact service and terms.

A useful estimate shows what changes and what does not. In our comparison only compute hours change. Calling the scheduled plan cheaper is justified within those assumptions; calling it suitable for a round-the-clock service is not. Service availability requirements and operational startup behavior must be considered before changing any real schedule.

AWS Budgets documents delayed cost information and notifications. A notification threshold therefore must not be treated as a guaranteed instant hard cap. Provider budget actions have their own scope and behavior. This pack neither configures a budget nor stops resources. It simply compares an arithmetic result with a fictional threshold.

For an eventual authorized cloud lab, establish the account owner, allowed services, total spending limit, cleanup checklist and a method to verify remaining resources and charges. Current prices and free-offer terms would need fresh checking at that time. No free tier is assumed here. All exercises are local and create no billable cloud resources; the estimate itself is not a financial commitment.

## Worked example

Always-on totals 11150 fictional credits and exceeds the 10000 threshold by 1150. Scheduled totals 2750 and is 7250 below it. Storage and transfer remain 350 in both. The 720-hour period is a stated 30-day assumption, not every calendar month. No value in this exercise is an AWS, Azure or Google Cloud quote.

## Practice safely

1. Write each quantity with its unit before multiplying.
2. Calculate the three cost components and total for both schedules.
3. Run python3 labs/cloud-workshop/run_lab.py cost.
4. Explain which costs remain when only compute hours change.
5. List missing real-estimate items such as request charges, taxes, support or commitments.
6. Write a future lab budget/cleanup checklist while marking account and billing work unexecuted.

Use the [offline lab guide](../../labs/cloud-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

What is the always-on fictional compute cost?

A. 2160 credits
B. 11150 credits
C. 10800 credits
D. 150 credits

<details><summary>Answer and reasoning</summary>

C. 10800 credits. Three replicas × 720 hours × five credits per replica-hour equals 10800; storage and transfer are separate.

</details>

### Check 2

Which statement about the scheduled fixture is correct?

A. All costs become zero
B. It proves every real instance can stop without consequences
C. It uses current vendor prices
D. Storage and transfer assumptions remain unchanged

<details><summary>Answer and reasoning</summary>

D. Storage and transfer assumptions remain unchanged. Only compute hours change in this model; retained storage and transfer still total 350 credits.

</details>

### Check 3

Can a delayed budget notification be treated as an instant hard spending cap?

A. No; usage and charges can continue before the notification arrives
B. Yes, always
C. Only if the estimate is small
D. It means no cleanup is needed

<details><summary>Answer and reasoning</summary>

A. No; usage and charges can continue before the notification arrives. Notifications and configured actions have timing and scope limits. A budget alert alone does not guarantee a hard cap.

</details>

## Evidence to keep

- A unit-labelled two-schedule estimate.
- A missing-cost/assumption list.
- An unexecuted future account/budget/cleanup checklist.

## Limits

All rates and credits are invented. This is not a quote, current price comparison, free-tier guarantee, billing action or financial advice. No cloud resource or charge is created.

## Official references

- https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
