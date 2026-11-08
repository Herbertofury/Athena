"""Original conceptual lessons. Power BI, M, DAX and service security are unexecuted.

Python teaching models, when supplied separately, are bounded simulations, not
vendor engines or security controls. No certification-completeness claim.
"""
LESSONS = []
S = {
 'folding': 'https://learn.microsoft.com/en-us/power-query/query-folding-basics',
 'star': 'https://learn.microsoft.com/en-us/power-bi/guidance/star-schema',
 'relationships': 'https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand',
 'calculations': 'https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-calculations-options',
 'calculate': 'https://learn.microsoft.com/en-us/dax/calculate-function-dax',
 'dates': 'https://learn.microsoft.com/en-us/power-bi/guidance/model-date-tables',
 'accessibility': 'https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports',
 'refresh': 'https://learn.microsoft.com/en-us/power-bi/connect-data/refresh-data',
 'directquery': 'https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-directquery-about',
 'directlake': 'https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview',
 'workspace': 'https://learn.microsoft.com/en-us/fabric/fundamentals/roles-workspaces',
 'rls': 'https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security',
 'guide': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300',
}


def q(question, options, answer, why):
    return dict(question=question, options=list(options), answer=answer, why=why)


def add(id, title, summary, goals, paragraphs, example, code, practice,
        checks, sources, evidence, limits):
    assert len(paragraphs) == 6 and len(checks) == 3
    assert len(goals) == 3 and len(practice) == 6 and len(evidence) == 3
    checks = [dict(c, options=list(c['options'])) for c in checks]
    for i, check in enumerate(checks):
        correct = check['options'].pop(check['answer'])
        check['answer'] = (len(LESSONS) * 3 + i) % 4
        check['options'].insert(check['answer'], correct)
    LESSONS.append(dict(
        id=id, title=title, category='Data & analytics', summary=summary,
        explain=paragraphs, example=example, workedCode=code, codeLanguage='text',
        lab=practice, **checks[0], tags=['bi', 'data', 'analytics'],
        sources=[S[key] for key in sources],
        depth='conceptual foundation + bounded local teaching simulation; vendor execution unperformed',
        estimatedMinutes=45, learningGoals=goals,
        additionalChecks=checks[1:], evidence=evidence, limitations=limits))


add('bi-transformations', 'Trace transformations before discussing query folding',
    'Make types, rejects and intermediate results explicit, then distinguish local pushdown from verified folding.',
    ['Build a transformation ledger that reconciles accepted and rejected rows.',
     'Distinguish append, merge and unpivot by their effect on row grain.',
     'Explain why equal SQL results do not establish Power Query folding.'], [
    'A fictional shop sends order lines with quantities stored as text and inconsistent whitespace around region names. Start with the business meaning of a line, the units of each value and the allowed range of each field. A successful parse is not the same as valid business data: negative units may parse correctly but violate this fixture contract. Preserve a way to trace the raw value and an explicit rejection reason so a reviewer can distinguish correction from accidental data loss. This receipt retains an input index, reason and an independent raw_record copy for the bounded six-field string fixture. F7 keeps its ID and malformed quantity. Unsupported schemas, non-string objects and fields longer than 256 characters are not copied; this is not a general ingestion interface.',
    'Write a transformation ledger with input count, operation, output count and assumptions for every stage. Trimming whitespace should not change the number of rows. Filtering a date range should change that number predictably. A join may unexpectedly multiply rows when its lookup key is duplicated. Check these expectations at the point of transformation instead of waiting until a chart looks surprising. Silent replacement of a malformed amount with zero makes a tidy table at the expense of a trustworthy total.',
    'Appending combines compatible sets of records, while merging adds information matched by keys. Unpivoting turns repeated month columns into records with a month attribute and a value. Those operations solve different problems. For example, a planning grid with one category and two monthly columns becomes two category-month observations after unpivoting. Its grain is not an order line, so it must not be appended into the sales facts merely because both tables contain monetary numbers.',
    'Power Query can translate supported transformations into source operations through query folding. A separate paper analogy compares retrieving rows before filtering with filtering at a source before retrieval. This lab implements neither SQL plan. Even an independently run SQL comparison would establish only its own result, not which M expressions a connector can fold. The transform receipt makes the narrower claim of local cleaning and validation.',
    'Avoid a performance claim based on tiny teaching data. Startup, caching and measurement noise can dominate timings, and this command records no folding benchmark. Keep hypothetical transfer counts on paper rather than calling them observations. In a real deployment, source capabilities, expression shape, privacy and query diagnostics need direct inspection. The planned transformation order is a hypothesis to test, not a certificate of vendor behavior.',
    'The safe exercise uses invented records and a local transformation trace. No database account, connector setup, remote query, credential, Power Query editor or M runtime is required. If a supplied bounded model is run, keep its observed result separate from the prediction made on paper. The final explanation should name one rejected record, one preserved invariant and one product-specific question still unanswered.'
    ],
    'The transform receipt accepts F1–F6, rejects F7 because quantity is many, and reconciles six valid plus one rejected row to seven received. Accepted revenue totals 16000 cents. The SQL pushdown and unpivot discussions are optional paper analogies only; the CLI performs no SQL pushdown, merge or unpivot.',
    '// Illustrative M idea only; not runnable or validated in this workshop.\n'
    '// Keep an explicit rejection ledger before calculating accepted revenue.\n'
    '// Table.SelectRows(TypedSales, each [Year] = 2026)\n'
    '// A source-specific folding claim requires actual Power Query evidence.',
    ['Declare the raw order-line grain and the units of every numeric field.',
     'Predict which malformed quantity should be rejected and why.',
     'Run python3 labs/bi-workshop/run_lab.py transform and inspect the local ledger without editing real business data.',
     'Reconcile received, accepted and rejected counts and the 16000-cent accepted total.',
     'Explain a separate append, merge and unpivot use case in ordinary language.',
     'Label actual local observations separately from untested Power Query behavior.'], [
    q('A quantity cannot be parsed. What preserves the strongest audit trail?',
      ['Keep the raw value in a reject ledger with a reason', 'Replace it silently with zero', 'Delete the entire input without recording counts', 'Treat parsing failure as a successful sale'], 0,
      'A reject ledger preserves what was received and why it was excluded, allowing counts to reconcile without inventing a valid value.'),
    q('Two local plans produce the same total. What follows?',
      ['Power Query definitely folded every step', 'They agree for the checked fixture', 'All connectors support the same M operations', 'Their production runtimes will match'], 1,
      'Equality on a bounded dataset is local correctness evidence, not proof about a separate vendor engine or performance.'),
    q('What happens when a category-by-month grid is unpivoted?',
      ['Monthly columns become category-month records', 'It becomes order-line sales automatically', 'All months are added into one date', 'Every source key becomes unique automatically'], 0,
      'Unpivot changes the representation and grain. It does not establish equivalence to a transaction fact table.')
    ], ['folding'],
    ['A count-reconciled transformation ledger and one explicit rejection reason.',
     'The observed six-row accepted total; optional pushdown reasoning clearly marked as paper-only.',
     'A statement that Power Query folding remains unverified.'],
    'The CLI performs fixed local cleaning and validation only. Pushdown and unpivot are paper analogies; no SQL plan, M execution, connector folding or performance test is run.')

