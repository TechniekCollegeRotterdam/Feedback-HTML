const { HtmlValidate } = require('html-validate');
const fs = require('fs');
const path = require('path');

const htmlvalidate = new HtmlValidate({
  rules: {
    'doctype-html5': 'error',
    'no-inline-style': 'error',
    'require-closing-tags': 'error',
    'void-style': 'error'
  }
});

// Vind alle HTML bestanden
const htmlFiles = fs.readdirSync('.')
  .filter(file => file.endsWith('.html'));

let allValid = true;
const feedback = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const report = htmlvalidate.validateString(content, file);
  
  if (!report.valid) {
    allValid = false;
    feedback.push(`❌ ${file}: ${report.results[0].messages.length} HTML fouten gevonden`);
    
    report.results[0].messages.forEach(msg => {
      feedback.push(`   - Regel ${msg.line}: ${msg.message}`);
    });
  } else {
    feedback.push(`✅ ${file}: HTML validatie geslaagd!`);
  }
});

// Schrijf feedback naar bestand
fs.writeFileSync('feedback.txt', feedback.join('\n'));