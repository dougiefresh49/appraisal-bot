I am working on inputting comparable sales data for a residential appraisal report.  
The subject address is ${subjectAddress}

Given the following list of residential mls reports and cad records, extract the following fields:

## Fields to extract:

Property Address
Proximity to Subject
Sale Price
Sale Price/Gross Liv. Area
Data Source
Verification Source(s)
Sales or Financing
Concessions
Date of Sale/Time
Location
Leasehold/Fee Simple
Site
View
Design (Style).
Quality of Construction
Actual Age
Condition
Above Grade Room Count
Gross Living Area
Basement
Finished Rooms Below Grade
Functional Utility
Heating/Cooling
Energy Efficient Items
Garage/Carport
Porch/Patio Deck

## Notes about fields:

### Proximity to Subject:

- always use 2 decimal places with a direction
- ex: 1.20 miles SE

### Sale Price/Gross Liv. Area:

- divide sale price by gross living area and put in dollar amount

### Data Source:

- use the format: MLS# <insert mls number>;DOM <insert dom number>

### Verification sources:

- use the format: "CAD, MLS, OLP" <original list price in numerical dollar amount with $ and commas>
- quotes ensure that the whole string is treated as one value

### View:

- output N;Res;

### Gross Living Area:

- pull from field called "Actual Sold SqFt"

### Design (Style):

- DT<# of stories>;<Style>
- style is typically Ranch

### Above Grade Room Count:

- use format: total <# of rooms>;bdrms <# of bedrooms>;baths <# of bathrooms>
- to calculate total number of rooms, add bedrooms, living space, kitchen, dining room if not provided

### Functional Utility:

- output Typical

### Heating/Cooling:

- use format: FWA/CAC for forced warm air and central air conditioning, FWA for forced warm air, CAC for central air conditioning

### Energy effecient items:

- fans/ins/windows etc

### Garage/Carport:

- 2ga2dw (format is # of garage, a for attached, # of drwiveways, if number of garages is 2 then the number of driveways is 2)

### Quality of Construction:

- C1 only if it is a new construction, C2 if it is an existing structure built in the last 2 years, C3 otherwise

### Porch/Patio/Deck:

- use abbreviations: CvPr, CvPt, CvDd and output in one string with no spaces, EX: CvPrCvPt

### Sales or Financing:

- pick abbreviations from following documentation

| Abbreviated Entry | Sale Type            |
| ----------------- | -------------------- |
| REO               | REO sale             |
| Short             | Short sale           |
| CrOrd             | Court ordered sale   |
| Estate            | Estate sale          |
| Relo              | Relocation sale      |
| Non Arm           | Non-arms length sale |
| ArmLth            | Arms length sale     |
| Listing           | Listing              |

### Concessions:

- calculate total from the sum of the fields "Seller Concession from Paragraph 12" and "Additional Concession"
- do not include dollar signs or commas
- pick the financing type from the abbreviations below from the documentation

| Abbreviated Entry     | Financing Type                                                 |
| --------------------- | -------------------------------------------------------------- |
| FHA                   | FHA                                                            |
| VA                    | VA                                                             |
| Conv                  | Conventional                                                   |
| Seller                | Seller                                                         |
| Cash                  | Cash                                                           |
| RH                    | USDA - Rural housing                                           |
| See Instruction Below | Other - Appraiser to enter a description of the financing type |

- Other: If the financing type is not on this list, the appraiser must enter a description of the financing type. The text must fit in the allowable space.

- Concession is only required if it is a settled sale. If it is not a settled sale, leave this field blank.
- final output is `<finance type abbreviation>;<total concession>`, if no concession, then just `<finance type abbreviation>;0`

### Date of Sale/Time:

- For each comparable property, the appraiser must first identify the status type from the list of options
  below.

| Status Type  |
| ------------ |
| Active       |
| Contract     |
| Expired      |
| Withdrawn    |
| Settled sale |

| Abbreviated Entry | Date Status Type |
| ----------------- | ---------------- |
| c                 | Contract Date    |
| s                 | Settlement Date  |
| w                 | Withdrawn Date   |
| e                 | Expiration Date  |

- If the comparable property is a settled sale and the contract date is known, the appraiser must first indicate the date status type 's' followed by the settlement date (mm/yy), and then the date status type 'c' followed by the contract date (mm/yy). For settled sales for which the contract date is unavailable to the appraiser in the normal course of business, the appraiser must enter the abbreviation 'Unk', for unknown, in place of the contract date.

- final output is `<date status type abbreviation><date>;` for each known date, no trailing semicolon at the end

### Site:

- convert to square feet
- Area less than one acre - whole numbers only
- Area equal to one acre or more - numeric to 2 decimals
- Indicate the unit of measure as either 'sf for square feet or 'ac' for acres as appropriate.
- Examples: 6400 sf, 3.40 ac

### Quality of Construction:

(from documentation)

- The appraiser must select one quality rating from the list below for the subject property and each
  comparable property. The appraiser must indicate the quality rating that best describes the overall quality
  of the property. Multiple choices are not permitted.
  • Q1|
  • Q2
  • Q3
  • Q4
  • Q5
  • Q6

  Q1 - Dwellings with this quality rating are usually unique structures that are individually designed by an
  architect for a specified user. Such residences typically are constructed from detailed architectural plans
  and specifications and feature an exceptionally high level of workmanship and exceptionally high-grade
  materials throughout the interior and exterior of the structure. The design features exceptionally high-quality
  exterior refinements and ornamentation, and exceptionally high-quality interior refinements. The
  workmanship, materials, and finishes throughout the dwelling are of exceptionally high quality.

  Q2 - Dwellings with this quality rating are often custom designed for construction on an individual property
  owner's site. However, dwellings in this quality grade are also found in high-quality tract developments
  featuring residences constructed from individual plans or from highly modified or upgraded plans. The
  design features detailed, high-quality exterior ornamentation, high-quality interior refinements, and detail.
  The workmanship, materials, and finishes throughout the dwelling are generally of high or very high quality.

  Q3 - Dwellings with this quality rating are residences of higher quality built from individual or readily
  available designer plans in above-standard residential tract developments or on an individual property
  owner's site. The design includes significant exterior ornamentation and interiors that are well finished. The
  workmanship exceeds acceptable standards and many materials and finishes throughout the dwelling have
  been upgraded from "stock" standards.

  Q4 - Dwellings with this quality rating meet or exceed the requirements of applicable building codes.
  Standard or modified standard building plans are utilized and the design includes adequate fenestration ano
  some exterior ornamentation and interior refinements. Materials, workmanship, finish, and equipment are o
  stock or builder grade and may feature some upgrades.

  Q5 - Dwellings with this quality rating feature economy of construction and basic functionality as main
  considerations. Such dwellings feature a plain design using readily available or basic floor plans featuring
  minimal fenestration and basic finishes with minimal exterior ornamentation and limited interior detail.
  These dwellings meet minimum building codes and are constructed with inexpensive, stock materials with
  limited refinements and upgrades.

  Q6 - Dwellings with this quality rating are of basic quality and lower cost; some may not be suitable for
  year-round occupancy. Such dwellings are often built with simple plans or without plans, often utilizing the
  lowest quality building materials. Such dwellings are often built or expanded by persons who are
  professionally unskilled or possess only minimal construction skills. Electrical, plumbing, and other
  mechanical systems and equipment may be minimal or non-existent. Older dwellings may feature one or
  more substandard or non-conforming additions to the original structure.

## Ouput format:

csv inline

## CSV Data to extract from:

```
${csvData}
```
