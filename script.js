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
        onCvChanged();
    }

    function removeSkill(skill) {
        skills = skills.filter(s => s !== skill);
        renderSkills();
        onCvChanged();
    }

    function renderSkills() {
        // Clear current tags (keep input)
        const tags = skillsContainer.querySelectorAll('.skill-tag');
        tags.forEach(t => t.remove());

        // Insert new tags before input.
        // textContent (not innerHTML) so the skill is always shown as plain text.
        skills.forEach(skill => {
            const tag = document.createElement('div');
            tag.classList.add('skill-tag');
            tag.textContent = skill;

            const removeBtn = document.createElement('span');
            removeBtn.classList.add('remove-tag');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => removeSkill(skill));

            tag.appendChild(removeBtn);
            skillsContainer.insertBefore(tag, skillsInput);
        });
    }

    // Runs every time the CV text or the skills change
    cvText.addEventListener('input', onCvChanged);

    function onCvChanged() {
        updateProfileStrength();
        // If the user has already analysed a job ad, update the result right away
        if (hasAnalysed) {
            runAnalysis();
        }
    }

    // Profile Strength Calculation
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

    // Becomes true after the first successful click on "Analyser Annonse"
    let hasAnalysed = false;

    analyzeBtn.addEventListener('click', () => {
        if (jobInput.value.length < 50) {
            alert('Vennligst lim inn en lengre stillingsannonse for å analysere.');
            return;
        }

        hasAnalysed = true;
        runAnalysis();
        document.querySelector('[data-tab="application"]').click();
    });

    function runAnalysis() {
        const keywords = extractKeywords(jobInput.value);

        // All words from the CV text and the skills, split the same way as the job ad.
        // A Set lets us check "is this exact word in the CV?" quickly.
        const cvWords = new Set(splitIntoWords(cvText.value + ' ' + skills.join(' ')));

        // Whole-word match: "java" only matches the word "java", not "javascript"
        const matches = keywords.filter(kw => cvWords.has(kw));
        const missing = keywords.filter(kw => !cvWords.has(kw));

        const total = keywords.length;
        const percentage = total === 0 ? 0 : Math.round((matches.length / total) * 100);

        updateUI(percentage, matches, missing);
    }

    // Turns text into a list of lowercase words.
    // Everything that is NOT a letter, a digit, "+" or "#" counts as a separator,
    // so spaces, line breaks, tabs and punctuation all split words.
    // \p{L} = any letter (including æ, ø, å, é), \p{N} = any digit.
    // The "u" flag at the end is needed for \p{...} to work.
    // filter removes empty strings that appear if the text starts or ends with a separator.
    function splitIntoWords(text) {
        return text
            .toLowerCase()
            .split(/[^\p{L}\p{N}+#]+/u)
            .filter(word => word !== '');
    }

    function extractKeywords(text) {
        const stopWords = ['og', 'i', 'er', 'som', 'til', 'en', 'av', 'på', 'for', 'at', 'å', 'med', 'de', 'har', 'den', 'ikke', 'om', 'et', 'men', 'så', 'seg', 'vil', 'kan', 'ble', 'var', 'skal', 'vi', 'du', 'dette', 'eller', 'ved', 'fra', 'oss', 'dere', 'vår', 'vårt', 'våre', 'søker', 'etter', 'innen', 'både', 'være', 'ha', 'få', 'bli', 'under', 'over', 'mellom', 'mot', 'ut', 'inn', 'opp', 'ned', 'hvis', 'når', 'hvor', 'hvem', 'hva', 'hvilken', 'hvilke', 'slik', 'derfor', 'fordi', 'selv', 'sammen', 'bare', 'mange', 'alle', 'noen', 'ingen', 'flere', 'mest', 'minst', 'svært', 'ganske', 'veldig', 'mye', 'lite', 'god', 'bra', 'bedre', 'best', 'ny', 'nye', 'gammel', 'gamle', 'stor', 'store', 'liten', 'små', 'høy', 'høye', 'lav', 'lave', 'lang', 'lange', 'kort', 'korte', 'tung', 'tunge', 'lett', 'lette', 'sterk', 'sterke', 'svak', 'svake', 'hard', 'harde', 'myk', 'myke', 'varm', 'varme', 'kald', 'kalde', 'lys', 'lyse', 'mørk', 'mørke', 'farge', 'farger', 'form', 'former', 'tid', 'tider', 'sted', 'steder', 'sak', 'saker', 'ting', 'liv', 'verden', 'år', 'dag', 'dager', 'uke', 'uker', 'måned', 'måneder'];

        const words = splitIntoWords(text);

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
        // Hide the placeholder text and show the score and keyword lists
        analysisResults.style.display = 'none';
        matchScoreContainer.style.display = 'block';
        keywordsContainer.style.display = 'block';

        scoreValue.textContent = `${score}%`;
        scoreCircle.style.background = `conic-gradient(var(--accent-color) ${score}%, #e2e8f0 ${score}%)`;

        fillList(foundList, matches);
        fillList(missingList, missing);
    }

    // Empties a <ul> and adds one <li> per word, using textContent (not innerHTML)
    // so words from the job ad are always shown as plain text.
    function fillList(listElement, words) {
        listElement.textContent = '';
        words.forEach(word => {
            const li = document.createElement('li');
            li.textContent = capitalize(word);
            listElement.appendChild(li);
        });
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