add('bi-star-filters', 'Declare grain and trace relationship filters',
    'Use a small star model to reason about unique keys, fact grain and intersecting filters.',
    ['Specify the meaning of one fact row before selecting relationships.',
     'Validate unique dimension keys and report unmatched fact keys.',
     'Trace two dimension filters into their shared fact table.'], [
    'Before selecting a chart, finish this sentence: one row records one specific event at this level of detail. Our synthetic facts contain order lines, not whole orders, monthly targets or stock balances. Quantity and line revenue belong to that grain. An order-level shipping charge repeated on every line would be overcounted by an ordinary sum, even if every relationship were technically valid. Grain is a business definition, not a property inferred safely from a column name.',
    'Separate descriptive entities from the recorded observations. Product has one row per product key and attributes such as category. Region has one row per region key. The Sales facts refer to those keys and retain their line-level quantities and amounts. A category label is not automatically a unique product identifier. Two products may share a category or color without being duplicates of the same entity.',
    'The teaching diagram uses a single-direction path from each dimension into Sales. Relationships describe how filters propagate; they are not instructions to materialize one permanently joined table. If a category selection admits two product keys, only facts with those keys remain eligible. A simultaneous region selection further restricts those facts. Draw arrows and list surviving line identifiers before calculating the aggregate so the result can be checked without trusting a black box.',
    'Validate key quality locally before trusting the model. A duplicated Product key can cause a conventional SQL join to multiply facts, and a missing lookup key can cause an inner join to drop a sale. Neither defect should be hidden by a pleasing total. The exercise rejects the duplicate-key fixture and reports unmatched references. Those are explicit classroom validation rules, not a claim that semantic model relationships enforce source integrity.',
    'There are legitimate complex models, but adding a second direction to every relationship is not a universal repair. It can make the route of a filter harder to explain. This introductory model excludes ambiguous paths, many-to-many bridges and engine-generated blank members. When an example needs those features, describe the missing requirement rather than quietly broadening the toy evaluator and calling it Power BI.',
    'Your evidence should make the selected rows inspectable. Retain the declared grain, dimension-key checks, relationship sketch, chosen filters and resulting fact identifiers. A correct sum without a trace is harder to diagnose when a fixture changes. A local join or set-intersection test is useful evidence of your reasoning, but the actual Power BI model and its relationship configuration remain uncreated and untested.'
    ],
    'The model receipt contains six facts, three products, two regions and 365 dates. Its controlled duplicate-key and orphan-fact cases are rejected. The companion context receipt reports Hardware at 9000 cents and North plus Hardware at 3000, keeping only F2. The North-only 7000 subtotal is shown in the access receipt and can also be derived from the facts; do not add independent totals to calculate an intersection.',
    '// Conceptual DAX measure, not executed here.\n'
    '// Revenue = SUM(Sales[RevenueCents])\n'
    '// Predict the rows retained by Product[Category] and Region[Name].\n'
    '// A real model must configure and validate the relationship paths.',
    ['Write the order-line grain and name one amount that would violate it.',
     'Draw Product and Region as unique-key dimensions pointing toward Sales.',
     'Run python3 labs/bi-workshop/run_lab.py model and inspect its synthetic duplicate-key and orphan checks.',
     'List the lines surviving category and region filters before calculating their sum.',
     'Explain the duplicate-lookup failure without silently deleting evidence.',
     'Record the excluded relationship complexities and actual-vendor validation still needed.'], [
    q('What does the declared grain explain?',
      ['The business meaning of one fact row', 'The preferred chart color', 'The workspace password policy', 'The file extension'], 0,
      'Grain identifies the event and level of detail represented by a record; it determines which aggregations make sense.'),
    q('Hardware and North filters both reach Sales. Which rows qualify in this simple model?',
      ['Rows satisfying either filter alone', 'Rows satisfying both filters', 'Every row twice', 'Only rows without product keys'], 1,
      'Independent dimension restrictions intersect at the facts. Adding separately filtered totals would double-count or include ineligible rows.'),
    q('A lookup key is duplicated. What is the sound teaching response?',
      ['Flag the key-quality failure before accepting the result', 'Assume relationships repair it', 'Hide the duplicate in the chart', 'Count the extra join rows as new sales'], 0,
      'A unique-key dimension is a declared assumption. A violated assumption should produce visible evidence, not an unexplained total.')
    ], ['star', 'relationships'],
    ['A declared grain and labelled one-way relationship diagram.',
     'Unique-key and unmatched-reference results including a negative fixture.',
     'A row-level trace for the category/region intersection.'],
    'This is a simple star-filter teaching model, not Power BI relationship execution, bidirectional filtering, many-to-many support or referential-integrity enforcement.')

