"""Analytic software checks only: these do not validate biological physiology."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('research-connectome-v0720.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class RoutingTests(unittest.TestCase):
    def setUp(self):
        self.rows = [(1, 2, 20), (1, 3, 10), (1, 10, 5), (2, 10, 40), (2, 11, 20), (3, 11, 30)]
        self.edges = audit.index_edges(self.rows)
        self.out = {1: 100, 2: 100, 3: 60}
        self.endpoints = {10: 'L', 11: 'R'}

    def run_case(self, **kw):
        args = dict(source=1, source_side='L', endpoints=self.endpoints, intermediates={2, 3},
                    edges=self.edges, outgoing=self.out, threshold=1, route='allIN')
        args.update(kw)
        return audit.evaluate(**args)

    def test_analytic_mass_and_full_denominator(self):
        r = self.run_case()
        self.assertAlmostEqual(r['mass'], .17)
        self.assertAlmostEqual(r['li'], (.09 - .08) / .17)
        self.assertAlmostEqual(r['target_mass'][11], .09)
        self.assertEqual(r['paths'], 3)
        self.assertEqual(sum(r['reached'].values()), 2)

    def test_endpoint_restriction_does_not_renormalize(self):
        r = self.run_case(endpoints={10: 'L'})
        self.assertAlmostEqual(r['mass'], .08)
        self.assertEqual(r['li'], -1)
        self.assertIsNone(r['available_reach_li'])

    def test_direct_uses_all_outgoing(self):
        r = self.run_case(route='direct')
        self.assertAlmostEqual(r['mass'], .05)
        self.assertEqual(r['li'], -1)
        self.assertEqual(r['paths'], 1)
        self.assertEqual(r['intermediates'], 0)
        self.assertIsNone(r['top_share'])

    def test_symmetric_zero(self):
        edges = audit.index_edges([(1, 2, 20), (2, 10, 10), (2, 11, 10)])
        r = self.run_case(edges=edges, outgoing={1: 20, 2: 40})
        self.assertEqual(r['li'], 0)
        self.assertEqual(r['available_reach_li'], 0)
        self.assertEqual(r['mass'], .5)

    def test_endpoint_flip_and_global_flip(self):
        r = self.run_case()
        reversed_ends = {10: 'R', 11: 'L'}
        self.assertAlmostEqual(self.run_case(endpoints=reversed_ends)['li'], -r['li'])
        self.assertAlmostEqual(self.run_case(endpoints=reversed_ends, source_side='R')['li'], r['li'])

    def test_unknown_only_is_not_zero_effect(self):
        r = self.run_case(endpoints={10: None, 11: None})
        self.assertIsNone(r['li'])
        self.assertIsNone(r['available_reach_li'])
        self.assertEqual(r['known_side_coverage'], 0)
        self.assertAlmostEqual(r['unknown_mass'], .17)

    def test_no_route_and_zero_outgoing(self):
        for r in [self.run_case(threshold=100), self.run_case(outgoing={1: 0, 2: 100, 3: 60})]:
            self.assertEqual(r['status'], 'no_eligible_route')
            self.assertIsNone(r['li'])
            self.assertIsNone(r['known_side_coverage'])

    def test_availability_correction(self):
        r = self.run_case(endpoints={10: 'L', 11: 'R', 12: 'R'})
        self.assertEqual(r['reach_li'], 0)
        self.assertAlmostEqual(r['available_reach_li'], -1 / 3)

    def test_row_order_independence(self):
        self.assertEqual(self.run_case(), self.run_case(edges=audit.index_edges(list(reversed(self.rows)))))

    def test_duplicate_and_invalid_edges_fail(self):
        with self.assertRaises(ValueError):
            audit.index_edges(self.rows + [self.rows[0]])
        with self.assertRaises(ValueError):
            audit.index_edges([(1, 2, 0)])

    def test_threshold_monotonicity_both_edges(self):
        results = [self.run_case(threshold=t) for t in audit.THRESHOLDS]
        masses = [r['mass'] for r in results]
        reached = [sum(r['reached'].values()) for r in results]
        self.assertEqual(masses, sorted(masses, reverse=True))
        self.assertEqual(reached, sorted(reached, reverse=True))
        self.assertAlmostEqual(self.run_case(threshold=20)['mass'], .12)
        self.assertEqual(self.run_case(threshold=50)['mass'], 0)

    def test_top_removal_and_deterministic_tie(self):
        r = self.run_case()
        self.assertEqual(r['top_intermediate'], 2)
        self.assertAlmostEqual(r['top_share'], .12 / .17)
        self.assertEqual(r['deleted_li'], 1)
        self.assertAlmostEqual(r['deleted_mass'], .05)
        edges = audit.index_edges([(1, 2, 10), (1, 3, 10), (2, 10, 5), (3, 11, 5)])
        self.assertEqual(self.run_case(edges=edges, outgoing={1: 20, 2: 10, 3: 10})['top_intermediate'], 2)

    def test_self_reuse_excluded(self):
        edges = audit.index_edges([(1, 1, 5), (1, 2, 10), (2, 1, 5), (2, 2, 5), (2, 10, 5)])
        r = self.run_case(edges=edges, outgoing={1: 15, 2: 15}, endpoints={1: 'L', 2: 'L', 10: 'L'}, intermediates={1, 2})
        self.assertEqual(r['paths'], 1)
        self.assertAlmostEqual(r['mass'], 2 / 9)

    def test_mass_bound(self):
        with self.assertRaises(AssertionError):
            self.run_case(outgoing={1: 1, 2: 1, 3: 1})


if __name__ == '__main__':
    unittest.main(verbosity=2)
