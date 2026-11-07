# Choose collections from identity and order

Group legitimate repeated items while rejecting conflicting event identities.

## Learning goals

- Use lists, dictionaries and sets for distinct purposes.
- Distinguish repeated business lines from duplicate delivery.
- Make output ordering and tie breaking explicit.

## Learn

A list preserves a sequence of items. A dictionary maps a key to a value. A set records unique membership. Choose from the operation you need, not from which syntax looks shortest. The quote needs to preserve line count while grouping by stock identifier; the event summary needs to identify repeated delivery of the same event.

Repeated keys do not always mean duplicate data. Two FILTER lines can represent legitimate separate quantities, even at different prices in this project. Group them by adding quantity and line subtotal. Replacing one row with the last row would lose work. The output deliberately avoids inventing a single unit price for a group that may contain several prices.

Event identity has a different contract. An identical repeated event_id is one logical event delivered twice, so it should not inflate event metrics. The same ID with different normalized content is a conflict and causes rejection. Never apply one generic “remove duplicates” rule to every dataset without understanding what its keys mean.

Dictionaries make identity lookup direct and clear for these bounded inputs. This can avoid repeatedly scanning the already-seen list, although exact runtime depends on implementation and workload. The project has at most 200 event rows; clarity and correctness matter more than claiming a large performance improvement from a tiny fixture.

Deterministic output makes tests and diffs easier to interpret. Quote groups are sorted by SKU. Event groups are sorted by label using Python’s ordinary string ordering, not locale-specific human collation. Slowest events are sorted by descending duration, with event_id ascending as an explicit tie-breaker. Do not leave a tie to accidental input order.

Keep validation and aggregation connected. Before inserting an event into the ID map, validate its shape and values. A conflicting duplicate must not silently overwrite an earlier event. Both projects return newly constructed summaries and leave input lists and rows unchanged, so callers can compare before and after safely.

## Worked example

The quote has FILTER twice: 2×1250 plus 1×1000 gives quantity 3 and subtotal 3500, not the last row’s 1000. The event fixture has five delivered rows but four distinct IDs. EVT-001 is repeated identically and counted once. EVT-001 and EVT-004 both take 100 ms, so EVT-001 precedes EVT-004 when the slowest list reaches that tie. A changed duration under EVT-001 is rejected as a conflict.

```python
seen = {}
for event in validated_events:
    event_id = event["event_id"]
    if event_id in seen and seen[event_id] != event:
        raise ValueError("conflicting duplicate event_id")
    seen[event_id] = dict(event)
# Identical repeated IDs remain one logical event.
```

## Practice safely

1. Explain why quote SKU repetition and event-ID repetition follow different rules.
2. Implement quote grouping without dropping repeated lines.
3. Implement event deduplication with explicit conflict rejection.
4. Predict all group and slowest-event orders before running the reference.
5. Run reversed-input tests and verify the summary remains equal.
6. State why these bounded tests are not a production performance benchmark.

## Evidence to keep

- Correct grouped quote totals and deduplicated event counts.
- A rejected conflict case.
- Order-invariance and tie-breaking tests.

## Original check 1

Two FILTER quote lines have different unit prices. What does this contract require?

- Keep only the last line
- Add their quantities and line subtotals without inventing one price
- Reject all repetition
- Count the group as one unit

<details><summary>Answer and explanation</summary>

Add their quantities and line subtotals without inventing one price. Repeated quote lines are legitimate input under this contract; the group reports totals.

</details>

## Original check 2

The same event ID arrives with a different duration. What should happen?

- Silently overwrite the old event
- Count it as an identical duplicate
- Reject the conflicting identity
- Delete every event

<details><summary>Answer and explanation</summary>

Reject the conflicting identity. Conflicting content under one logical identity must not disappear silently.

</details>

## Original check 3

Why specify an event-ID tie-breaker for equal durations?

- To prove the service is fast
- To hide failed events
- To change duration units
- To make output deterministic independent of input order

<details><summary>Answer and explanation</summary>

To make output deterministic independent of input order. Explicit tie rules make repeated results and tests stable.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

The grouping and deduplication contracts are local teaching choices, not universal business rules or distributed exactly-once guarantees.

## Official references

- [https://docs.python.org/3.12/tutorial/datastructures.html](https://docs.python.org/3.12/tutorial/datastructures.html)

- [https://docs.python.org/3.12/library/unittest.html](https://docs.python.org/3.12/library/unittest.html)