add('bi-context', 'Separate stored row values from filter-context measures',
    'Predict aggregate changes and same-column filter replacement without claiming to emulate DAX.',
    ['Choose a row-derived value or query-time aggregate for a stated need.',
     'Explain replacement versus intersection for a simple same-column filter.',
     'Recognize that totals and ratios must answer the stated business question.'], [
    'A value attached to one line and a total over selected lines answer different questions. The first might be quantity multiplied by unit price; the second might be revenue for the currently selected period and category. In the Import-oriented teaching case, calculated columns are stored refresh-time results, while measures are evaluated for query context. Changing a region selection should change the selected aggregate, not rewrite the historical line amount.',
    'Make the visible population explicit before applying an arithmetic formula. A report total is a calculation over a context, not necessarily the sum of the numbers currently visible in a screenshot. The same measure definition can produce different answers under different selections. The fixed context command filters a collection and aggregates it. It does not execute a semantic-model query or reproduce the complete DAX type system.',
    'CALCULATE evaluates an expression under changed filter context. For the narrow same-column case here, a new region filter replaces the previous region filter by default, while KEEPFILTERS preserves intersection. Represent that difference with labelled selected-key sets rather than a magic function called a DAX engine. Existing filters on other relevant columns still matter; replacing region does not mean removing every restriction from the model.',
    'Row context and filter context are different concepts. A current row gives a row expression a place to obtain its field values. Context transition can turn row context into a filter context; a model-measure call in row context has automatic transition behavior. We explain that distinction but do not implement general transition, expanded tables, auto-exist or relationship modifiers. A toy dictionary of filters must not be presented as sufficient to reproduce those semantics.',
    'Ratios require an explicit denominator and aggregation level. Revenue divided by units answers average realized revenue per unit, whereas averaging line unit prices weights every line equally. Both are mathematically possible and can disagree without either arithmetic operation being broken. Ask which population and weighting the business question requires. Also distinguish no matching rows from a measured zero: this workshop may use None for empty results, which is a local convention rather than universal DAX BLANK behavior.',
    'Record predictions before running any supplied conceptual model. Then compare observed selected rows and aggregates with the prediction, not merely with a green test status. Illustrative formulas are reading material, not vendor-validated code. The most valuable outcome is an explanation of why a result changed, what context was preserved and where the model deliberately stops.'
    ],
    'The context receipt shows Hardware 9000 cents and North plus Hardware 3000. Replace North with South while preserving Hardware: 6000. Keep both North and South restrictions on that same region column: empty/None. F1 row amount is 2000, while the overall aggregate is 16000. These are Python filtering results, not DAX execution.',
    '// Illustrative DAX only; no engine execution or compatibility test.\n'
    '// Revenue = SUM(Sales[RevenueCents])\n'
    '// South Revenue = CALCULATE([Revenue], Region[Name] = "South")\n'
    '// South Intersection = CALCULATE([Revenue], KEEPFILTERS(Region[Name] = "South"))',
    ['Classify line revenue and selected revenue as row-derived or query-time values.',
     'Predict the facts surviving Hardware and then North plus Hardware.',
     'Run python3 labs/bi-workshop/run_lab.py context and compare replacement of North by South with intersection on the same region column.',
     'As an optional paper extension, explain why revenue divided by units need not equal an unweighted mean of line prices.',
     'Write an explicit convention for an empty local result without calling it full BLANK semantics.',
     'Name two DAX behaviors that the conceptual exercise does not implement.'], [
    q('A report region selection changes. Which expectation fits the teaching case?',
      ['A selected aggregate changes while stored line amounts remain fixed', 'Every historical unit price is rewritten', 'The file becomes a deployed semantic model', 'Calculated columns must all become measures'], 0,
      'A query selection changes the evaluated population, not the source line facts in this Import-oriented example.'),
    q('What does a new same-column filter normally do inside CALCULATE without KEEPFILTERS?',
      ['Always intersect with the old value', 'Replace that existing column restriction', 'Erase all filters everywhere', 'Modify source rows permanently'], 1,
      'The example concerns replacement on the same filtered column. KEEPFILTERS changes the combination to intersection; other context is not automatically erased.'),
    q('Which expression answers revenue per unit over the whole selected population?',
      ['Total revenue divided by total units', 'Unweighted average of line prices in every case', 'Sum of product identifiers', 'Maximum unit price minus number of lines'], 0,
      'The numerator and denominator use the same population and weight by units. A mean of line prices instead weights each line equally.')
    ], ['calculations', 'calculate'],
    ['F1 row amount 2000 versus total 16000, with the context trace.',
     'Replacement and intersection predictions with empty-result conventions.',
     'A ratio explanation naming population, weighting and omitted DAX behaviors.'],
    'Illustrative DAX is unexecuted. The bounded model is not a parser or emulator and excludes general context transition, expanded tables, auto-exist and full BLANK semantics.')

