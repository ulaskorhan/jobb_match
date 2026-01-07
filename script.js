document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Logic
    const tabs = document.querySelectorAll('.nav-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- CV Section Logic ---
    const skillsContainer = document.getElementById('skills-container');
    const skillsInput = document.getElementById('cv-skills-input');
    const cvText = document.getElementById('cv-text');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const motivationalMsg = document.getElementById('motivational-message');

    let skills = [];

    // Skill Tags Handling
    skillsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = skillsInput.value.trim();
            if (val && !skills.includes(val)) {
                addSkill(val);
                skillsInput.value = '';
            }
        } else if (e.key === 'Backspace' && !skillsInput.value) {
            if (skills.length > 0) {
                removeSkill(skills[skills.length - 1]);
            }
        }
    });

    function addSkill(skill) {
        skills.push(skill);
        renderSkills();
        updateProfileStrength();
    }

    function removeSkill(skill) {
        skills = skills.filter(s => s !== skill);
        renderSkills();
        updateProfileStrength();
    }

    function renderSkills() {
        // Clear current tags (keep input)
        const tags = skillsContainer.querySelectorAll('.skill-tag');
        tags.forEach(t => t.remove());

        // Insert new tags before input
        skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.classList.add('skill-tag');
            tag.innerHTML = `
                ${skill}
                <span class="remove-tag">&times;</span>
            `;
            tag.querySelector('.remove-tag').addEventListener('click', () => removeSkill(skill));
            skillsContainer.insertBefore(tag, skillsInput);
        });
    }

    // Profile Strength Calculation
    cvText.addEventListener('input', updateProfileStrength);

    function updateProfileStrength() {
        let score = 5; // Base score

        // Skills score (max 40)
        score += Math.min(skills.length * 5, 40);

        // Text length score (max 55)
        const textLength = cvText.value.length;
        score += Math.min(Math.floor(textLength / 10), 55);

        // Cap at 100
        score = Math.min(score, 100);

        // Update UI
        strengthBar.style.width = `${score}%`;

        if (score < 30) {
            strengthText.textContent = "Startet";
            strengthBar.style.backgroundColor = "#ef4444"; // Red
            motivationalMsg.textContent = "Kom igjen! Legg til flere ferdigheter.";
        } else if (score < 70) {
            strengthText.textContent = "På god vei";
            strengthBar.style.backgroundColor = "#f59e0b"; // Orange
            motivationalMsg.textContent = "Dette ser bra ut! Har du husket alt?";
        } else {
            strengthText.textContent = "Sterk profil!";
            strengthBar.style.backgroundColor = "#22c55e"; // Green
            motivationalMsg.textContent = "Fantastisk! Du er klar til å søke.";
        }
    }


    // --- Analysis Logic ---
    const analyzeBtn = document.getElementById('analyze-btn');
    const jobInput = document.getElementById('job-description-input');

    // Results elements
    const analysisResults = document.getElementById('analysis-results');
    const matchScoreContainer = document.querySelector('.match-score-container');
    const keywordsContainer = document.querySelector('.keywords-container');
    const scoreValue = document.getElementById('score-value');
    const scoreCircle = document.querySelector('.score-circle');
    const foundList = document.getElementById('found-keywords-list');
    const missingList = document.getElementById('missing-keywords-list');

    analyzeBtn.addEventListener('click', performAnalysis);

    function performAnalysis() {
        const jobText = jobInput.value.toLowerCase();
        const cvContent = cvText.value.toLowerCase();
        const skillsContent = skills.join(' ').toLowerCase(); // Use the array of skills
        const combinedCv = cvContent + ' ' + skillsContent;

        if (jobText.length < 50) {
            alert('Vennligst lim inn en lengre stillingsannonse for å analysere.');
            return;
        }

        const keywords = extractKeywords(jobText);
        const matches = [];
        const missing = [];

        keywords.forEach(kw => {
            if (combinedCv.includes(kw)) {
                matches.push(kw);
            } else {
                missing.push(kw);
            }
        });

        const total = keywords.length;
        const matchCount = matches.length;
        const percentage = total === 0 ? 0 : Math.round((matchCount / total) * 100);

        updateUI(percentage, matches, missing);
        document.querySelector('[data-tab="application"]').click();
    }

    function extractKeywords(text) {
        const stopWords = ['og', 'i', 'er', 'som', 'til', 'en', 'av', 'på', 'for', 'at', 'å', 'med', 'de', 'har', 'den', 'ikke', 'om', 'et', 'men', 'så', 'seg', 'vil', 'kan', 'ble', 'var', 'skal', 'vi', 'du', 'dette', 'eller', 'ved', 'fra', 'oss', 'dere', 'vår', 'vårt', 'våre', 'søker', 'etter', 'innen', 'både', 'være', 'ha', 'få', 'bli', 'under', 'over', 'mellom', 'mot', 'ut', 'inn', 'opp', 'ned', 'hvis', 'når', 'hvor', 'hvem', 'hva', 'hvilken', 'hvilke', 'slik', 'derfor', 'fordi', 'selv', 'sammen', 'bare', 'mange', 'alle', 'noen', 'ingen', 'flere', 'mest', 'minst', 'svært', 'ganske', 'veldig', 'mye', 'lite', 'god', 'bra', 'bedre', 'best', 'ny', 'nye', 'gammel', 'gamle', 'stor', 'store', 'liten', 'små', 'høy', 'høye', 'lav', 'lave', 'lang', 'lange', 'kort', 'korte', 'tung', 'tunge', 'lett', 'lette', 'sterk', 'sterke', 'svak', 'svake', 'hard', 'harde', 'myk', 'myke', 'varm', 'varme', 'kald', 'kalde', 'lys', 'lyse', 'mørk', 'mørke', 'farge', 'farger', 'form', 'former', 'tid', 'tider', 'sted', 'steder', 'sak', 'saker', 'ting', 'liv', 'verden', 'år', 'dag', 'dager', 'uke', 'uker', 'måned', 'måneder'];

        const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");
        const words = cleanText.split(' ');

        const frequency = {};
        words.forEach(word => {
            if (word.length > 4 && !stopWords.includes(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });

        const sortedWords = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
        return sortedWords.slice(0, 15);
    }

    function updateUI(score, matches, missing) {
        analysisResults.style.display = 'none';
        matchScoreContainer.style.display = 'block';
        keywordsContainer.style.display = 'block';

        scoreValue.textContent = `${score}%`;
        scoreCircle.style.background = `conic-gradient(var(--accent-color) ${score}%, #e2e8f0 ${score}%)`;

        foundList.innerHTML = matches.map(kw => `<li>${capitalize(kw)}</li>`).join('');
        missingList.innerHTML = missing.map(kw => `<li>${capitalize(kw)}</li>`).join('');
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
