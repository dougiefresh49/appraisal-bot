console.log('MCAD Deed Injector: Style Injector script loaded!');

// Inject CSS styles
const styleElement = document.createElement('style');
styleElement.textContent = `
.a11y-table td, .a11y-table th {
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}
`;
document.head.appendChild(styleElement);