add('bi-date-reasoning', 'Define time periods before comparing results',
    'Use a complete calendar, explicit date roles and clear aggregation rules for reliable comparisons.',
    ['Validate a calendar separately from dates present in transactions.',
     'Distinguish order-date and ship-date questions.',
     'Explain partial-period comparisons and semi-additive stock measures.'], [
    'A transaction table answers when recorded events occurred. It does not necessarily contain every date that a report should display or compare. A calendar supplies the missing structure: years, months and an uninterrupted set of dates across the chosen span. Our synthetic calendar covers the complete year 2026, including dates with no orders. A missing event is not evidence that the date itself should disappear from the analytical model.',
    'Validate dates as data rather than as attractive labels. Check uniqueness, absence of blanks, continuity and complete years for the classic-style example. Current Microsoft guidance distinguishes classic and calendar-based time intelligence, so do not universalize a date-table marking rule across every feature. No date table is actually configured in Power BI here; our local calendar establishes a teaching invariant and leaves vendor configuration pending.',
    'Compare like periods using a stated cutoff. January against January is different from January through the fifteenth against a complete prior January. If data arrives late, the report end date and the source completeness date can differ. Write both when necessary. A YearMonth key avoids grouping January from several years into one unlabeled bucket, and a business timezone should be chosen before timestamps are converted to reporting dates.',
    'An order can have several dates with legitimate meanings. Order date measures demand timing; ship date measures fulfillment timing. A date selection cannot answer both questions accidentally. Draw distinct roles and identify the intended path for each calculation. This optional paper extension draws conceptual paths only. The fixture has no ship-date field and the CLI computes no role-playing date result; no active/inactive relationship or USERELATIONSHIP behavior is tested.',
    'Some values should not be summed across time. Daily revenue can normally be added across the selected dates in this fixture, but end-of-day stock is a snapshot. Adding two consecutive stock balances counts the same inventory repeatedly. In this optional paper extension, a closing-balance rule needs a chosen date and a policy for missing observations. The CLI has no stock fixture or closing-stock calculation. Last known balance and balance exactly on the selected date are different questions, and neither should be silently substituted for the other.',
    'Keep the evidence compact but decisive: calendar count, minimum and maximum dates, duplicate and gap checks and period definitions. Any date-role diagram or hypothetical totals are optional paper evidence, not this command’s output. A hand calculation is an expected answer until an actual local run is captured. A passing local check demonstrates this synthetic calendar and arithmetic, not execution of DAX time-intelligence functions or successful model configuration.'
    ],
    'The dates receipt validates 365 dates in 2026, detects a deleted January 2, and rejects a contiguous 59-day January/February list as incomplete for its full-year contract. January is 6000 cents; February is 10000; growth is 4000/6000, or two thirds. YTD totals are 6000 at January 2, 14000 at February 1 and 16000 at February 2. Date-role and stock discussions are paper-only extensions, not command outputs.',
    '// Illustrative DAX reading only; unexecuted.\n'
    '// Revenue = SUM(Sales[RevenueCents])\n'
    '// A prior-period calculation needs a deliberate date table and date role.\n'
    '// Do not replace time-intelligence validation with a Python date loop.',
    ['State the complete calendar range and predict its row count.',
     'Run python3 labs/bi-workshop/run_lab.py dates; inspect the full-year, deleted-date and incomplete-year cases.',
     'Define the January/February comparison, calculate 4000/6000 growth and inspect the three YTD cutoffs.',
     'As a paper-only extension, contrast order-date and ship-date questions; the fixture has no ship-date calculation.',
     'As a paper-only extension, choose a closing-stock rule; the CLI does not compute stock snapshots.',
     'List the real date-model and time-intelligence validation that remains unperformed.'], [
    q('Why include dates without sales in the teaching calendar?',
      ['The analytical time structure is separate from observed events', 'Every missing date is a hidden sale', 'It guarantees exam readiness', 'It removes the need for a date role'], 0,
      'An uninterrupted calendar can represent periods consistently even when no transactions occur on some dates.'),
    q('What makes a year-over-year comparison potentially misleading?',
      ['Comparing complete equal months', 'Comparing a partial current period with an unexplained full prior period', 'Stating the cutoff date', 'Naming the denominator'], 1,
      'Different observation windows can dominate the apparent change. Declare and align periods before interpreting growth.'),
    q('Stock balances are 10 on Monday and 12 on Tuesday. Under a Tuesday closing rule, what is closing stock?',
      ['12', '22', '2', 'The number of calendar dates'], 0,
      'A stock balance is a snapshot. Summing balances across dates double-counts inventory instead of reporting the closing position.')
    ], ['dates', 'relationships'],
    ['Calendar integrity results and a named date-role diagram.',
     'January/February and YTD arithmetic with explicit cutoffs and denominator.',
     'A closing-balance policy and pending vendor-validation statement.'],
    'No Power BI date-table settings, DAX time intelligence, USERELATIONSHIP or calendar-based feature behavior is executed. The snapshot rule is fixture-specific.')

