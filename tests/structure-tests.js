const fs = require('fs');
const path = require('path');

class StructureValidator {
  constructor() {
    this.issues = [];
    this.score = 0;
    this.maxScore = 20;
  }

  checkFileStructure() {
    console.log("🔍 Controleren bestandsstructuur...");
    
    // Check of index.html bestaat in hoofdmap
    if (fs.existsSync('index.html')) {
      this.score += 3;
      console.log("✅ index.html gevonden in hoofdmap");
    } else {
      this.issues.push("❌ index.html ontbreekt in hoofdmap");
      console.log("❌ index.html niet gevonden in hoofdmap");
    }

    // Check CSS map structuur
    if (fs.existsSync('css') && fs.statSync('css').isDirectory()) {
      this.score += 2;
      console.log("✅ css/ map gevonden");
      
      // Check voor CSS bestanden in css map
      const cssFiles = fs.readdirSync('css').filter(file => file.endsWith('.css'));
      if (cssFiles.length > 0) {
        this.score += 3;
        console.log(`✅ ${cssFiles.length} CSS bestand(en) gevonden in css/ map`);
        
        // Check voor logische CSS naamgeving
        const validCssNames = cssFiles.filter(file => 
          file.match(/^(style|styles|main|index)\.css$/i)
        );
        if (validCssNames.length > 0) {
          this.score += 1;
          console.log("✅ Logische CSS bestandsnaam gebruikt");
        } else {
          this.issues.push("⚠️ Overweeg logischere CSS bestandsnaam (style.css, styles.css, main.css)");
        }
      } else {
        this.issues.push("❌ Geen CSS bestanden gevonden in css/ map");
      }
    } else {
      this.issues.push("❌ css/ map ontbreekt - maak een css/ map voor je stylesheets");
    }

    // Check voor images map (optioneel maar aanbevolen)
    if (fs.existsSync('images') || fs.existsSync('img')) {
      this.score += 1;
      console.log("✅ Images map gevonden");
    } else {
      // Zoek naar afbeeldingen in hoofdmap
      const imageFiles = fs.readdirSync('.').filter(file => 
        file.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)
      );
      if (imageFiles.length > 0) {
        this.issues.push("⚠️ Afbeeldingen gevonden in hoofdmap - overweeg een images/ of img/ map");
      }
    }
  }

  checkFileNaming() {
    console.log("🔍 Controleren bestandsnaamconventies...");
    
    // Check HTML bestanden
    const htmlFiles = this.getAllFiles('.', '.html');
    htmlFiles.forEach(file => {
      const filename = path.basename(file);
      
      // Check lowercase
      if (filename !== filename.toLowerCase()) {
        this.issues.push(`❌ ${filename}: gebruik lowercase bestandsnamen`);
      } else {
        this.score += 0.5;
      }
      
      // Check voor spaties
      if (filename.includes(' ')) {
        this.issues.push(`❌ ${filename}: geen spaties in bestandsnamen - gebruik koppeltekens`);
      } else {
        this.score += 0.5;
      }
      
      // Check voor logische naamgeving
      if (filename.match(/^[a-z0-9\-]+\.html$/)) {
        this.score += 0.5;
      }
    });

    // Check CSS bestanden
    const cssFiles = this.getAllFiles('.', '.css');
    cssFiles.forEach(file => {
      const filename = path.basename(file);
      
      if (filename !== filename.toLowerCase()) {
        this.issues.push(`❌ ${filename}: gebruik lowercase bestandsnamen`);
      } else {
        this.score += 0.5;
      }
      
      if (filename.includes(' ')) {
        this.issues.push(`❌ ${filename}: geen spaties in bestandsnamen`);
      } else {
        this.score += 0.5;
      }
    });

    // Check afbeeldingen
    const imageFiles = this.getAllFiles('.', /\.(jpg|jpeg|png|gif|svg|webp)$/i);
    imageFiles.forEach(file => {
      const filename = path.basename(file);
      
      if (filename !== filename.toLowerCase()) {
        this.issues.push(`❌ ${filename}: gebruik lowercase voor afbeeldingen`);
      }
      
      if (filename.includes(' ')) {
        this.issues.push(`❌ ${filename}: geen spaties in afbeeldingsnamen`);
      }
    });
  }

  checkCSSLinking() {
    console.log("🔍 Controleren CSS koppelingen...");
    
    const htmlFiles = this.getAllFiles('.', '.html');
    
    htmlFiles.forEach(htmlFile => {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const filename = path.basename(htmlFile);
      
      // Check voor CSS link tags
      const cssLinks = content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
      
      if (cssLinks.length === 0) {
        this.issues.push(`❌ ${filename}: geen CSS stylesheet gekoppeld`);
      } else if (cssLinks.length === 1) {
        this.score += 2;
        console.log(`✅ ${filename}: CSS stylesheet correct gekoppeld`);
        
        // Check of het gelinkte CSS bestand bestaat
        const cssHref = cssLinks[0].match(/href=["']([^"']+)["']/i);
        if (cssHref) {
          const cssPath = cssHref[1];
          const fullCssPath = path.resolve(path.dirname(htmlFile), cssPath);
          
          if (fs.existsSync(fullCssPath)) {
            this.score += 1;
            console.log(`✅ ${filename}: gekoppeld CSS bestand bestaat`);
          } else {
            this.issues.push(`❌ ${filename}: gekoppeld CSS bestand '${cssPath}' bestaat niet`);
          }
        }
      } else {
        this.issues.push(`⚠️ ${filename}: meerdere CSS bestanden gekoppeld - gebruik slechts één CSS bestand`);
      }
      
      // Check voor inline styles (verboden)
      const inlineStyles = content.match(/style=["'][^"']*["']/gi) || [];
      if (inlineStyles.length > 0) {
        this.issues.push(`❌ ${filename}: ${inlineStyles.length} inline style attributen gevonden - gebruik externe CSS`);
      } else {
        this.score += 1;
      }
      
      // Check voor <style> tags (verboden)
      const styleTags = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
      if (styleTags.length > 0) {
        this.issues.push(`❌ ${filename}: <style> tags gevonden - gebruik externe CSS`);
      } else {
        this.score += 1;
      }
    });
  }

  checkMenuConsistency() {
    console.log("🔍 Controleren menu consistentie...");
    
    const htmlFiles = this.getAllFiles('.', '.html');
    
    if (htmlFiles.length < 2) {
      console.log("⚠️ Slechts één HTML pagina gevonden - menu consistentie niet te testen");
      this.score += 2; // Geef voordeel van de twijfel
      return;
    }
    
    const menus = [];
    const menuStructures = [];
    
    htmlFiles.forEach(htmlFile => {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const filename = path.basename(htmlFile);
      
      // Zoek naar nav elementen
      const navMatch = content.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
      if (navMatch) {
        const navContent = navMatch[1];
        
        // Extract menu links
        const links = navContent.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi) || [];
        const menuItems = links.map(link => {
          const href = link.match(/href=["']([^"']+)["']/i);
          const text = link.replace(/<[^>]*>/g, '').trim();
          return { href: href ? href[1] : '', text };
        });
        
        menus.push({ file: filename, items: menuItems });
        menuStructures.push(JSON.stringify(menuItems));
      } else {
        this.issues.push(`❌ ${filename}: geen <nav> element gevonden`);
      }
    });
    
    // Check of alle menu's hetzelfde zijn
    if (menuStructures.length > 1) {
      const firstMenu = menuStructures[0];
      const allSame = menuStructures.every(menu => menu === firstMenu);
      
      if (allSame) {
        this.score += 3;
        console.log("✅ Menu is consistent op alle pagina's");
      } else {
        this.issues.push("❌ Menu's zijn niet identiek op alle pagina's");
        console.log("❌ Menu inconsistentie gedetecteerd");
      }
    }
    
    // Check menu structuur (max 2 niveaus)
    menus.forEach(menu => {
      const hasNestedMenus = menu.items.some(item => 
        item.text.includes('dropdown') || item.text.includes('submenu')
      );
      
      // Dit is een basis check - voor echte nested menus zou je de HTML dieper moeten parsen
      if (menu.items.length > 0) {
        this.score += 1;
        console.log(`✅ ${menu.file}: menu items gevonden`);
      }
    });
  }

  checkHTMLStructure() {
    console.log("🔍 Controleren HTML basis structuur...");
    
    const htmlFiles = this.getAllFiles('.', '.html');
    
    htmlFiles.forEach(htmlFile => {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const filename = path.basename(htmlFile);
      
      // Check voor DOCTYPE
      if (content.match(/<!DOCTYPE\s+html>/i)) {
        this.score += 1;
      } else {
        this.issues.push(`❌ ${filename}: DOCTYPE html ontbreekt of incorrect`);
      }
      
      // Check voor basis structuur
      const hasHtmlTag = content.match(/<html[^>]*>/i);
      const hasHeadTag = content.match(/<head[^>]*>/i);
      const hasBodyTag = content.match(/<body[^>]*>/i);
      
      if (hasHtmlTag && hasHeadTag && hasBodyTag) {
        this.score += 2;
      } else {
        this.issues.push(`❌ ${filename}: ontbrekende basis tags (html, head, of body)`);
      }
      
      // Check voor sluit tags
      const htmlOpenTags = (content.match(/<html[^>]*>/gi) || []).length;
      const htmlCloseTags = (content.match(/<\/html>/gi) || []).length;
      const headOpenTags = (content.match(/<head[^>]*>/gi) || []).length;
      const headCloseTags = (content.match(/<\/head>/gi) || []).length;
      const bodyOpenTags = (content.match(/<body[^>]*>/gi) || []).length;
      const bodyCloseTags = (content.match(/<\/body>/gi) || []).length;
      
      if (htmlOpenTags === htmlCloseTags && htmlOpenTags === 1) {
        this.score += 0.5;
      } else {
        this.issues.push(`❌ ${filename}: html tags niet correct geopend/gesloten`);
      }
      
      if (headOpenTags === headCloseTags && headOpenTags === 1) {
        this.score += 0.5;
      } else {
        this.issues.push(`❌ ${filename}: head tags niet correct geopend/gesloten`);
      }
      
      if (bodyOpenTags === bodyCloseTags && bodyOpenTags === 1) {
        this.score += 0.5;
      } else {
        this.issues.push(`❌ ${filename}: body tags niet correct geopend/gesloten`);
      }
    });
  }

  getAllFiles(dir, extension) {
    const files = [];
    
    function scanDirectory(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        // Skip .git, node_modules, etc.
        if (item.startsWith('.') || item === 'node_modules') return;
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          if (typeof extension === 'string' && fullPath.endsWith(extension)) {
            files.push(fullPath);
          } else if (extension instanceof RegExp && extension.test(fullPath)) {
            files.push(fullPath);
          }
        }
      });
    }
    
    scanDirectory(dir);
    return files;
  }

  generateReport() {
    const percentage = Math.round((this.score / this.maxScore) * 100);
    const passed = percentage >= 70;
    
    const report = {
      passed,
      score: this.score,
      maxScore: this.maxScore,
      percentage,
      issues: this.issues
    };
    
    console.log(`\n📊 Structuur Test Resultaten:`);
    console.log(`Score: ${this.score}/${this.maxScore} (${percentage}%)`);
    console.log(`Status: ${passed ? '✅ GESLAAGD' : '❌ AANDACHT NODIG'}`);
    
    if (this.issues.length > 0) {
      console.log(`\n⚠️ Aandachtspunten (${this.issues.length}):`);
      this.issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    return report;
  }

  async runAllTests() {
    console.log("🚀 Starten structuur validatie tests...\n");
    
    this.checkFileStructure();
    this.checkFileNaming();
    this.checkCSSLinking();
    this.checkMenuConsistency();
    this.checkHTMLStructure();
    
    const report = this.generateReport();
    
    // Update test results voor hoofdrapport
    let testResults;
    try {
      testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
    } catch (error) {
      testResults = { passed: 0, total: 0, categories: {} };
    }
    
    testResults.categories.structure = report;
    testResults.total = Object.keys(testResults.categories).length;
    testResults.passed = Object.values(testResults.categories).filter(cat => cat.passed).length;
    
    fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
    
    console.log("\n✅ Structuur tests voltooid!");
    return report;
  }
}

// Main execution
async function main() {
  try {
    const validator = new StructureValidator();
    const result = await validator.runAllTests();
    
    // Exit met foutcode als tests falen
    process.exit(result.passed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Fout in structuur tests:', error.message);
    process.exit(1);
  }
}

// Run als dit bestand direct wordt uitgevoerd
if (require.main === module) {
  main();
}

module.exports = StructureValidator;