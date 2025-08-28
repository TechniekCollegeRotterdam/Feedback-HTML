const fs = require('fs');
const path = require('path');

class CSSValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.score = 0;
    this.maxScore = 25;
    this.validatedFiles = [];
  }

  findCSSFiles() {
    const cssFiles = [];
    
    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        // Skip .git, node_modules, etc.
        if (item.startsWith('.') || item === 'node_modules') return;
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.css')) {
          cssFiles.push(fullPath);
        }
      });
    }
    
    scanDirectory('.');
    return cssFiles;
  }

  validateCSSSyntax(filePath, content) {
    const filename = path.basename(filePath);
    console.log(`🔍 Valideren CSS syntax: ${filename}`);
    
    let syntaxScore = 0;
    const syntaxIssues = [];
    
    // Check voor basis CSS structuur
    if (content.trim().length === 0) {
      syntaxIssues.push(`❌ ${filename}: CSS bestand is leeg`);
      return { syntaxScore: 0, syntaxIssues };
    }
    
    // Check voor ongebalanceerde brackets
    const openBrackets = (content.match(/\{/g) || []).length;
    const closeBrackets = (content.match(/\}/g) || []).length;
    
    if (openBrackets === closeBrackets && openBrackets > 0) {
      syntaxScore += 3;
      console.log(`✅ ${filename}: CSS brackets zijn gebalanceerd`);
    } else {
      syntaxIssues.push(`❌ ${filename}: ongebalanceerde brackets ({ vs })`);
    }
    
    // Check voor basis CSS regels (selectors met properties)
    const cssRules = content.match(/[^{}]+\{[^{}]+\}/g) || [];
    if (cssRules.length > 0) {
      syntaxScore += 2;
      console.log(`✅ ${filename}: ${cssRules.length} CSS regels gevonden`);
    } else {
      syntaxIssues.push(`❌ ${filename}: geen geldige CSS regels gevonden`);
    }
    
    // Check voor puntkomma's aan het einde van properties
    const properties = content.match(/[a-zA-Z-]+\s*:\s*[^;{}]+[;}]/g) || [];
    const propertiesWithoutSemicolon = content.match(/[a-zA-Z-]+\s*:\s*[^;{}]+\s*(?=\})/g) || [];
    
    if (properties.length > propertiesWithoutSemicolon.length) {
      syntaxScore += 2;
      console.log(`✅ ${filename}: properties hebben puntkomma's`);
    } else if (propertiesWithoutSemicolon.length > 0) {
      syntaxIssues.push(`⚠️ ${filename}: ${propertiesWithoutSemicolon.length} properties missen puntkomma`);
    }
    
    // Check voor valide property names
    const invalidProperties = [];
    properties.forEach(prop => {
      const propName = prop.split(':')[0].trim();
      // Basis lijst van CSS properties - in praktijk zou je een uitgebreidere lijst gebruiken
      const validProperties = [
        'color', 'background', 'background-color', 'font-size', 'font-family', 'font-weight',
        'margin', 'padding', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom',
        'border', 'border-color', 'border-width', 'border-style', 'text-align', 'text-decoration',
        'float', 'clear', 'overflow', 'z-index', 'opacity', 'cursor', 'line-height', 'letter-spacing',
        'word-spacing', 'text-transform', 'vertical-align', 'white-space', 'list-style', 'content',
        'flex', 'grid', 'justify-content', 'align-items', 'min-width', 'max-width', 'min-height', 'max-height'
      ];
      
      const isValidProperty = validProperties.some(valid => 
        propName.startsWith(valid) || propName.includes(valid)
      ) || propName.startsWith('-webkit-') || propName.startsWith('-moz-') || propName.startsWith('-ms-');
      
      if (!isValidProperty && propName.length > 2) {
        invalidProperties.push(propName);
      }
    });
    
    if (invalidProperties.length === 0 && properties.length > 0) {
      syntaxScore += 2;
    } else if (invalidProperties.length > 0) {
      syntaxIssues.push(`⚠️ ${filename}: mogelijk ongeldige properties: ${invalidProperties.slice(0, 3).join(', ')}`);
    }
    
    return { syntaxScore, syntaxIssues };
  }

  validateCSSBestPractices(filePath, content) {
    const filename = path.basename(filePath);
    console.log(`🔍 Controleren CSS best practices: ${filename}`);
    
    let practiceScore = 0;
    const practiceIssues = [];
    const practiceWarnings = [];
    
    // Check voor !important (should be avoided)
    const importantCount = (content.match(/!important/gi) || []).length;
    if (importantCount === 0) {
      practiceScore += 2;
      console.log(`✅ ${filename}: geen !important gebruikt (goed!)`);
    } else {
      practiceWarnings.push(`⚠️ ${filename}: ${importantCount} keer !important gebruikt - probeer dit te vermijden`);
    }
    
    // Check voor ID selectors (klassen zijn beter voor styling)
    const idSelectors = content.match(/#[a-zA-Z][\w-]*/g) || [];
    if (idSelectors.length <= 2) {
      practiceScore += 1;
    } else {
      practiceWarnings.push(`⚠️ ${filename}: veel ID selectors (${idSelectors.length}) - gebruik klassen voor styling`);
    }
    
    // Check voor class selectors (good practice)
    const classSelectors = content.match(/\.[a-zA-Z][\w-]*/g) || [];
    if (classSelectors.length >= 3) {
      practiceScore += 2;
      console.log(`✅ ${filename}: goede gebruik van class selectors`);
    } else if (classSelectors.length > 0) {
      practiceScore += 1;
      practiceWarnings.push(`⚠️ ${filename}: overweeg meer class selectors te gebruiken`);
    }
    
    // Check voor consistent indentation
    const lines = content.split('\n');
    let inconsistentIndentation = false;
    let indentationType = null; // 'spaces' or 'tabs'
    
    lines.forEach((line, index) => {
      if (line.trim().length === 0) return;
      
      const leadingWhitespace = line.match(/^(\s+)/);
      if (leadingWhitespace) {
        const whitespace = leadingWhitespace[1];
        const hasSpaces = whitespace.includes(' ');
        const hasTabs = whitespace.includes('\t');
        
        if (indentationType === null) {
          indentationType = hasSpaces ? 'spaces' : 'tabs';
        } else if (
          (indentationType === 'spaces' && hasTabs) || 
          (indentationType === 'tabs' && hasSpaces)
        ) {
          inconsistentIndentation = true;
        }
      }
    });
    
    if (!inconsistentIndentation && lines.length > 10) {
      practiceScore += 2;
      console.log(`✅ ${filename}: consistente inspringing gebruikt`);
    } else if (inconsistentIndentation) {
      practiceIssues.push(`❌ ${filename}: inconsistente inspringing (mix van spaties en tabs)`);
    }
    
    // Check voor vendor prefixes (advanced maar goed om te weten)
    const vendorPrefixes = content.match(/-(webkit|moz|ms|o)-[\w-]+/g) || [];
    if (vendorPrefixes.length > 0) {
      practiceScore += 1;
      console.log(`✅ ${filename}: vendor prefixes gebruikt voor browser compatibiliteit`);
    }
    
    // Check voor responsive design hints
    const mediaQueries = content.match(/@media[^{]+\{/g) || [];
    if (mediaQueries.length > 0) {
      practiceScore += 2;
      console.log(`✅ ${filename}: media queries gevonden - responsive design!`);
    } else {
      practiceWarnings.push(`💡 ${filename}: overweeg media queries toe te voegen voor responsive design`);
    }
    
    // Check voor color usage (hex, rgb, hsl)
    const hexColors = content.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g) || [];
    const rgbColors = content.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g) || [];
    const namedColors = content.match(/:\s*(red|blue|green|white|black|yellow|purple|orange|pink|gray|grey)\s*[;}]/gi) || [];
    
    if (hexColors.length > 0 || rgbColors.length > 0) {
      practiceScore += 1;
      console.log(`✅ ${filename}: professionele kleurnotatie gebruikt`);
    }
    
    if (namedColors.length > 3) {
      practiceWarnings.push(`⚠️ ${filename}: veel named colors gebruikt - overweeg hex codes`);
    }
    
    return { practiceScore, practiceIssues, practiceWarnings };
  }

  validateCSSFormatting(filePath, content) {
    const filename = path.basename(filePath);
    console.log(`🔍 Controleren CSS formatting: ${filename}`);
    
    let formatScore = 0;
    const formatIssues = [];
    
    // Check voor spatie na dubbelpunt
    const propertiesWithSpacing = content.match(/[\w-]+\s*:\s+[^;{}]+/g) || [];
    const propertiesWithoutSpacing = content.match(/[\w-]+\s*:[^\s][^;{}]+/g) || [];
    
    if (propertiesWithSpacing.length > propertiesWithoutSpacing.length) {
      formatScore += 2;
      console.log(`✅ ${filename}: goede spatiëring na dubbelpunt`);
    } else {
      formatIssues.push(`❌ ${filename}: voeg spatie toe na dubbelpunt in CSS properties`);
    }
    
    // Check voor nieuwe regel na opening bracket
    const rulesWithNewline = content.match(/\{\s*\n/g) || [];
    const rulesWithoutNewline = content.match(/\{[^\n\s]/g) || [];
    
    if (rulesWithNewline.length > rulesWithoutNewline.length) {
      formatScore += 2;
      console.log(`✅ ${filename}: goede regel-indeling na opening brackets`);
    } else if (rulesWithoutNewline.length > 0) {
      formatIssues.push(`❌ ${filename}: start nieuwe regel na opening bracket {`);
    }
    
    // Check voor consistente bracket placement
    const closingBracketsOnNewLine = content.match(/\n\s*\}/g) || [];
    const totalClosingBrackets = content.match(/\}/g) || [];
    
    if (closingBracketsOnNewLine.length === totalClosingBrackets.length) {
      formatScore += 1;
      console.log(`✅ ${filename}: closing brackets op eigen regel`);
    } else {
      formatIssues.push(`❌ ${filename}: plaats closing brackets } op een eigen regel`);
    }
    
    return { formatScore, formatIssues };
  }

  analyzeComplexity(filePath, content) {
    const filename = path.basename(filePath);
    const analysis = {
      totalRules: (content.match(/[^{}]+\{[^{}]*\}/g) || []).length,
      totalSelectors: (content.match(/[^{}]+(?=\{)/g) || []).length,
      totalProperties: (content.match(/[\w-]+\s*:[^;}]+[;}]/g) || []).length,
      linesOfCode: content.split('\n').length,
      complexity: 'basic'
    };
    
    // Bepaal complexiteit
    if (analysis.totalRules > 20 || analysis.totalProperties > 50) {
      analysis.complexity = 'intermediate';
    }
    if (analysis.totalRules > 40 || analysis.totalProperties > 100) {
      analysis.complexity = 'advanced';
    }
    
    console.log(`📊 ${filename}: ${analysis.totalRules} regels, ${analysis.totalProperties} properties, ${analysis.linesOfCode} regels code`);
    return analysis;
  }

  async validateFile(filePath) {
    console.log(`\n🔍 Valideren: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const filename = path.basename(filePath);
      
      // Run alle validaties
      const syntaxResult = this.validateCSSSyntax(filePath, content);
      const practiceResult = this.validateCSSBestPractices(filePath, content);
      const formatResult = this.validateCSSFormatting(filePath, content);
      const complexity = this.analyzeComplexity(filePath, content);
      
      // Combineer scores
      const fileScore = syntaxResult.syntaxScore + practiceResult.practiceScore + formatResult.formatScore;
      const maxFileScore = 12; // 7 (syntax) + 11 (practices) + 5 (formatting) = 23, maar we cap per bestand
      
      this.score += Math.min(fileScore, maxFileScore);
      
      // Combineer issues
      const allIssues = [
        ...syntaxResult.syntaxIssues,
        ...practiceResult.practiceIssues,
        ...formatResult.formatIssues
      ];
      
      const allWarnings = [
        ...practiceResult.practiceWarnings
      ];
      
      this.issues.push(...allIssues);
      this.warnings.push(...allWarnings);
      
      this.validatedFiles.push({
        file: filename,
        score: fileScore,
        maxScore: maxFileScore,
        issues: allIssues,
        warnings: allWarnings,
        complexity,
        passed: fileScore >= (maxFileScore * 0.6) // 60% threshold per bestand
      });
      
      console.log(`📊 ${filename}: ${fileScore}/${maxFileScore} punten`);
      
    } catch (error) {
      console.error(`❌ Fout bij valideren ${filePath}:`, error.message);
      this.issues.push(`❌ ${path.basename(filePath)}: kon bestand niet lezen - ${error.message}`);
    }
  }

  checkCSSUsage() {
    console.log("🔍 Controleren CSS usage in HTML bestanden...");
    
    // Zoek alle HTML bestanden
    const htmlFiles = [];
    function findHTMLFiles(dir) {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (item.startsWith('.') || item === 'node_modules') return;
        
        if (stat.isDirectory()) {
          findHTMLFiles(fullPath);
        } else if (item.endsWith('.html')) {
          htmlFiles.push(fullPath);
        }
      });
    }
    
    findHTMLFiles('.');
    
    // Check elke HTML file voor CSS usage
    const cssClassesUsed = new Set();
    const cssIdsUsed = new Set();
    
    htmlFiles.forEach(htmlFile => {
      try {
        const content = fs.readFileSync(htmlFile, 'utf8');
        
        // Extract class attributes
        const classMatches = content.match(/class=["']([^"']+)["']/gi) || [];
        classMatches.forEach(match => {
          const classes = match.replace(/class=["']/gi, '').replace(/["']/g, '').split(/\s+/);
          classes.forEach(cls => {
            if (cls.trim()) cssClassesUsed.add(cls.trim());
          });
        });
        
        // Extract id attributes
        const idMatches = content.match(/id=["']([^"']+)["']/gi) || [];
        idMatches.forEach(match => {
          const id = match.replace(/id=["']/gi, '').replace(/["']/g, '').trim();
          if (id) cssIdsUsed.add(id);
        });
        
      } catch (error) {
        console.warn(`⚠️ Kon ${htmlFile} niet lezen voor CSS usage check`);
      }
    });
    
    // Check of gebruikte classes/ids bestaan in CSS
    if (cssClassesUsed.size > 0) {
      this.score += 2;
      console.log(`✅ ${cssClassesUsed.size} CSS classes gebruikt in HTML`);
    } else {
      this.warnings.push("⚠️ Geen CSS classes gevonden in HTML - wordt styling wel toegepast?");
    }
    
    console.log(`📊 CSS usage: ${cssClassesUsed.size} classes, ${cssIdsUsed.size} IDs`);
    
    return { classesUsed: cssClassesUsed, idsUsed: cssIdsUsed };
  }

  generateReport() {
    const totalFiles = this.validatedFiles.length;
    const passedFiles = this.validatedFiles.filter(file => file.passed).length;
    const percentage = this.maxScore > 0 ? Math.round((this.score / this.maxScore) * 100) : 0;
    const overallPassed = percentage >= 70;
    
    const report = {
      passed: overallPassed,
      score: this.score,
      maxScore: this.maxScore,
      percentage,
      issues: this.issues,
      warnings: this.warnings,
      filesValidated: totalFiles,
      filesPassed: passedFiles,
      fileDetails: this.validatedFiles
    };
    
    console.log(`\n📊 CSS Validatie Resultaten:`);
    console.log(`Overall Score: ${this.score}/${this.maxScore} (${percentage}%)`);
    console.log(`Bestanden: ${passedFiles}/${totalFiles} geslaagd`);
    console.log(`Status: ${overallPassed ? '✅ GESLAAGD' : '❌ AANDACHT NODIG'}`);
    
    if (this.issues.length > 0) {
      console.log(`\n❌ Issues (${this.issues.length}):`);
      this.issues.slice(0, 10).forEach(issue => console.log(`  ${issue}`));
      if (this.issues.length > 10) {
        console.log(`  ... en ${this.issues.length - 10} meer issues`);
      }
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ Waarschuwingen (${this.warnings.length}):`);
      this.warnings.slice(0, 5).forEach(warning => console.log(`  ${warning}`));
      if (this.warnings.length > 5) {
        console.log(`  ... en ${this.warnings.length - 5} meer waarschuwingen`);
      }
    }
    
    return report;
  }

  async runAllTests() {
    console.log("🚀 Starten CSS validatie tests...\n");
    
    const cssFiles = this.findCSSFiles();
    
    if (cssFiles.length === 0) {
      console.log("❌ Geen CSS bestanden gevonden!");
      this.issues.push("❌ Geen CSS bestanden gevonden in project");
      
      const report = this.generateReport();
      
      // Update test results
      let testResults;
      try {
        testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
      } catch (error) {
        testResults = { passed: 0, total: 0, categories: {} };
      }
      
      testResults.categories.css = report;
      testResults.total = Object.keys(testResults.categories).length;
      testResults.passed = Object.values(testResults.categories).filter(cat => cat.passed).length;
      
      fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
      
      return report;
    }
    
    console.log(`📁 Gevonden CSS bestanden: ${cssFiles.length}`);
    cssFiles.forEach(file => console.log(`  - ${file}`));
    
    // Valideer elk CSS bestand
    for (const cssFile of cssFiles) {
      await this.validateFile(cssFile);
    }
    
    // Check CSS usage in HTML
    this.checkCSSUsage();
    
    // Bonus punten voor goede praktijken
    if (this.validatedFiles.every(file => file.passed)) {
      this.score += 3;
      console.log("✅ Bonus: alle CSS bestanden zijn goed gevalideerd!");
    }
    
    // Check voor één CSS bestand (zoals vereist)
    if (cssFiles.length === 1) {
      this.score += 2;
      console.log("✅ Bonus: precies één CSS bestand gebruikt (zoals vereist)");
    } else if (cssFiles.length > 1) {
      this.issues.push(`⚠️ Meerdere CSS bestanden gevonden (${cssFiles.length}) - gebruik slechts één CSS bestand`);
    }
    
    const report = this.generateReport();
    
    // Update test results voor hoofdrapport
    let testResults;
    try {
      testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
    } catch (error) {
      testResults = { passed: 0, total: 0, categories: {} };
    }
    
    testResults.categories.css = report;
    testResults.total = Object.keys(testResults.categories).length;
    testResults.passed = Object.values(testResults.categories).filter(cat => cat.passed).length;
    
    fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
    
    // Schrijf gedetailleerd CSS rapport
    const detailedReport = [
      "# CSS Validatie Rapport\n",
      `**Overall Score:** ${this.score}/${this.maxScore} (${report.percentage}%)\n`,
      `**Status:** ${report.passed ? '✅ GESLAAGD' : '❌ VERBETERING NODIG'}\n`,
      `**Bestanden gevalideerd:** ${report.filesValidated}\n`,
      
      "## Per Bestand Details:\n"
    ];
    
    this.validatedFiles.forEach(file => {
      detailedReport.push(`### ${file.file}`);
      detailedReport.push(`- Score: ${file.score}/${file.maxScore}`);
      detailedReport.push(`- Status: ${file.passed ? '✅ Goed' : '❌ Aandacht nodig'}`);
      detailedReport.push(`- Complexiteit: ${file.complexity.complexity}`);
      
      if (file.issues.length > 0) {
        detailedReport.push("- **Issues:**");
        file.issues.forEach(issue => detailedReport.push(`  - ${issue}`));
      }
      
      if (file.warnings.length > 0) {
        detailedReport.push("- **Waarschuwingen:**");
        file.warnings.forEach(warning => detailedReport.push(`  - ${warning}`));
      }
      
      detailedReport.push(""); // Lege regel
    });
    
    if (report.issues.length > 0) {
      detailedReport.push("## 🔧 Actiepunten:");
      report.issues.slice(0, 10).forEach(issue => detailedReport.push(`- ${issue}`));
    }
    
    if (report.warnings.length > 0) {
      detailedReport.push("## 💡 Verbeteringsuggesties:");
      report.warnings.slice(0, 10).forEach(warning => detailedReport.push(`- ${warning}`));
    }
    
    fs.writeFileSync('css-validation-report.md', detailedReport.join('\n'));
    
    console.log("\n✅ CSS validatie tests voltooid!");
    console.log("📄 Gedetailleerd rapport: css-validation-report.md");
    
    return report;
  }
}

// Main execution
async function main() {
  try {
    const validator = new CSSValidator();
    const result = await validator.runAllTests();
    
    // Exit met foutcode als tests falen voor CI/CD
    process.exit(result.passed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Fout in CSS validatie:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run als dit bestand direct wordt uitgevoerd
if (require.main === module) {
  main();
}

module.exports = CSSValidator;