add('bi-report-design', 'Design a report with explicit denominators and access needs',
    'Explain totals and report choices while separating a checklist from rendered accessibility testing.',
    ['Choose a visual and denominator that answer a specific question.',
     'Specify meaningful labels, alt text and navigation order.',
     'Separate a report-plan check from actual accessibility validation.'], [
    'Begin with a decision the reader needs to make: which category contributes the most revenue in this synthetic period? A sorted category comparison is easier to explain when the title identifies the metric, period and units. A large number without those details can be accurate arithmetic and still mislead. The report plan should tell the reader what is being counted and what is outside the selected scope.',
    'A percentage requires a visible reference population. Hardware is 9000 of the complete 16000-cent total, so its all-category share is 56.25%. If the report selects only Hardware and uses the selected population as denominator, the share becomes 100%. Neither value can be interpreted safely without naming its denominator. A dynamic report must preserve that distinction as selections change, rather than letting a static heading promise an all-category comparison that the calculation no longer provides.',
    'Accessibility begins with the authored structure: informative labels, useful alt text, a sensible navigation order and units understandable without guessing. Color can reinforce category identity, but should not carry the only distinction. A table alternative can make exact values available when a chart is difficult to interpret. Explain how each element helps a reader accomplish the report task; merely adding more objects does not necessarily make a page easier to use.',
    'The fixed report exercise checks a plan for missing alt text, order and units. Passing those presence checks establishes only that the plan declares the required fields. It cannot establish that the text is meaningful, that focus moves correctly, that contrast is adequate or that a screen reader handles the rendered report. Those require human review and real product testing with appropriate assistive technology.',
    'For a paper extension, sketch the same data with a misleading truncated bar axis and compare it with a plainly labelled alternative. Ask a peer to identify the largest category and the denominator without prompting. If they cannot, revise the design before adding decorative elements. This extension is optional critique, not output generated by the report command and not a deployed Power BI visual.',
    'Record both the numerical evidence and the untested experience. Keep category totals, the two Hardware shares, checklist failures and a short design rationale. State that no Power BI page, bookmark, drillthrough path, mobile layout or rendered accessibility test was produced. That boundary allows the local work to be useful without converting a planning exercise into a claim of product validation.'
    ],
    'The report receipt compares Hardware 9000, Supply 3000 and Service 4000 cents. Hardware is 56.25% against all 16000 cents, but 100% when selected Hardware is its own denominator. A plan without alt text, reading order or units is flagged. A repaired plan is still a specification awaiting rendered review.',
    '# Fixed local report-plan and arithmetic simulation only.\npython3 labs/bi-workshop/run_lab.py report',
    ['Write the single decision that the proposed report should help someone make.',
     'Predict each category total and both Hardware percentage denominators.',
     'Run only the supplied report command and compare its arithmetic with your prediction.',
     'Inspect the missing-alt-text, order and units findings without calling them screen-reader tests.',
     'Sketch a labelled comparison and a text/table alternative using synthetic values.',
     'Separate plan checks completed locally from rendered Power BI tests still pending.'], [
    q('Hardware is 9000 out of all-category revenue 16000. What is its share?',
      ['56.25%', '100% regardless of denominator', '9%', '160%'], 0,
      'Divide 9000 by 16000. A 100% answer instead describes Hardware relative to a Hardware-only selected population.'),
    q('A report plan has an alt-text field. What has been established?',
      ['That a screen reader passed every visual', 'Only that the checked field is present', 'That tab order is correct in Power BI', 'That all color contrasts are adequate'], 1,
      'A presence check does not evaluate rendered behavior or the quality of the description.'),
    q('What should accompany a changing percentage?',
      ['An understandable denominator and selection scope', 'Only a decorative icon', 'A hidden date range', 'An unexplained color'], 0,
      'Readers need the reference population to understand why a share changes and what comparison it supports.')
    ], ['accessibility'],
    ['Category totals and two explicitly named Hardware share denominators.',
     'Report-plan failures and a revised labelled wireframe.',
     'A list of rendered accessibility and interaction tests still unperformed.'],
    'The CLI checks a fixed plan and arithmetic. It renders no Power BI report and cannot validate assistive-technology behavior, navigation, contrast or usability.')

