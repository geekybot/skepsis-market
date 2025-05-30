const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
});

async function convertMarkdownToPdf() {
  try {
    // Read the markdown file
    const markdownPath = path.join(__dirname, 'whitepaper.md');
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    
    // Convert markdown to HTML
    const html = md.render(markdown);
    
    // Add styling and wrap the HTML content
    const styledHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Skepsis Whitepaper</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 21cm;
            margin: 0 auto;
            padding: 2cm 1.5cm;
            background-color: white;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
          }
          h1 { font-size: 2.5em; color: #1a1a1a; }
          h2 { font-size: 2em; color: #0c4da2; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          h3 { font-size: 1.5em; color: #0c4da2; }
          h4 { font-size: 1.25em; }
          p, ul, ol { margin-bottom: 1em; }
          a { color: #0c4da2; text-decoration: none; }
          a:hover { text-decoration: underline; }
          img { max-width: 100%; height: auto; }
          .centered { text-align: center; }
          .title-page { 
            height: 25cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-after: always;
          }
          .title-page h1 {
            font-size: 3em;
            margin-bottom: 0.2em;
          }
          .title-page .subtitle {
            font-size: 1.5em;
            font-weight: 300;
            margin-bottom: 3em;
          }
          .title-page .version {
            font-size: 1em;
            margin-bottom: 0.5em;
          }
          .title-page .date {
            font-size: 1em;
          }
          .logo { max-width: 200px; margin-bottom: 2em; }
          .footer-logo { max-width: 100px; }
          .abstract {
            background-color: #f8f9fa;
            border-left: 4px solid #0c4da2;
            padding: 1em;
            margin: 2em 0;
          }
          .callout {
            background-color: #f0f7ff;
            border: 1px solid #d0e3ff;
            border-radius: 4px;
            padding: 1em;
            margin: 1.5em 0;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          th {
            background-color: #f2f2f2;
            font-weight: 600;
            text-align: left;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            background-color: #f5f5f5;
            border-radius: 3px;
            padding: 0.2em 0.4em;
          }
          pre code {
            display: block;
            overflow: auto;
            padding: 1em;
            background-color: #f5f5f5;
            border-radius: 3px;
          }
          .formula {
            background-color: #f9f9f9;
            padding: 1em;
            margin: 1em 0;
            border-radius: 4px;
            font-family: 'Georgia', serif;
            text-align: center;
          }
          .contact-section {
            margin-top: 4em;
            padding-top: 2em;
            border-top: 1px solid #ddd;
          }
          .page-break {
            page-break-after: always;
          }
          /* Ensure good rendering for PDF */
          @page {
            margin: 0;
            size: A4;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    // Write the HTML to a temporary file
    const tempHtmlPath = path.join(__dirname, 'temp-whitepaper.html');
    fs.writeFileSync(tempHtmlPath, styledHtml);
    
    console.log('Launching browser for PDF conversion...');
    
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Load the HTML file
    await page.goto(`file://${tempHtmlPath}`, {
      waitUntil: 'networkidle2',
    });
    
    console.log('Generating PDF...');
    
    // Generate PDF
    await page.pdf({
      path: path.join(__dirname, 'public', 'whitepaper.pdf'),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm'
      },
      displayHeaderFooter: true,
      headerTemplate: ' ',
      footerTemplate: `
        <div style="width: 100%; font-size: 8px; text-align: center; color: #777;">
          <span>Skepsis Whitepaper - Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      preferCSSPageSize: false
    });
    
    // Close the browser
    await browser.close();
    
    // Clean up the temporary HTML file
    fs.unlinkSync(tempHtmlPath);
    
    console.log('PDF created successfully at /public/whitepaper.pdf');
    
  } catch (error) {
    console.error('Error converting to PDF:', error);
  }
}

convertMarkdownToPdf();
