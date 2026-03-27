"""
10-year federal revenue scores for repealing US tax deductions.

Scenarios (2x2x2 = 8):
  - Repeal itemized deductions only vs repeal itemized + standard
  - No UBI vs budget-neutral UBI recycling (non-taxable, per-person)
  - Static vs dynamic (CBO behavioral elasticities)

CBO elasticities:
  - Labor supply substitution: 0.22-0.31 by income decile, 0.27 secondary
  - Labor supply income: -0.05
  - Capital gains realization: -0.79

Usage:
  python score.py                    # All years 2026-2035
  python score.py --years 2026 2027  # Specific years
  python score.py --no-ubi           # Skip UBI scenarios (4x faster)
"""

import argparse
import json
import gc

from policyengine_us import Microsimulation
from policyengine_core.reforms import Reform

DATE_RANGE = "2026-01-01.2100-12-31"

# Reform components

ITEMIZED_REPEAL = {
    f"gov.irs.deductions.itemized.salt_and_real_estate.cap.{fs}": {DATE_RANGE: 0}
    for fs in ["JOINT", "SINGLE", "HEAD_OF_HOUSEHOLD", "SEPARATE", "SURVIVING_SPOUSE"]
} | {
    f"gov.irs.deductions.itemized.interest.mortgage.cap.{fs}": {DATE_RANGE: 0}
    for fs in ["JOINT", "SINGLE", "HEAD_OF_HOUSEHOLD", "SEPARATE", "SURVIVING_SPOUSE"]
} | {
    "gov.irs.deductions.itemized.charity.ceiling.all": {DATE_RANGE: 0},
    "gov.irs.deductions.itemized.medical.floor": {DATE_RANGE: 1.0},
}

STANDARD_REPEAL = {
    f"gov.irs.deductions.standard.amount.{fs}": {DATE_RANGE: 0}
    for fs in ["JOINT", "SINGLE", "HEAD_OF_HOUSEHOLD", "SEPARATE", "SURVIVING_SPOUSE"]
} | {
    f"gov.irs.deductions.standard.aged_or_blind.amount.{fs}": {DATE_RANGE: 0}
    for fs in ["JOINT", "SINGLE", "HEAD_OF_HOUSEHOLD", "SEPARATE", "SURVIVING_SPOUSE"]
}

CBO_PRIMARY_SUB = {
    1: 0.31, 2: 0.28, 3: 0.27, 4: 0.27, 5: 0.25,
    6: 0.25, 7: 0.22, 8: 0.22, 9: 0.22, 10: 0.22,
}

BEHAVIORAL = {
    f"gov.simulation.labor_supply_responses.elasticities.substitution.by_position_and_decile.primary.{d}": {
        DATE_RANGE: e
    }
    for d, e in CBO_PRIMARY_SUB.items()
} | {
    "gov.simulation.labor_supply_responses.elasticities.substitution.by_position_and_decile.secondary": {
        DATE_RANGE: 0.27
    },
    "gov.simulation.labor_supply_responses.elasticities.income": {DATE_RANGE: -0.05},
    "gov.simulation.capital_gains_responses.elasticity": {DATE_RANGE: -0.79},
}

BASE_REFORMS = {
    "item_static": ITEMIZED_REPEAL,
    "item_dynamic": {**ITEMIZED_REPEAL, **BEHAVIORAL},
    "both_static": {**ITEMIZED_REPEAL, **STANDARD_REPEAL},
    "both_dynamic": {**ITEMIZED_REPEAL, **STANDARD_REPEAL, **BEHAVIORAL},
}


def run_sim(params, year):
    """Run a single microsimulation, return (fed_tax_sum, hni_sum)."""
    reform = Reform.from_dict(params, "policyengine_us")
    sim = Microsimulation(reform=reform)
    r_tax = float(sim.calc("income_tax", period=year).sum())
    r_hni = float(sim.calc("household_net_income", period=year).sum())
    del sim
    gc.collect()
    return r_tax, r_hni