add('bi-storage-refresh', 'Choose storage with a visible freshness contract',
    'Reason about copied snapshots, source dependence and deployment requirements without running cloud services.',
    ['Distinguish source-data refresh from visual refresh.',
     'Compare a stale snapshot with a source-dependent read during an outage.',
     'Propose a storage choice with explicit untested assumptions.'], [
    'A report can be mathematically correct for the data it holds while being too old for the decision it supports. Freshness therefore belongs in the requirement, not in a footnote added after the chart is complete. Name the latest source event included in the model and the time the model was last updated. The local exercise deliberately creates a difference between a copied snapshot and a later source state so that staleness is visible.',
    'Imported data is a copy that requires a source-data refresh to include later records. Requerying a visual over the existing copy does not itself fetch those records. Our invented snapshot contains F1 through F4, totaling 12000 cents, while the later source contains all six facts, totaling 16000. The difference is not an arithmetic defect: it is a difference in which events are available to the query.',
    'DirectQuery sends queries to supported sources at report time, which introduces source and network dependence as well as cache considerations. The teaching model represents only a source-required read and a declared outage. It does not emulate SQL generated by Power BI, cache invalidation, gateway connectivity or transaction consistency. An outage result in this model must not be described as a measured availability characteristic of a vendor service.',
    'Direct Lake is a separate architectural option with Delta data, Fabric and metadata framing. Its OneLake and SQL-endpoint variants differ, including fallback behavior. The refresh command does not simulate either variant. A written storage recommendation may consider it for an established Fabric estate, but it should identify capacity, source architecture and product testing as prerequisites rather than assuming a local CSV experiment validates a lakehouse design.',
    'Write a refresh contract in plain language: acceptable data age, responsible owner, expected source availability, failure signal and recovery steps. Also identify schema drift and credential or gateway requirements for later verification. For a small daily teaching report, Import may be a sensible candidate; a stricter latency requirement may change the tradeoff. These are design hypotheses, not a promise that a particular mode will meet a production service level.',
    'Run the fixed refresh case and explain which value remains available from the copied snapshot during the invented outage, and which read requires the source. Keep snapshot age separate from availability. No account, schedule, paid capacity, gateway or remote connection is created. The useful deliverable is an evidence-backed choice with clear limitations, not a claim that a production refresh pipeline is operating.'
    ],
    'F1–F4 sum to 12000 cents; the later six-fact source totals 16000. The stale copy and the source-required path behave differently under a simulated outage. This is an invented local comparison, not an Import/DirectQuery benchmark or a Direct Lake refresh test.',
    '# Fixed local snapshot/outage teaching model; no provider connection.\npython3 labs/bi-workshop/run_lab.py refresh',
    ['Define how recent the data must be for the fictional business decision.',
     'Predict the 12000-cent copied snapshot and 16000-cent later source totals.',
     'Run the fixed refresh command and distinguish staleness from source availability.',
     'Explain why refreshing a visual over copied data need not fetch later facts.',
     'Write a provisional storage choice with freshness, ownership and failure assumptions.',
     'List the gateway, credentials, capacity and actual-provider tests that remain pending.'], [
    q('A visual reaggregates an unchanged copied snapshot. Which total should it use?',
      ['The snapshot total of 12000 cents', 'The later source total automatically', 'Zero because data is copied', 'A random total chosen by the chart'], 0,
      'Requerying the same copied population does not add records that were never imported into that snapshot.'),
    q('What does the invented outage scenario establish?',
      ['A real service uptime guarantee', 'The behavior of this bounded local source-dependence model', 'That DirectQuery has no caches', 'That Direct Lake always falls back to SQL'], 1,
      'The scenario distinguishes conceptual dependence on a source from copied-data availability, without testing a provider.'),
    q('Which statement about the exercise is accurate?',
      ['Direct Lake framing is discussed but not modeled', 'A Fabric capacity was configured', 'A gateway was installed', 'A scheduled refresh was published'], 0,
      'The workshop is local and bounded. Real service configuration and Direct Lake behavior remain separate work.')
    ], ['refresh', 'directquery', 'directlake'],
    ['A snapshot/source timeline with separate totals and outage interpretation.',
     'A storage recommendation tied to a stated freshness requirement.',
     'An explicit list of unconfigured service dependencies and untested guarantees.'],
    'No actual storage engine, cache, gateway, source service, scheduled refresh or Direct Lake framing/fallback is executed.')

