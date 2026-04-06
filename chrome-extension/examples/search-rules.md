## Apx Sqft

- min: Math.round(subjectGla \* .85)
- max: Math.round(subjectGla \* 1.15)

## Apx Total Acres

- min: Math.round(subjectSiteSize \* .85)
- max: Math.round(subjectSiteSize \* 2)

## Year Built

- min: currentYear - subjectAge - 10
- max: currentYear - subjectAge + 10 (or currentYear if subjectAge + 10 > currentYear)
