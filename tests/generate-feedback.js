const fs = require('fs');
const path = require('path');

class GrowthMindsetFeedbackGenerator {
  constructor() {
    this.encouragements = [
      "💪 Elke fout is een kans om te leren en te groeien!",
      "🌱 Je bent op de goede weg - blijf oefenen en verbeteren!",
      "🎯 Focus op één verbetering per keer, dat werkt het beste",
      "🚀 Geweldig dat je actief feedback opvolgt en implementeert!",
      "⭐ Iedere kleine stap vooruit telt - je doet het goed!",
      "🔥 Je laat echte vooruitgang zien - ga zo door!",
      "💡 Door fouten te maken leer je sneller dan door alles meteen goed te doen",
      "🏆 Perfectie is een reis, geen bestemming - enjoy the ride!"
    ];

    this.motivationalTips = [
      "🤝 Bespreek knelpunten met je projectpartner - twee weten meer dan één",
      "📚 Bekijk de voorbeelden in de les nog eens door",
      "🔍 Gebruik de browser developer tools om CSS problemen op te sporen",
      "⏰ Plan kleine dagelijkse verbeteringen in plaats van alles tegelijk",
      "🗣️ Stel vragen tijdens de les - anderen hebben vaak dezelfde vragen!",
      "💻 Test je website in verschillende browsers",
      "📱 Controleer hoe je site eruitziet op mobiel",
      "🎨 Inspiratie opdoen? Bekijk andere websites en analyseer hun opbouw"
    ];

    this.categoryEmojis = {
      html: "🏗️",
      css: "🎨", 
      structure: "📁",
      comments: "💬",
      validation: "✅",
      accessibility: "♿"
    };
  }

  loadTestResults() {
    try {
      return JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
    } catch (error) {
      console.warn('Geen test-results.json gevonden, gebruik standaard template');
      return {
        passed: 0,
        total: 10,
        categories: {
          html: { passed: false, score: 0, maxScore: 10, issues: [] },
          css: { passed: false, score: 0, maxScore: 10, issues: [] },
          structure: { passed: false, score: 0, maxScore: 10, issues: [] },
          comments: { passed: false, htmlScore: 0, htmlMax: 7, cssScore: 0, cssMax: 8, issues: [] },
          validation: { passed: false, score: 0, maxScore: 10, issues: [] }
        }
      };
    }
  }

  calculateOverallProgress(testResults) {
    const totalPossiblePoints = Object.values(testResults.categories).reduce((sum, category) => {
      if (category.maxScore) return sum + category.maxScore;
      if (category.htmlMax && category.cssMax) return sum + category.htmlMax + category.cssMax;
      return sum + 10; // fallback
    }, 0);

    const earnedPoints = Object.values(testResults.categories).reduce((sum, category) => {
      if (category.score !== undefined) return sum + category.score;
      if (category.htmlScore !== undefined && category.cssScore !== undefined) {
        return sum + category.htmlScore + category.cssScore;
      }
      return sum + (category.passed ? 10 : 0);
    }, 0);

    const percentage = Math.round((earnedPoints / totalPossiblePoints) * 100);
    return { earnedPoints, totalPossiblePoints, percentage };
  }

  generateProgressBar(percentage) {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  }

  getMotivationalHeader(percentage) {
    if (percentage >= 90) {
      return {
        title: "🏆 UITSTEKEND WERK!",
        message: "Je beheerst de basis van HTML/CSS heel goed. Je bent klaar voor de volgende uitdaging!",
        color: "🟢"
      };
    } else if (percentage >= 75) {
      return {
        title: "🌟 HEEL GOED BEZIG!",
        message: "Je bent goed op weg! Met nog wat kleine verbeteringen zit je helemaal goed.",
        color: "🟡"
      };
    } else if (percentage >= 50) {
      return {
        title: "📈 MOOIE VOORUITGANG!",
        message: "Je hebt de basis al goed onder de knie. Focus nu op de verbeterpunten hieronder.",
        color: "🟠"
      };
    } else {
      return {
        title: "🌱 GOEDE START!",
        message: "Rome werd ook niet op één dag gebouwd. Pak de feedback hieronder stap voor stap aan.",
        color: "🔴"
      };
    }
  }