add('bi-access-rls', 'Separate workspace capability from row visibility',
    'Use a hypothetical policy matrix to expose privilege and role-union mistakes without creating real security.',
    ['Distinguish workspace roles, Build permission and a row-filtering role.',
     'Predict the bounded policy outcomes for viewers and editors.',
     'Explain why a readable local fixture cannot be a security boundary.'], [
    'Security questions must identify both the action and the data. Permission to read a report is different from permission to edit a workspace, and both differ from the rows a particular reader should see. Start with a matrix naming the intended person, their capabilities and their allowed regions. Use fictional identities only. A convincing-looking report filter does not establish enforcement against someone who can inspect the underlying data.',
    'In the documented Power BI workspace case, RLS constrains Viewers rather than Admins, Members or Contributors. Our bounded policy matrix therefore shows a North Viewer at 7000 cents and those editor-level roles at the full 16000. That outcome warns against giving an intended restricted reader an elevated workspace role. It is not a general authorization engine for every sharing, embedding or export arrangement.',
    'Build permission and workspace editing are not the same permission. In the fixed case, a Viewer with Build remains restricted to the assigned North data, still totaling 7000. Treat this as a deliberately scoped scenario and verify effective permissions in the actual service before deployment. A permissions label alone is insufficient if group membership or another access route grants additional capability.',
    'Multiple allowed region roles combine as a union in this exercise. Assigning both North and South produces all 16000 cents, not an empty intersection and not the smaller subtotal. This demonstrates why adding another role can widen visibility. A Viewer with no assigned permitted role is denied by the teaching policy. That explicit local rule must not be mistaken for a universal description of every possible platform access arrangement.',
    'The command performs classification and set filtering over fully readable synthetic data. A learner can open the fixture or change Python, so none of the data is protected by this exercise. The distinction matters: successful tests here validate a policy explanation, not protection of secrets. Actual enforcement needs a real semantic model, effective identities, configured role membership and tests of relevant access paths.',
    'Record expected and observed results for a restricted Viewer, Viewer with Build, elevated workspace role, two-region membership and missing membership. Then write a separate service-side test plan covering intended and unintended users, group overlap and relevant export behavior. No sharing, publication or account modification is performed. The capstone should retain the untested security items instead of treating local arithmetic as a deployment approval.'
    ],
    'The fixed model predicts North Viewer 7000 cents; North Viewer with Build 7000; Member, Contributor or Admin 16000; combined North/South roles 16000. Missing Viewer membership is denied by the classroom policy. All facts remain locally readable, so none of these outputs implements actual authorization.',
    '# Hypothetical permission classification and set filtering only.\npython3 labs/bi-workshop/run_lab.py access',
    ['Create a fictional capability-and-region matrix without any real user identifiers.',
     'Predict the restricted Viewer and Viewer-with-Build totals.',
     'Run the fixed access command and compare elevated-role and union-role outcomes.',
     'Inspect the missing-membership denial as a teaching policy, not a universal platform guarantee.',
     'Explain why access to the readable fixture defeats any claim of actual protection.',
     'Write the separately required real-service identity, membership and access-path tests.'], [
    q('Which workspace-role choice is unsafe for a person who must be restricted by RLS in this scenario?',
      ['Contributor', 'Viewer with the intended row role', 'A tested restricted Viewer', 'A read-only Viewer assignment'], 0,
      'The documented workspace RLS restriction does not apply to Contributor, Member or Admin roles.'),
    q('What happens when the fixed Viewer has both North and South region roles?',
      ['Only the smaller region remains', 'The union includes all 16000 cents', 'Both roles cancel all access', 'The source records are permanently deleted'], 1,
      'These allowed-role populations union, so an additional role broadens the visible rows.'),
    q('Why is this local command not a security boundary?',
      ['The complete fixture remains readable and the code is modifiable', 'All permission reasoning is useless', 'A green test automatically grants workspace access', 'Python establishes cloud identities automatically'], 0,
      'Local set filtering can illustrate policy but cannot protect a dataset that the learner can directly inspect.')
    ], ['workspace', 'rls'],
    ['A scoped hypothetical permissions matrix with predicted and observed totals.',
     'An explanation of elevated privileges and unioned role membership.',
     'A real-service validation plan explicitly marked unexecuted.'],
    'No authentication, authorization, real RLS, identity resolution, export protection or account changes occur. Every synthetic fixture row remains locally accessible.')

