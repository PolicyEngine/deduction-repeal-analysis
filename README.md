# Deduction repeal analysis

10-year federal revenue scores for repealing US tax deductions, with and without behavioral responses and budget-neutral UBI recycling.

## Scenarios (2x2x2 = 8)

| Dimension | Options |
|-----------|---------|
| Reform | Repeal itemized deductions only / Repeal itemized + standard |
| Revenue recycling | None / Budget-neutral non-taxable UBI |
| Behavioral | Static / Dynamic (CBO elasticities) |

## Results (2026-2035)

| Reform | UBI | Behavioral | 10yr fed rev |
|--------|-----|-----------|-------------|
| Itemized only | No | Static | $912B |
| Itemized only | No | Dynamic | $843B |
| Itemized only | Yes | Static | $912B |
| Itemized only | Yes | Dynamic | ~$830B |
| Itemized + standard | No | Static | $6,501B |
| Itemized + standard | No | Dynamic | $6,296B |
| Itemized + standard | Yes | Static | $6,501B |
| Itemized + standard | Yes | Dynamic | ~$6,279B |

## CBO behavioral elasticities

- Labor supply substitution: 0.22 (top decile) to 0.31 (bottom decile), 0.27 secondary earners
- Labor supply income: -0.05
- Capital gains realization: -0.79

## Running

```bash
# Full 10-year run (takes ~12 hours with UBI scenarios)
python score.py

# Without UBI scenarios (~3 hours)
python score.py --no-ubi

# Single year
python score.py --years 2026
```

## Key findings

- Repealing itemized deductions raises ~$0.9T/decade. Only ~11% of filers itemize under OBBBA.
- Repealing all deductions raises ~$6.5T/decade. Revenue jumps sharply in 2030 when OBBBA's inflated standard deduction expires ($32K to $16K for joint filers).
- CBO behavioral responses reduce revenue by 8-12%.
- Budget-neutral UBI from repealing all deductions: $1,300/person/year pre-2030, rising to $2,200+/year after OBBBA expiration.