  generateCategoryFeedback(categoryName, categoryData) {
    const emoji = this.categoryEmojis[categoryName] || "📋";
    const feedback = [`### ${emoji} ${categoryName.toUpperCase()}`];

    if (categoryName === 'comments') {
      const totalScore = (categoryData.htmlScore || 0) + (categoryData.cssScore || 0);
      const totalMax = (categoryData.htmlMax || 7) + (categoryData.cssMax || 8);
      const percentage = Math.round((totalScore / totalMax) * 100);

      if (percentage >= 80) {
        feedback.push("✅ **Uitstekend!** Je commentaren zijn duidelijk en helpend.");
      } else if (percentage >= 60) {
        feedback.push("🟡 **Goed bezig!** Je commentaren kunnen nog wat uitgebreider.");
        feedback.push("💡 **Tips:**");
        feedback.push("   - Leg complexere CSS selectors uit");
        feedback.push("   - Voeg sectie-commentaren toe in HTML");
        feedback.push("   - Beschrijf wat code doet, niet alleen wat het is");
      } else {
        feedback.push("🔴 **Aandachtspunt:** Meer en betere commentaren nodig.");
        feedback.push("💡 **Essentiële verbeteringen:**");
        feedback.push("   - Voeg header-commentaar toe met project info");
        feedback.push("   - Minimaal 5 zinvolle HTML commentaren per pagina");
        feedback.push("   - Minimaal 8 CSS commentaren met sectie-dividers");
        feedback.push("   - Leg ingewikkelde code uit alsof je het aan een vriend vertelt");
      }
    } else {
      const score = categoryData.score || 0;
      const maxScore = categoryData.maxScore || 10;
      const percentage = Math.round((score / maxScore) * 100);

      if (categoryData.passed || percentage >= 80) {
        feedback.push(`✅ **Super!** ${categoryName} tests zijn geslaagd! (${score}/${maxScore})`);
      } else if (percentage >= 60) {
        feedback.push(`🟡 **Bijna goed!** ${score}/${maxScore} punten behaald.`);
        this.addCategorySpecificTips(feedback, categoryName, 'warning');
      } else {
        feedback.push(`🔴 **Aandacht nodig:** ${score}/${maxScore} punten behaald.`);
        this.addCategorySpecificTips(feedback, categoryName, 'critical');
      }
    }

    // Voeg specifieke issues toe als die bestaan
    if (categoryData.issues && categoryData.issues.length > 0) {
      feedback.push("\n**Specifieke aandachtspunten:**");
      categoryData.issues.forEach(issue => {
        feedback.push(`   • ${issue}`);
      });
    }

    return feedback.join('\n');
  }

  addCategorySpecificTips(feedback, categoryName, level) {
    const tips = {
      html: {
        warning: [
          "Controleer of alle tags correct zijn gesloten",
          "Zorg dat DOCTYPE, html, head en body in juiste volgorde staan",
          "Gebruik semantische HTML5 elementen waar mogelijk"
        ],
        critical: [
          "Start met een correcte HTML5 structuur (DOCTYPE, html, head, body)",
          "Elke opening tag moet een sluit tag hebben",
          "Valideer je HTML op https://validator.w3.org",
          "Gebruik geen style attributen in HTML tags"
        ]
      },
      css: {
        warning: [
          "Controleer of CSS bestand correct is gekoppeld",
          "Geen !important gebruiken tenzij echt nodig",
          "Gebruik consistente naming conventions"
        ],
        critical: [
          "Koppel je CSS bestand met <link rel='stylesheet' href='css/style.css'>",
          "Gebruik alleen externe CSS (geen inline styles)",
          "Test of je CSS changes zichtbaar zijn in de browser",
          "Gebruik klasse-selectors in plaats van ID's voor styling"
        ]
      },
      structure: {
        warning: [
          "Controleer bestandsnamen (lowercase, geen spaties)",
          "Zorg voor logische mappenstructuur",
          "Alle afbeeldingen in images/ folder"
        ],
        critical: [
          "Maak een duidelijke mappenstructuur (css/, images/)",
          "Bestandsnamen in lowercase met koppeltekens",
          "Index.html moet in de hoofdmap staan",
          "Alle bestanden moeten vindbaar en toegankelijk zijn"
        ]
      },
      validation: {
        warning: [
          "Los HTML/CSS validatie warnings op",
          "Controleer alt-teksten bij afbeeldingen",
          "Test je website in verschillende browsers"
        ],
        critical: [
          "Fix alle HTML validatie errors eerst",
          "Zorg dat CSS syntax correct is",
          "Alle afbeeldingen moeten alt attributen hebben",
          "Test of alle links werken"
        ]
      }
    };

    const categoryTips = tips[categoryName];
    if (categoryTips && categoryTips[level]) {
      feedback.push("\n💡 **Verbeterpunten:**");
      categoryTips[level].forEach(tip => {
        feedback.push(`   • ${tip}`);
      });
    }
  }

