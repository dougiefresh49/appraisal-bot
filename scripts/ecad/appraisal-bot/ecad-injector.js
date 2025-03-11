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
      if (
        valueCell.querySelector('.deed-link') ||
        valueCell.querySelector('.search-icon')
      ) {
        console.log('Deed Link or Search Icon already exists, skipping...');
        return;
      }

      console.log(`📌 Instrument found: ${instrument}`);

      // Generate URLs
      const deedSearchUrl = `https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1?doc=${instrument}`;
      const advancedSearchUrl = `https://search.ectorcad.org/search/adv?query[sale][instr_num]=${instrument}&type=r`;

      // Create deed search link
      const deedLink = document.createElement('a');
      deedLink.href = deedSearchUrl;
      deedLink.target = '_blank';
      deedLink.className = 'deed-link';
      deedLink.style =
        'color: #0044cc; font-weight: bold; text-decoration: underline; margin-right: 8px;';
      deedLink.textContent = instrument;

      // Create advanced search icon link
      const searchIconLink = document.createElement('a');
      searchIconLink.href = advancedSearchUrl;
      searchIconLink.target = '_blank';
      searchIconLink.className = 'search-icon';
      searchIconLink.style =
        'margin-left: 5px; color: #0044cc; font-size: 14px;';
      searchIconLink.innerHTML = '🔍'; // Search icon

      // Replace text with both the clickable deed link and search icon
      valueCell.innerHTML = '';
      valueCell.appendChild(deedLink);
      valueCell.appendChild(searchIconLink);

      console.log('✅ Deed link and advanced search icon added successfully!');
    }
  });
}

// Observe the page for changes and apply the function when needed
const observer = new MutationObserver(() => {
  console.log('🔄 DOM changed, checking for Last Sale Instrument field...');
  updateDeedLink();
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial run in case the element is already there
updateDeedLink();
