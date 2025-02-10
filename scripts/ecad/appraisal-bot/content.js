console.log('Deed Link Enhancer: Content script loaded!');

// Function to find and modify the Last Sale Instrument field
function updateDeedLink() {
  const rows = document.querySelectorAll('table.grid tbody tr');

  rows.forEach((row) => {
    const header = row.querySelector('th');
    const valueCell = row.querySelector('td');

    if (
      header &&
      valueCell &&
      header.textContent.trim() === 'Last Sale Instrument'
    ) {
      const instrument = valueCell.textContent.trim();

      // Check if it's already a link to prevent duplicate modifications
      if (valueCell.querySelector('a')) {
        console.log('Deed Link already exists, skipping...');
        return;
      }

      console.log(`Instrument found: ${instrument}`);

      // Generate the search page URL with the document number as a query param
      const searchUrl = `https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1?doc=${instrument}`;

      // Replace text with a clickable link to the search page
      valueCell.innerHTML = `<a href="${searchUrl}" target="_blank">${instrument}</a>`;
      console.log('Deed link updated successfully!');
    }
  });
}

// Observe the page for changes and apply the function when needed
const observer = new MutationObserver(() => {
  console.log('DOM changed, checking for Last Sale Instrument field...');
  updateDeedLink();
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial run in case the element is already there
updateDeedLink();
