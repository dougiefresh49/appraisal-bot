# 🏡 Deed & MLS Link Enhancer

A simple Chrome extension that enhances property records by linking MLS Tax IDs to the CAD site and deed records to the search page for quick access.

## ✨ Features

- MLS Site (Navica MLS)
- Turns the Tax ID into a clickable link to Ector CAD.
- Example: 35100.01100.00000 → View on CAD
- Ector CAD Site
- Turns the “Last Sale Instrument” into a clickable link to the deed record search.
- Example: 2019-17663 → Search Deed
- Automatically fills in the search field and triggers the search.

## 📥 Installation Guide

Since this is a local extension, follow these steps to install it in Chrome: 1. Download the extension files (or get them from a shared folder). 2. Open Chrome and go to:
👉 chrome://extensions/ 3. Enable Developer Mode (toggle in the top right). 4. Click Load unpacked and select the folder containing the extension files. 5. The extension should now appear in Chrome. ✅

## 🔄 How It Works

1️⃣ MLS Tax ID Linking
• Go to Navica MLS:
👉 https://next.navicamls.net/377/Expanded/Single
• The Tax ID field will automatically turn into a clickable link to Ector CAD.

2️⃣ CAD Deed Linking
• Go to an Ector CAD parcel page:
👉 https://search.ectorcad.org/parcel/35100.01100.00000
• The “Last Sale Instrument” will become a clickable link to deed records.

3️⃣ Deed Record Auto-Fill
• Clicking the deed link opens the search page and auto-fills the document number.
• The search will run automatically. 🎯

## 🛠 Troubleshooting

- If links aren’t appearing, try reloading the page.
- If the extension isn’t working, go to chrome://extensions/ and click Reload (⟳).
- If needed, check the Console (F12 → Console) for logs.

## 📞 Need Help?

Ask doug for help! 🚀 Happy linking!

## Future Features

### On ECAD,

- add ability to show a link to other parcels with the same Instrument Number.

  - Example: https://search.ectorcad.org/parcel/01050.00010.00000 has other parcels with Instrument Number 2023-00017387
  - The advanced search has a filter for Instrument Number with url like: `https://search.ectorcad.org/search/adv?query[sale][instr_num]=2023-00017387&type=r`
  - Maybe can use stagehand to run the advanced search and get the results and display them below the last sale instrument.

- add logic either show the code values (Ex: Building Type S30M) or fix the link
  - currently the building type link is broken
    - https://search.ectorcad.org/lu/r/bld/S30M
    - it opens but you have to search for it
    - it should scroll down to it
    - might need to use logic to add the value in the table to the link as a query param because its not always at the end of the url

### On MLS Tax Suite

- add links to ecad deed site in the table

  - Example: https://pbbr.crsdata.com/mls/Property/~gtpb3DQ3mnhhe5Nfv2TL4UAauJgAK1R8xUIRzcwDLSVeFesfZ4VIz0Ol85M5gHz5Igih0a4NSdlV5Cnre~sVA2#EXPMAP
  - APN: 05730.00790.00000
