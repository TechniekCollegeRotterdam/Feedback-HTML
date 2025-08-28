const fs = require('fs');
const cheerio = require('cheerio');

function analyzeHTMLComments(filename, content) {
  const feedback = [];
  let score = 0;
  
  // Check voor header commentaar
  const headerCommentRegex = /<!--[\s\S]*?(?:titel|title|auteur|author|datum|date)[\s\S]*?-->/i;
  if (headerCommentRegex.test(content)) {
    feedback.push(`✅ ${filename}: Header commentaar gevonden`);
    score += 2;
  } else {
    feedback.push(`❌ ${filename}: Geen header commentaar met titel/auteur/datum`);
  }
  
  // Tel alle HTML commentaren
  const htmlComments = content.match(/<!--[\s\S]*?-->/g) || [];
  const meaningfulComments = htmlComments.filter(comment => {
    const cleanComment = comment.replace(/<!--\s*|\s*-->/g, '').trim();
    return cleanComment.length > 5 && 
           !cleanComment.match(/^(test|todo|fix|temp)$/i);
  });
  
  if (meaningfulComments.length >= 5) {
    feedback.push(`✅ ${filename}: ${meaningfulComments.length} zinvolle commentaren gevonden`);
    score += 3;
  } else {
    feedback.push(`❌ ${filename}: Slechts ${meaningfulComments.length}/5 zinvolle commentaren`);
    feedback.push(`   💡 Tip: Voeg commentaar toe bij belangrijke secties zoals navigatie, header, footer`);
  }
  
  // Check voor sectie commentaren
  const sectionComments = htmlComments.filter(comment => 
    comment.match(/(navigatie|nav|header|footer|main|sectie|section)/i)
  );
  
  if (sectionComments.length >= 2) {
    feedback.push(`✅ ${filename}: Goede sectie-commentaren gebruikt`);
    score += 2;
  } else {
    feedback.push(`❌ ${filename}: Voeg meer sectie-commentaren toe (nav, header, main, etc.)`);
  }
  
  return { feedback, score, maxScore: 7 };
}

function analyzeCSSComments(filename, content) {
  const feedback = [];
  let score = 0;
  
  // Check voor header commentaar
  const headerPattern = /\/\*[\s\S]*?(?:bestand|file|auteur|author|datum|date|project)[\s\S]*?\*\//i;
  if (headerPattern.test(content)) {
    feedback.push(`✅ ${filename}: CSS header commentaar gevonden`);
    score += 2;
  } else {
    feedback.push(`❌ ${filename}: Geen header commentaar in CSS`);
    feedback.push(`   💡 Voorbeeld: /* Project: Mijn Website | Auteur: Naam | Datum: 2024 */`);
  }
  
  // Tel CSS commentaren
  const cssComments = content.match(/\/\*[\s\S]*?\*\//g) || [];
  const meaningfulComments = cssComments.filter(comment => {
    const cleanComment = comment.replace(/\/\*\s*|\s*\*\//g, '').trim();
    return cleanComment.length > 5;
  });
  
  if (meaningfulComments.length >= 8) {
    feedback.push(`✅ ${filename}: ${meaningfulComments.length} CSS commentaren gevonden`);
    score += 4;
  } else {
    feedback.push(`❌ ${filename}: Slechts ${meaningfulComments.length}/8 CSS commentaren`);
  }
  
  // Check voor sectie-dividers
  const sectionDividers = cssComments.filter(comment => 
    comment.match(/^\/\*\s*={3,}.*={3,}\s*\*\/$/m)
  );
  
  if (sectionDividers.length >= 3) {
    feedback.push(`✅ ${filename}: Goede sectie-indeling met dividers`);
    score += 2;
  } else {
    feedback.push(`❌ ${filename}: Gebruik sectie-dividers zoals /* === NAVIGATIE === */`);
  }
  
  return { feedback, score, maxScore: 8 };
}

async function runCommentTests() {
  const results = {
    html: { feedback: [], totalScore: 0, maxScore: 0 },
    css: { feedback: [], totalScore: 0, maxScore: 0 }
  };
  
  // Test HTML bestanden
  const htmlFiles = fs.readdirSync('.').filter(file => file.endsWith('.html'));
  
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const result = analyzeHTMLComments(file, content);
    
    results.html.feedback.push(...result.feedback);
    results.html.totalScore += result.score;
    results.html.maxScore += result.maxScore;
  }
  
  // Test CSS bestanden
  const cssFiles = fs.readdirSync('.', { recursive: true })
    .filter(file => file.endsWith('.css'));
  
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const result = analyzeCSSComments(file, content);
    
    results.css.feedback.push(...result.feedback);
    results.css.totalScore += result.score;
    results.css.maxScore += result.maxScore;
  }
  
  // Genereer rapport
  const report = [
    "## 💬 Commentaar Kwaliteit Rapport\n",
    "### HTML Commentaren:",
    ...results.html.feedback,
    `\n**HTML Score: ${results.html.totalScore}/${results.html.maxScore}**\n`,
    "### CSS Commentaren:",
    ...results.css.feedback,
    `\n**CSS Score: ${results.css.totalScore}/${results.css.maxScore}**`,
    "\n### 📚 Tips voor Goede Commentaren:",
    "- Leg complexe code uit in je eigen woorden",
    "- Gebruik sectie-commentaren voor overzicht", 
    "- Schrijf commentaren alsof je het aan een klasgenoot uitlegt",
    "- Update commentaren als je code wijzigt"
  ];
  
  fs.writeFileSync('comment-feedback.md', report.join('\n'));
  
  // Update test results voor hoofdrapport
  const testResults = fs.existsSync('test-results.json') 
    ? JSON.parse(fs.readFileSync('test-results.json', 'utf8'))
    : { passed: 0, total: 0, categories: {} };
    
  testResults.categories.comments = {
    htmlScore: results.html.totalScore,
    htmlMax: results.html.maxScore,
    cssScore: results.css.totalScore,
    cssMax: results.css.maxScore,
    passed: (results.html.totalScore + results.css.totalScore) > 
            (results.html.maxScore + results.css.maxScore) * 0.7
  };
  
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  
  console.log(`Commentaar tests voltooid. HTML: ${results.html.totalScore}/${results.html.maxScore}, CSS: ${results.css.totalScore}/${results.css.maxScore}`);
}

runCommentTests().catch(console.error);