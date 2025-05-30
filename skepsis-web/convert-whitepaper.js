const markdownpdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');

// Configure markdown-pdf options
const options = {
  // cssPath can be used if you have a custom CSS file for styling the PDF
  // cssPath: path.join(__dirname, 'pdf-style.css'),
  
  // Customize PDF options
  remarkable: {
    html: true, // Enable HTML in the markdown
    breaks: true, // Convert '\n' in paragraphs into <br>
    typographer: true, // Enable smartypants and other transformations
  },
  
  // PDF document properties
  paperBorder: '1cm', // Add a border to all pages
  paperFormat: 'A4', // Set paper format
};

console.log('Converting whitepaper.md to PDF...');

// Input and output file paths
const inputFile = path.join(__dirname, 'whitepaper.md');
const outputFile = path.join(__dirname, 'public', 'whitepaper.pdf');

// Convert markdown to PDF
markdownpdf(options)
  .from(inputFile)
  .to(outputFile, () => {
    console.log(`PDF successfully created at: ${outputFile}`);
  });
