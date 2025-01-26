## ECAD Extractor info

here is an example of the extracted data from the pdf.

```
Property Address:
4100 Golder Ave, Odessa, TX 79764

Owner Name:
Dean & Terrie Wilson

Tax ID:
21880.00030.00000

CAD Website:
https://search.ectorcad.org/parcel/21880.00030.00000

Legal:
Lot 1 Block 8 Subunits 8-16

Sold Price:
$1,450,000

Days on Market:
42

Sold Date:
09/03/2024

Land Size:
5.72 acres

Units:
51

Price Per Unit:
$1,450,000 / 51 = $24,750

```

Notes about the collection:

Units:
The units are found in the Public Remarks section. The Public Remarks section is free response so you will have to scan it and find the units.

## HOWARD CAD Extractor info

here is an example of the extracted data from Howard County mls report pdfs

```
Property Address:
905 W 3rd St Big Spring, TX 79720

Owner Name:
N/A

Tax ID:
R000005525

CAD Website:
https://esearch.howardcad.org/Search/Result?keywords=StreetNumber:905%20StreetName:%22W%203rd%22%20Year:2023

Legal:
Acres: 0.516, LTS 2-4 & PART OF 5 BK 2 JONES VALLEY 173.5X130 ALAMO MOTEL 2009 COMBINE ACCTS B4020000600 &
601 521 ACQ 11172017 BLK/TRACT 2 0.516 ACR

Sold Price:
$300,000

Days on Market:


Sold Date:
03/23/2023

Land Size:
0.516 acres

Units:
10

Price Per Unit:
$300,000  / 10 = $30,000

```

Notes about the collection:

Howard CAD Website:
The Howard CAD website is a search engine for the county's property records. The url is in the form of `https://esearch.howardcad.org/Search/Result?keywords=StreetNumber:${streetNumber}%20StreetName:%22${streetName}%22%20Year:${year}`

The year is the year the property was sold.

## Midland County Extractor info

can you do the same thing for the following set of Midland County mls report pdfs?

the only is the CAD url, which has the following rules:

- if the CAD/Property ID is a number that is not all zeros, then the url is `https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=${CAD/PropertyID}`
- if the CAD/Property ID is all zeroso or missing, then the url is in the form of https://iswdataclient.azurewebsites.net/webSearchAddress.aspx?dbkey=MIDLANDCAD&stype=situs&sdata=County+Rd+01224%7c3426%7c .
- if geo id is available, then the url is in the form of https://iswdataclient.azurewebsites.net/webSearchAddress.aspx?dbkey=MIDLANDCAD&stype=geoid&sdata=${geoId}

## Ward County Extractor info

can you do the same thing for the following set of Ward County mls report pdfs?

the CAD url has the following format: `https://www.wardcad.org/Home/Details?parcelId=${Tax ID}`