def bisect_ubi(base_params, b_tax, population, year, ubi_hi, max_iter=4):
    """Find budget-neutral UBI via bisection. Returns (ubi_amount, fed_rev, r_hni)."""
    ubi_lo = 0
    ubi_amount = round(((ubi_lo + ubi_hi) / 2) / 100) * 100
    r_hni = None

    for i in range(max_iter):
        params = dict(base_params)
        params["gov.contrib.ubi_center.basic_income.amount.person.flat"] = {
            DATE_RANGE: float(ubi_amount)
        }
        r_tax, r_hni = run_sim(params, year)
        fed = (r_tax - b_tax) / 1e9
        ubi_cost = ubi_amount * population / 1e9
        net_cost = ubi_cost - fed

        print(
            f"    iter{i}: UBI=${ubi_amount:,.0f}, fed=${fed:+.1f}B, "
            f"cost=${ubi_cost:.1f}B, net=${net_cost:+.1f}B",
            flush=True,
        )

        if abs(net_cost) < 5:
            break
        if net_cost > 0:
            ubi_hi = ubi_amount
        else:
            ubi_lo = ubi_amount
        new_ubi = round(((ubi_lo + ubi_hi) / 2) / 100) * 100
        if new_ubi == ubi_amount:
            new_ubi += 100 if net_cost < 0 else -100
        ubi_amount = max(0, new_ubi)

    fed = (r_tax - b_tax) / 1e9
    return ubi_amount, fed, r_hni


def run_year(year, include_ubi=True):
    """Run all scenarios for a single year. Returns dict of results."""
    print(f"\n=== YEAR {year} ===", flush=True)

    baseline = Microsimulation()
    b_tax = float(baseline.calc("income_tax", period=year).sum())
    b_hni = float(baseline.calc("household_net_income", period=year).sum())
    population = float(baseline.calc("household_count_people", period=year).sum())
    del baseline
    gc.collect()

    results = {}

    for key, params in BASE_REFORMS.items():
        r_tax, r_hni = run_sim(params, year)
        fed = (r_tax - b_tax) / 1e9
        total = -(r_hni - b_hni) / 1e9
        results[key] = {"federal": fed, "total": total}
        print(f"  {key}: fed=${fed:+.1f}B total=${total:+.1f}B", flush=True)

        # Static UBI: exact (non-taxable, no feedback)
        if include_ubi and "static" in key:
            ubi_key = key + "_ubi"
            ubi_amount = round(fed * 1e9 / population / 100) * 100
            ubi_params = dict(params)
            ubi_params["gov.contrib.ubi_center.basic_income.amount.person.flat"] = {
                DATE_RANGE: float(ubi_amount)
            }
            r_tax_u, r_hni_u = run_sim(ubi_params, year)
            fed_u = (r_tax_u - b_tax) / 1e9
            total_u = -(r_hni_u - b_hni) / 1e9
            results[ubi_key] = {
                "federal": fed_u,
                "total": total_u,
                "ubi_per_person": ubi_amount,
            }
            print(
                f"  {ubi_key}: UBI=${ubi_amount}/person, fed=${fed_u:+.1f}B, "
                f"total=${total_u:+.1f}B",
                flush=True,
            )

    # Dynamic UBI: bisect
    if include_ubi:
        for base_key, ubi_hi in [("item_dynamic", 600), ("both_dynamic", 3000)]:
            ubi_key = base_key + "_ubi"
            ubi_amount, fed, r_hni = bisect_ubi(
                BASE_REFORMS[base_key], b_tax, population, year, ubi_hi
            )
            total = -(r_hni - b_hni) / 1e9
            results[ubi_key] = {
                "federal": fed,
                "total": total,
                "ubi_per_person": ubi_amount,
            }
            print(
                f"  {ubi_key}: UBI=${ubi_amount}/person, fed=${fed:+.1f}B, "
                f"total=${total:+.1f}B",
                flush=True,
            )

    return results


def main():
    parser = argparse.ArgumentParser(description="Score deduction repeal reforms")
    parser.add_argument(
        "--years",
        nargs="+",
        type=int,
        default=list(range(2026, 2036)),
        help="Years to simulate (default: 2026-2035)",
    )
    parser.add_argument(
        "--no-ubi",
        action="store_true",
        help="Skip UBI recycling scenarios",
    )
    parser.add_argument(
        "--output",
        default="results.json",
        help="Output JSON file (default: results.json)",
    )
    args = parser.parse_args()

    all_results = {}
    for year in args.years:
        all_results[str(year)] = run_year(year, include_ubi=not args.no_ubi)

    # Compute 10-year totals
    scenarios = set()
    for yr_data in all_results.values():
        scenarios.update(yr_data.keys())

    totals = {}
    for sc in sorted(scenarios):
        fed_sum = sum(
            all_results[yr][sc]["federal"]
            for yr in all_results
            if sc in all_results[yr]
        )
        totals[sc] = {"federal": round(fed_sum, 1)}

    output = {"annual": all_results, "ten_year_totals": totals}

    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)

    # Print summary
    print("\n" + "=" * 80)
    print(f"  10-YEAR FEDERAL REVENUE SCORES ({args.years[0]}-{args.years[-1]})")
    print("=" * 80)
    for sc in sorted(totals.keys()):
        print(f"  {sc:30s}  ${totals[sc]['federal']:+,.0f}B")


if __name__ == "__main__":
    main()