add('bi-capstone', 'Assemble a bounded analytical handoff',
    'Reconcile local evidence and explain exactly which product skills and deployment checks remain untested.',
    ['Connect the transformation, model and period totals into a coherent evidence trail.',
     'Produce a clear report, freshness and access design with honest boundaries.',
     'Map selected concepts to a dated objective guide without readiness or completeness claims.'], [
    'A useful handoff explains the question, the data population, the transformation decisions and the meaning of the final answer. Begin with the fictional shop: six accepted order lines total 16000 cents after one malformed raw row is rejected. Connect that total to the model and report choices rather than presenting unrelated screenshots or quiz scores. Every number should have a defined population and unit.',
    'The capstone command reconciles transformed facts, model validity and January/February totals while retaining scope notes. It does not silently run every possible product workflow. Use the other seven receipts when their evidence is needed, and describe only checks that actually ran. A printed expected value is not an observed result, and a local result is not a vendor result even when its arithmetic matches an illustrative formula.',
    'Collect the artifacts that help another analyst reason about the model: declared grain, key-quality findings, transformation ledger, date policy, context trace and report specification. Link each conclusion to its evidence. Keep the report-plan checklist separate from rendered accessibility testing, the source-outage illustration separate from service availability, and the permissions matrix separate from deployed row-level security.',
    'A thoughtful reviewer should look for contradictions rather than only successful cases. Does a malformed quantity disappear without explanation? Does the report percentage change its denominator without changing its label? Is a restricted reader assigned an elevated workspace role? Can a partial calendar be mistaken for a full-year date-table contract? These questions test reasoning across lessons while remaining within the synthetic scenario.',
    'The official PL-300 guide read on November 7, 2026 lists objectives effective April 20, 2026 and a page update of October 30, 2026. This workshop touches selected preparation, modeling, reporting and management concepts. It does not execute connectors, M, DAX, native reports, publishing, gateway refresh or service security, and it omits additional objectives. The mapping is a learning-gap aid, not an exam coverage percentage, complete syllabus or readiness score.',
    'End with a precise claim: the retained receipts show bounded local teaching computations, and the remaining product work is unexecuted. A later authorized Power BI exercise would need real model configuration, formula validation, interactions, accessibility and effective-permission testing before making broader claims. The current deliverable is useful because it makes the reasoning and the missing evidence visible, not because it pretends that a local Python program is the vendor platform.'
    ],
    'Expected final reconciliation: six valid facts and one rejected raw row; 16000 total cents; January 6000 plus February 10000 equals 16000; a full-year 2026 calendar has 365 dates. The evidence bundle also retains the explicit list of unexecuted Power BI tasks. No completion badge, exam prediction or deployment approval follows from these local checks.',
    '# Local reconciliation with scope notes only.\npython3 labs/bi-workshop/run_lab.py capstone',
    ['State the fictional business question, order-line grain and currency units.',
     'Run the capstone command and reconcile its totals with the relevant earlier receipts.',
     'Retain rejected-row and key-validation evidence rather than only successful summaries.',
     'Attach a report plan, freshness decision and hypothetical access matrix with their limitations.',
     'Write a dated partial objective-gap note and a list of product exercises still unperformed.',
     'Have a reviewer challenge one numerical claim and one overbroad validation claim.'], [
    q('Which conclusion is supported by a passing capstone receipt?',
      ['The bounded local reconciliation passed for its synthetic inputs', 'All Power BI capabilities were executed', 'The learner is certified-ready', 'The report is safe to publish with real data'], 0,
      'The evidence supports only the computations and checks that actually ran, under the recorded fixture and scope.'),
    q('Which period reconciliation is expected?',
      ['6000 plus 10000 equals 16000 cents', '6000 plus 10000 equals 12000 cents', 'January alone proves a full-year source', 'A percentage replaces the monetary total'], 0,
      'January and February partition these six facts. The complete calendar does not imply that transactions exist on every date.'),
    q('What should the objective-guide mapping communicate?',
      ['Selected conceptual links and remaining product gaps', 'A fabricated percentage of exam readiness', 'That Python executes DAX', 'That all objectives have been implemented'], 0,
      'A dated partial mapping is useful for further planning, but coverage and readiness need evidence this workshop does not provide.')
    ], ['guide'],
    ['A reconciled capstone receipt with relevant preceding local evidence.',
     'A reviewable report/freshness/access handoff using only synthetic data.',
     'A dated partial objective-gap map and explicit unexecuted-product checklist.'],
    'The capstone is not a Power BI lab pass, complete certification course, accessibility certification, production assessment or deployment approval.')

# Shell snippets invoke only the fixed wrapper; DAX/M examples above are comments.
for lesson in LESSONS:
    if 'python3 labs/' in lesson['workedCode']:
        lesson['codeLanguage'] = 'sh'
assert len(LESSONS) == 8

# Fixed, allowlisted commands for the first four lessons.
for lesson, command in zip(LESSONS[:4], ['transform', 'model', 'context', 'dates']):
    lesson['workedCode'] = ('# Local Python teaching model only; vendor code below is illustrative and unexecuted.\n' + 'python3 labs/bi-workshop/run_lab.py ' + command + '\n' + lesson['workedCode'])
    lesson['codeLanguage'] = 'text'

PATH = dict(
    id='bi-workshop', title='Power BI Concepts and Analytical Reasoning Workshop',
    summary='Eight connected lessons use fixed local Python teaching models to explain transformations, star filters, calculation context, dates, report design, freshness and hypothetical access without executing Power BI.',
    lessonIds=[lesson['id'] for lesson in LESSONS],
    prerequisites=['data-question-grain', 'data-join-cardinality', 'data-null-metrics'],
    caseIds=[],
    limits='Power BI, Power Query M, DAX, gateways, semantic-model configuration, rendered accessibility and real authorization/RLS are unexecuted. Python results are bounded teaching simulations, not vendor emulation, production readiness, complete objective coverage or exam readiness.')

# Keep executable and unexecuted examples visibly separated in every snippet.
for lesson in LESSONS:
    lesson['workedCode'] = '# Power BI, M and DAX remain unexecuted.\n' + lesson['workedCode']
