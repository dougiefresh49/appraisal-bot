# Commercial Apraisal Process Flow

## Subject

- get all subject property information
- download CAD records PDF
- find deed records on county website
- finalize building sketch in Total a la Mode
- create location map
- z00m into property on Google Maps
- take screenshot
- drop into Figma template
- export png and add to Google Drive
- create neighborhood map
- determine neighborhood bounding streets (somewhat arbitrary for commercial properties)
- zoom into neighborhood bounds on Google Maps
- take screenshot
- drop into Figma template
- export png and add to Google Drive
- export flood map from either FEMA site or Total a la Mode

## Subject Photos

- When we measure the building and inspect the property, I take a bunch of pictures of the property.
- This can range from 40 to 80 pictures (most of the time 50 is max)
- After selecting the ones i want to use, i upload those to google drive
- I then create an inputs. json file that maps the photo file name to the label i want to provide in the Report doc
- Once I finish creating each of the labels, I import them into the Report Google Doc and use a
  custom Apps Script tool i made that allows me to:
  - specify the inputs.json Google Drive file id
  - specify the photos folder Google Drive id
  - finds the H2 heading called "Subject Photos"
  - inserts the images into the Report doc in a 3x2 table with the photos and labels based off the inputs.json

## Comps Research

- find comparable land sales, improved property sales, and rentals
- download MLS PDFs, CAD records PDFs, and save notes for sale / rental info not in MLS that was verified on the phone
- save all to Google Drive folder

## Data Import into Google Sheets

- once the subject and comps have been determined the data import begins
- I start by hand feeding each comp to a custom Gemini Gem via gemini.google.com the relevant documents for a given comp plus any additional information gathered outside of the CAD / MLS documents. For example
  - CAD or MLS document corrections
  - information from Realtor or broker obtained that differs from the public records
  - any additional information i gleaned from measuring overhead on Google Maps
  - The Gemini Gem adds each comp to a JSON dataset with my defined schema
  - I take the output of the JSON dataset and then feed that to a custom Google Sheets Apps Script
    tool i created that will read that JSON dataset and place the data into the defined sheet tabs / cells appropriately.

## Google Doc Report Updates

- The final deliverable we deliver to the client is an exported Google Doc, which is a culmination of hand written analysis and linked tables / paragraphs from Google Sheets (using the linking functionality provided by default when copying and pasting a range of cells from Google Sheets to Google Drive)
- In the Report document, there are several places that I also use custom Gemini Gems to generate standard paragraphs based on the data in the report doc. That process is manual and looks like
  - Copy relevant data for the prompt
  - paste into Gemini Gem web Ul
  - copy result from Gemini and paste into Google Doc
  - clean up formatting as needed
  - repeat process for all 5 different sections