  generateActionPlan(testResults) {
    const actionItems = [];
    const categories = Object.entries(testResults.categories);
    
    // Sorteer categorieën op urgentie (laagste scores eerst)
    categories.sort(([, a], [, b]) => {
      const scoreA = a.score || (a.htmlScore + a.cssScore) || (a.passed ? 100 : 0);
      const scoreB = b.score || (b.htmlScore + b.cssScore) || (b.passed ? 100 : 0);
      return scoreA - scoreB;
    });

    actionItems.push("## 🎯 Jouw Actieplan voor Volgende Sessie");
    actionItems.push("*Pak deze punten één voor één aan:*\n");

    let priorityCount = 1;
    categories.slice(0, 3).forEach(([categoryName, categoryData]) => {
      if (!categoryData.passed && priorityCount <= 3) {
        actionItems.push(`**${priorityCount}. ${categoryName.toUpperCase()} verbeteren**`);
        
        if (categoryName === 'html') {
          actionItems.push("   - Open je HTML bestanden en check de basis structuur");
          actionItems.push("   - Valideer op https://validator.w3.org/");
          actionItems.push("   - Fix één fout per keer en test tussendoor");
        } else if (categoryName === 'css') {
          actionItems.push("   - Controleer of je CSS bestand goed is gekoppeld");
          actionItems.push("   - Test styling wijzigingen direct in de browser");
          actionItems.push("   - Gebruik browser developer tools (F12) om problemen te vinden");
        } else if (categoryName === 'comments') {
          actionItems.push("   - Voeg header commentaar toe aan alle bestanden");
          actionItems.push("   - Schrijf bij elke belangrijke sectie wat deze doet");
          actionItems.push("   - Leg ingewikkelde CSS uit in je eigen woorden");
        }
        
        actionItems.push(""); // Lege regel voor leesbaarheid
        priorityCount++;
      }
    });

    // Als alles goed gaat, geef vervolgstappen
    if (priorityCount === 1) {
      actionItems.push("🎉 **Je bent klaar voor de volgende uitdaging!**");
      actionItems.push("   - Experimenteer met nieuwe CSS properties");
      actionItems.push("   - Voeg interactiviteit toe met CSS :hover effects");
      actionItems.push("   - Maak je website responsive voor mobiel");
      actionItems.push("   - Probeer CSS Flexbox of Grid voor lay-out");
    }

    return actionItems.join('\n');
  }

  generateTeamworkSection() {
    return `
## 🤝 Samenwerking & Teamwork

**Voor jou en je projectpartner:**
• Bespreek samen welke delen jullie het moeilijkst vinden
• Verdeel het werk eerlijk - laat iedereen zowel HTML als CSS doen
• Review elkaar's code en geef constructieve feedback
• Gebruik Git om samen te werken - commit vaak met duidelijke berichten
• Plan regelmatig korte check-ins om voortgang te bespreken

**🔄 Git Tips:**
• \`git add .\` → \`git commit -m "Beschrijvende boodschap"\` → \`git push\`
• Commit kleine wijzigingen vaak in plaats van grote veranderingen zelden
• Gebruik duidelijke commit berichten zoals "Fix navigation styling" of "Add contact page"
`;
  }

  generateResourcesSection() {
    return `
## 📚 Handige Resources

**Validatie & Testing:**
• [HTML Validator](https://validator.w3.org/) - Check je HTML
• [CSS Validator](https://jigsaw.w3.org/css-validator/) - Check je CSS
• [Can I Use](https://caniuse.com/) - Browser compatibiliteit

**Leren & Inspiratie:**
• [MDN Web Docs](https://developer.mozilla.org/) - Uitgebreide documentatie
• [W3Schools](https://www.w3schools.com/) - Tutorials en voorbeelden
• [CSS-Tricks](https://css-tricks.com/) - CSS tips en trucs

**Tools:**
• Browser Developer Tools (F12) - Debug CSS problemen
• [Colorhunt](https://colorhunt.co/) - Kleurenpaletten
• [Google Fonts](https://fonts.google.com/) - Gratis fonts
`;
  }

  generatePersonalizedEncouragement(testResults) {
    const progress = this.calculateOverallProgress(testResults);
    const randomEncouragement = this.encouragements[Math.floor(Math.random() * this.encouragements.length)];
    const randomTip = this.motivationalTips[Math.floor(Math.random() * this.motivationalTips.length)];

    let personalMessage = "";
    
    if (progress.percentage >= 80) {
      personalMessage = "Je laat zien dat je de basis echt begrijpt. Dat is een sterke fundatie om op voort te bouwen! 🏗️";
    } else if (progress.percentage >= 60) {
      personalMessage = "Je bent goed bezig en maakt duidelijk vooruitgang. Deze feedback helpt je over de finish lijn! 🏃‍♂️";
    } else {
      personalMessage = "Elke expert was ooit een beginner. Je bent nu aan het leren en dat is precies waar je moet zijn! 🌟";
    }

    return `
---

## 💌 Persoonlijke Boodschap

${personalMessage}

${randomEncouragement}

**💡 Tip van de dag:** ${randomTip}

*Vergeet niet: programmeren leren is als een taal leren - hoe meer je oefent, hoe vloeiender het wordt. Jullie doen het goed samen! 👥*

---
*Dit rapport is automatisch gegenereerd op ${new Date().toLocaleDateString('nl-NL', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}*
`;
  }

