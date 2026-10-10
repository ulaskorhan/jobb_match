# Jobbsøkerhjelpen (jobb_match)

A small web app that helps job seekers compare their CV with a job ad. Paste a job ad, add your skills and CV text, and the app shows which keywords from the ad your profile covers and which ones may be missing. The interface is in Norwegian.

## How it works
1. **Stillingsannonse:** paste the job ad and click *Analyser Annonse*.
2. **CV & Profil:** add key skills as tags and paste your CV text. A meter shows how complete your profile is.
3. **Søknad:** write your cover letter while the analysis panel shows a match score, keywords found and keywords you may be missing.

The analysis runs entirely in the browser with plain JavaScript. No external APIs, and no data is stored. It picks the 15 most frequent meaningful words in the ad (filtering out common Norwegian stop words) and checks them against your CV and skills.

## Run it
Open `index.html` in a browser.

## Built with
HTML, CSS and JavaScript, developed with the help of AI coding tools.

## Ideas for improvement
- Recognise multi-word terms such as "Microsoft 365"
- Whole-word matching to avoid false matches (e.g. "java" in "javascript")
- English language support
- For now the user have to copy paste the job announcement text. An improvement can be just copy paste of the announcement web page link. 
