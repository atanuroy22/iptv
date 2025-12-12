# Custom IPTV Playlist Generator

Automatically generates custom IPTV M3U playlists (Zee, Sony, Sports, Entertainment, Education, News, Kids, Music, and Others) by pulling the latest data from iptv-org and sorting channels into relevant categories. Channels can now appear in multiple categories.

The playlists refresh automatically every 4 hours using GitHub Actions, so your M3U links always stay up-to-date without manual work.

------------------------------------
FEATURES
------------------------------------
- Fetches the latest India playlist:
  https://iptv-org.github.io/iptv/countries/in.m3u8

- Categorizes channels into:
  • Zee
  • Sony
  • Entertainment
  • Sports
  • Movies
  • News
  • Kids
  • Music
  • Education
  • Others

- Creates TWO types of playlists:
  1. Separate .m3u files for each category (in output/ folder)
  2. A combined all.m3u file with all channels organized by category sections

- Fully automated updates using GitHub Actions
- Built using Node.js (JavaScript)

<!-- ------------------------------------
FOLDER STRUCTURE
------------------------------------
- iptv/
  - generate.js
  - package.json
  - output/
    - zee.m3u           (Zee channels)
    - sony.m3u          (Sony channels)
    - star.m3u          (Star channels)
    - sports.m3u        (Sports channels)
    - entertainment.m3u (Entertainment channels)
    - education.m3u     (Education channels)
    - news.m3u          (News channels)
    - movies.m3u        (Movies channels)
    - kids.m3u          (Kids channels)
    - music.m3u         (Music channels)
    - others.m3u        (Other channels)
    - all.m3u           (ALL channels with category headers)
  - .github/
    - workflows/
      - auto-update.yml -->

<!-- ------------------------------------
REQUIREMENTS
------------------------------------
- Node.js 18 or higher
- GitHub repository
- GitHub Actions enabled

------------------------------------
LOCAL INSTALLATION
------------------------------------
git clone https://github.com/atanuroy22/iptv
cd iptv
npm install
npm start

The generated playlists will appear inside the output/ folder.

------------------------------------
AUTOMATIC UPDATES (GITHUB ACTIONS)
------------------------------------
The included GitHub workflow:

- Runs every 4 hours
- Downloads the latest IPTV playlist
- Regenerates all category playlists
- Automatically commits and pushes updates

You can also run it manually from:
GitHub → Actions → Auto Generate IPTV → Run workflow -->

------------------------------------
DIRECT PLAYLIST URLs
------------------------------------

INDIVIDUAL CATEGORY PLAYLISTS:

Zee:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/zee.m3u

Sony:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/sony.m3u

Star:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/star.m3u

Sports:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/sports.m3u

Entertainment:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/entertainment.m3u

Movies:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/movies.m3u

News:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/news.m3u

Kids:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/kids.m3u

Music:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/music.m3u

Education:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/education.m3u

Others:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/others.m3u

COMBINED PLAYLIST (All channels with category sections):

All Channels:
https://raw.githubusercontent.com/atanuroy22/iptv/main/output/all.m3u

The combined all.m3u file contains ALL channels organized into sections like:
<br>---------------- ZEE ---------------- <br>
---------------- SONY ---------------- <br>
---------------- STAR ---------------- <br>
---------------- ENTERTAINMENT ---------------- <br>
etc.

These URLs auto-refresh every 4 hours.

<!-- ------------------------------------
CUSTOMIZATION
------------------------------------
You can edit generate.js to:
- Add or change categories
- Add language-based filtering
- Change detection rules
- Modify output formatting

More features can be added easily.

------------------------------------
LANGUAGE FILTERING
------------------------------------
The generator supports language-based filtering for all categories.

Currently, ALL supported languages are included:
• Hindi
• English
• Tamil
• Telugu
• Malayalam
• Kannada
• Bengali
• Marathi
• Punjabi
• Gujarati
• Urdu
• Assamese
• Oriya/Odia
• Nepali
• Sinhala

HOW TO FILTER BY LANGUAGE:

1. Open generate.js
2. Find the ALL_LANGS array (around line 9)
3. Comment out languages you DON'T want:

Example - Only Hindi and English:
```javascript
const ALL_LANGS = [
    "hindi",
    "english",
    // "tamil",
    // "telugu",
    // ... etc
];
``` -->

<!-- 4. Run: npm start

NOTE: 
- Channels WITHOUT a language tag are always included
- Only channels with explicit non-matching languages are filtered out
- This applies to ALL categories (Zee, Sony, Sports, etc.) -->

------------------------------------
LICENSE
------------------------------------
MIT License – free to use and modify.
