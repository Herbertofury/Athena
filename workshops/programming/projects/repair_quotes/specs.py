"""Visible acceptance contract, run against either learner or reference code."""
import copy
import json
import unittest
SAMPLE = [{'sku': 'FILTER', 'quantity': 2, 'unit_cents': 1250}, {'sku': 'BRUSH', 'quantity': 3, 'unit_cents': 499}, {'sku': 'FILTER', 'quantity': 1, 'unit_cents': 1000}]
EXPECTED = {'line_count': 3, 'unit_count': 6, 'subtotal_cents': 4997, 'by_sku': [{'sku': 'BRUSH', 'quantity': 3, 'subtotal_cents': 1497}, {'sku': 'FILTER', 'quantity': 3, 'subtotal_cents': 3500}]}

def make_suite(candidate):

    class QuoteContract(unittest.TestCase):

        def test_one_valid_item_returns_a_copy(self):
            item = SAMPLE[0].copy()
            out = candidate.validate_item(item)
            self.assertEqual(out, item)
            self.assertIsNot(out, item)

        def test_exact_fields(self):
            for item in [{'sku': 'A', 'quantity': 1}, {'sku': 'A', 'quantity': 1, 'unit_cents': 1, 'extra': 0}, []]:
                with self.subTest(item=item), self.assertRaises(ValueError):
                    candidate.validate_item(item)

        def test_quantity_boundaries(self):
            for qty in [1, 1000]:
                self.assertEqual(candidate.validate_item(dict(sku='A', quantity=qty, unit_cents=0))['quantity'], qty)

        def test_quantity_rejects_bool_float_text_and_outside_range(self):
            for qty in [True, False, 1.0, '1', 0, -1, 1001, None]:
                with self.subTest(qty=qty), self.assertRaises(ValueError):
                    candidate.validate_item(dict(sku='A', quantity=qty, unit_cents=1))

        def test_price_bounds_and_exact_type(self):
            for price in [0, 1000000]:
                self.assertEqual(candidate.validate_item(dict(sku='A', quantity=1, unit_cents=price))['unit_cents'], price)
            for price in [-1, 1000001, True, 1.5, '10']:
                with self.subTest(price=price), self.assertRaises(ValueError):
                    candidate.validate_item(dict(sku='A', quantity=1, unit_cents=price))

        def test_sku_rules(self):
            for sku in ['', 'lowercase', 'A B', 'A' * 21, 123, 'Å']:
                with self.subTest(sku=sku), self.assertRaises(ValueError):
                    candidate.validate_item(dict(sku=sku, quantity=1, unit_cents=1))

        def test_worked_total(self):
            self.assertEqual(candidate.quote_total(copy.deepcopy(SAMPLE)), EXPECTED)

        def test_empty_total(self):
            self.assertEqual(candidate.quote_total([]), {'line_count': 0, 'unit_count': 0, 'subtotal_cents': 0, 'by_sku': []})

        def test_repeated_sku_is_aggregated_not_discarded(self):
            r = candidate.quote_total([{'sku': 'A', 'quantity': 2, 'unit_cents': 100}, {'sku': 'A', 'quantity': 1, 'unit_cents': 50}])
            self.assertEqual(r['by_sku'], [{'sku': 'A', 'quantity': 3, 'subtotal_cents': 250}])

        def test_input_not_mutated(self):
            items = copy.deepcopy(SAMPLE)
            before = copy.deepcopy(items)
            candidate.quote_total(items)
            self.assertEqual(items, before)

        def test_row_order_does_not_change_summary(self):
            self.assertEqual(candidate.quote_total(SAMPLE), candidate.quote_total(list(reversed(SAMPLE))))

        def test_bad_late_row_rejects_whole_quote(self):
            with self.assertRaises(ValueError):
                candidate.quote_total(SAMPLE + [{'sku': 'BAD', 'quantity': 0, 'unit_cents': 20}])

        def test_maximum_row_count(self):
            item = {'sku': 'A', 'quantity': 1, 'unit_cents': 1}
            self.assertEqual(candidate.quote_total([item] * 100)['subtotal_cents'], 100)
            with self.assertRaises(ValueError):
                candidate.quote_total([item] * 101)

        def test_list_required(self):
            with self.assertRaises(ValueError):
                candidate.quote_total({'sku': 'A'})

        def test_formatting(self):
            for value, expected in [(0, '0.00'), (5, '0.05'), (100, '1.00'), (4997, '49.97'), (100000000000, '1000000000.00')]:
                self.assertEqual(candidate.format_cents(value), expected)

        def test_format_rejects_wrong_types_bounds(self):
            for value in [-1, True, 1.5, '100', 100000000001]:
                with self.subTest(value=value), self.assertRaises(ValueError):
                    candidate.format_cents(value)

        def test_json_roundtrip(self):
            self.assertEqual(candidate.parse_quote_json(json.dumps(SAMPLE)), SAMPLE)

        def test_duplicate_json_key_rejected(self):
            with self.assertRaises(ValueError):
                candidate.parse_quote_json('[{"sku":"A","quantity":1,"quantity":2,"unit_cents":5}]')

        def test_json_syntax_root_and_nonstandard_numbers(self):
            for text in ['[', '{}', 'null', '[{"sku":"A","quantity":1,"unit_cents":NaN}]']:
                with self.subTest(text=text), self.assertRaises(ValueError):
                    candidate.parse_quote_json(text)

        def test_json_size_and_type(self):
            for text in [' ' * 8193, None, b'[]']:
                with self.subTest(text=str(text)[:30]), self.assertRaises(ValueError):
                    candidate.parse_quote_json(text)

        def test_general_total_property_on_bounded_cases(self):
            for qty in range(1, 6):
                for price in [0, 1, 99, 100, 1000000]:
                    r = candidate.quote_total([dict(sku='P', quantity=qty, unit_cents=price)])
                    self.assertEqual(r['subtotal_cents'], qty * price)
                    self.assertEqual(r['unit_count'], qty)
    return unittest.defaultTestLoader.loadTestsFromTestCase(QuoteContract)