  generateCompleteFeedback() {
    console.log("🔄 Genereren van uitgebreide feedback rapport...");
    
    const testResults = this.loadTestResults();
    const progress = this.calculateOverallProgress(testResults);
    const header = this.getMotivationalHeader(progress.percentage);
    const progressBar = this.generateProgressBar(progress.percentage);

    const feedback = [];

    // Header met progress
    feedback.push(`# ${header.title}\n`);
    feedback.push(`${header.color} **${header.message}**\n`);
    feedback.push(`## 📊 Jouw Voortgang`);
    feedback.push(`${progressBar}`);
    feedback.push(`**Score: ${progress.earnedPoints}/${progress.totalPossiblePoints} punten**\n`);

    // Snel overzicht
    feedback.push("## ⚡ Snel Overzicht");
    const passedCategories = Object.entries(testResults.categories).filter(([, data]) => data.passed).length;
    const totalCategories = Object.keys(testResults.categories).length;
    
    feedback.push(`✅ **${passedCategories}/${totalCategories}** categorieën voltooid`);
    
    if (passedCategories === totalCategories) {
      feedback.push("🎉 **GEFELICITEERD!** Alle tests zijn geslaagd!");
    } else {
      feedback.push(`🎯 **${totalCategories - passedCategories}** categorieën hebben nog aandacht nodig\n`);
    }

    // Gedetailleerde feedback per categorie
    feedback.push("## 📝 Gedetailleerde Feedback\n");
    
    Object.entries(testResults.categories).forEach(([categoryName, categoryData]) => {
      feedback.push(this.generateCategoryFeedback(categoryName, categoryData));
      feedback.push(""); // Lege regel tussen categorieën
    });

    // Actieplan
    feedback.push(this.generateActionPlan(testResults));

    // Teamwork sectie
    feedback.push(this.generateTeamworkSection());

    // Resources
    feedback.push(this.generateResourcesSection());

    // Persoonlijke boodschap
    feedback.push(this.generatePersonalizedEncouragement(testResults));

    const fullFeedback = feedback.join('\n');

    // Schrijf naar verschillende bestanden
    fs.writeFileSync('FEEDBACK.md', fullFeedback);
    
    // Maak ook een korte versie voor snelle feedback
    const quickFeedback = [
      `# Snelle Feedback - ${progress.percentage}% ✅`,
      "",
      header.message,
      "",
      "**Top 3 actiepunten:**",
      ...this.generateActionPlan(testResults).split('\n').slice(2, 8),
      "",
      this.encouragements[0]
    ].join('\n');
    
    fs.writeFileSync('QUICK_FEEDBACK.md', quickFeedback);

    console.log(`✅ Feedback rapporten gegenereerd!`);
    console.log(`📈 Overall score: ${progress.percentage}% (${progress.earnedPoints}/${progress.totalPossiblePoints} punten)`);
    console.log(`📄 Bestanden: FEEDBACK.md & QUICK_FEEDBACK.md`);
    
    return {
      fullFeedback,
      quickFeedback,
      score: progress.percentage,
      details: progress
    };
  }
}

// Main execution
async function main() {
  try {
    const generator = new GrowthMindsetFeedbackGenerator();
    const result = generator.generateCompleteFeedback();
    
    // Exit code gebaseerd op score voor CI/CD
    const exitCode = result.score >= 70 ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Fout bij genereren feedback:', error.message);
    
    // Fallback feedback bij errors
    const fallbackFeedback = `
# ⚠️ Technische Fout in Feedback Systeem

Er is een technische fout opgetreden bij het genereren van je feedback.
Dit betekent niet dat er iets mis is met jullie code!

## Wat nu te doen:
1. Probeer opnieuw te pushen naar GitHub
2. Controleer of alle bestanden correct zijn uploaded
3. Vraag hulp aan je docent als het probleem blijft

## Handmatige controle punten:
- [ ] HTML bestanden hebben correcte DOCTYPE en structuur
- [ ] CSS bestand is gekoppeld en werkt
- [ ] Code is netjes ingesprongen
- [ ] Commentaren zijn toegevoegd
- [ ] Menu werkt op alle pagina's

**Sorry voor het ongemak! 🛠️**
`;
    
    fs.writeFileSync('FEEDBACK.md', fallbackFeedback);
    process.exit(1);
  }
}

// Run als dit bestand direct wordt uitgevoerd
if (require.main === module) {
  main();
}

module.exports = GrowthMindsetFeedbackGenerator;