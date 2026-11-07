"""Visible acceptance cases; outcomes are independent of the implementation."""
import copy
import unittest
HEADER = 'event_id,label,duration_ms,status\n'
CSV = HEADER + 'EVT-001,repair,100,ok\nEVT-002,inspection,400,failed\nEVT-001,repair,100,ok\nEVT-003,"repair, detail",200,ok\nEVT-004,repair,100,ok\n'
ROWS = [dict(event_id='EVT-001', label='repair', duration_ms=100, status='ok'), dict(event_id='EVT-002', label='inspection', duration_ms=400, status='failed'), dict(event_id='EVT-001', label='repair', duration_ms=100, status='ok'), dict(event_id='EVT-003', label='repair, detail', duration_ms=200, status='ok'), dict(event_id='EVT-004', label='repair', duration_ms=100, status='ok')]

def make_suite(candidate):

    class EventContract(unittest.TestCase):

        def test_valid_event_is_copied(self):
            e = ROWS[0].copy()
            r = candidate.validate_event(e)
            self.assertEqual(r, e)
            self.assertIsNot(r, e)

        def test_event_id_rules(self):
            for value in ['EVT-01', 'EVT-1234567', 'evt-123', 'EVT-１２３', 5]:
                e = ROWS[0].copy()
                e['event_id'] = value
                with self.subTest(value=value), self.assertRaises(ValueError):
                    candidate.validate_event(e)

        def test_label_rules(self):
            for value in ['', ' padded', 'x\n', 'x' * 41, None]:
                e = ROWS[0].copy()
                e['label'] = value
                with self.subTest(value=value), self.assertRaises(ValueError):
                    candidate.validate_event(e)

        def test_duration_bounds_types(self):
            for value in [0, 600000]:
                e = ROWS[0].copy()
                e['duration_ms'] = value
                self.assertEqual(candidate.validate_event(e)['duration_ms'], value)
            for value in [-1, 600001, True, 1.0, '1']:
                e = ROWS[0].copy()
                e['duration_ms'] = value
                with self.subTest(value=value), self.assertRaises(ValueError):
                    candidate.validate_event(e)

        def test_status_and_fields(self):
            e = ROWS[0].copy()
            e['status'] = 'maybe'
            with self.assertRaises(ValueError):
                candidate.validate_event(e)
            e = ROWS[0].copy()
            e['extra'] = 1
            with self.assertRaises(ValueError):
                candidate.validate_event(e)

        def test_csv_sample_and_quoted_comma(self):
            self.assertEqual(candidate.parse_events_csv(CSV), ROWS)

        def test_header_exact(self):
            for text in ['', 'label,event_id,duration_ms,status\n', 'event_id,label,duration_ms,status,extra\n']:
                with self.subTest(text=text), self.assertRaises(ValueError):
                    candidate.parse_events_csv(text)

        def test_header_only_is_empty(self):
            self.assertEqual(candidate.parse_events_csv(HEADER), [])

        def test_csv_row_shape(self):
            for text in ['EVT-001,x,1\n', 'EVT-001,x,1,ok,extra\n', '\n']:
                with self.subTest(text=text), self.assertRaises(ValueError):
                    candidate.parse_events_csv(HEADER + text)

        def test_csv_integer_lexical_rules(self):
            for value in ['-1', '+1', '1.0', ' 1', '１', 'NaN', '1000000']:
                with self.subTest(value=value), self.assertRaises(ValueError):
                    candidate.parse_events_csv(HEADER + f'EVT-001,x,{value},ok\n')

        def test_unterminated_quote(self):
            with self.assertRaises(ValueError):
                candidate.parse_events_csv(HEADER + 'EVT-001,"unfinished,1,ok\n')

        def test_limits(self):
            with self.assertRaises(ValueError):
                candidate.parse_events_csv(' ' * 16385)
            with self.assertRaises(ValueError):
                candidate.parse_events_csv(HEADER + 'EVT-001,x,1,ok\n' * 201)
            self.assertEqual(len(candidate.parse_events_csv(HEADER + 'EVT-001,x,1,ok\n' * 200)), 200)

        def test_sample_summary(self):
            r = candidate.summarize_events(copy.deepcopy(ROWS))
            self.assertEqual({k: r[k] for k in ['input_rows', 'unique_events', 'duplicate_rows', 'successes', 'failures', 'total_duration_ms', 'mean_duration_ms']}, {'input_rows': 5, 'unique_events': 4, 'duplicate_rows': 1, 'successes': 3, 'failures': 1, 'total_duration_ms': 800, 'mean_duration_ms': 200.0})

        def test_grouped_totals(self):
            self.assertEqual(candidate.summarize_events(ROWS)['by_label'], [{'label': 'inspection', 'events': 1, 'failures': 1, 'duration_ms': 400}, {'label': 'repair', 'events': 2, 'failures': 0, 'duration_ms': 200}, {'label': 'repair, detail', 'events': 1, 'failures': 0, 'duration_ms': 200}])

        def test_slowest_tie_breaking(self):
            self.assertEqual(candidate.summarize_events(ROWS)['slowest'], [{'event_id': 'EVT-002', 'duration_ms': 400}, {'event_id': 'EVT-003', 'duration_ms': 200}, {'event_id': 'EVT-001', 'duration_ms': 100}])

        def test_empty_mean_is_none(self):
            r = candidate.summarize_events([])
            self.assertEqual(r['mean_duration_ms'], None)
            self.assertEqual(r['unique_events'], 0)
            self.assertEqual(r['slowest'], [])

        def test_duplicate_is_not_counted_twice(self):
            r = candidate.summarize_events([ROWS[0], ROWS[0]])
            self.assertEqual(r['unique_events'], 1)
            self.assertEqual(r['duplicate_rows'], 1)
            self.assertEqual(r['total_duration_ms'], 100)

        def test_conflicting_duplicate_rejected(self):
            e = ROWS[0].copy()
            e['duration_ms'] = 101
            with self.assertRaises(ValueError):
                candidate.summarize_events([ROWS[0], e])

        def test_input_not_mutated(self):
            rows = copy.deepcopy(ROWS)
            before = copy.deepcopy(rows)
            candidate.summarize_events(rows)
            self.assertEqual(rows, before)

        def test_order_invariance(self):
            self.assertEqual(candidate.summarize_events(ROWS), candidate.summarize_events(list(reversed(ROWS))))

        def test_limit_zero_and_invalid(self):
            self.assertEqual(candidate.summarize_events(ROWS, 0)['slowest'], [])
            for limit in [-1, 11, True, '3']:
                with self.subTest(limit=limit), self.assertRaises(ValueError):
                    candidate.summarize_events(ROWS, limit)

        def test_repeated_calls_do_not_share_accumulators(self):
            self.assertEqual(candidate.summarize_events([ROWS[0]])['unique_events'], 1)
            self.assertEqual(candidate.summarize_events([])['unique_events'], 0)

        def test_fractional_mean_not_truncated(self):
            a = ROWS[0].copy()
            b = ROWS[1].copy()
            a['duration_ms'] = 1
            b['duration_ms'] = 2
            self.assertEqual(candidate.summarize_events([a, b])['mean_duration_ms'], 1.5)
    return unittest.defaultTestLoader.loadTestsFromTestCase(EventContract)
