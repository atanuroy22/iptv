import axios from "axios";
import fs from "fs";

const PLAYLIST_URL = "https://iptv-org.github.io/iptv/countries/in.m3u";

// Language Filter Configuration
// To filter by language, comment out the languages you DON'T want
// Example: To only include Hindi and English, comment out all others
// 
// IMPORTANT: 
// - Channels WITHOUT a language tag are ALWAYS included
// - Only channels with explicit non-matching languages are filtered out
//
// Current setting: ALL languages are included
const ALL_LANGS = [
    "hindi",
    "english",
    "tamil",
    "telugu",
    "malayalam",
    "kannada",
    "bengali",
    "marathi",
    "punjabi",
    "gujarati",
    "urdu",
    "assamese",
    "oriya",
    "odia",
    "nepali",
    "sinhala"
];

// Category Filters
// Each category uses the ALL_LANGS filter defined above
// You can customize individual categories by modifying their 'languages' array
const FILTERS = {
    zee: {
        detect: "zee",      // detected using tvg-name
        languages: [...ALL_LANGS]
    },
    sony: {
        detect: "sony",     // detected using tvg-name
        languages: [...ALL_LANGS]
    },
    music: {
        group: ["music"],
        languages: [...ALL_LANGS]
    },
    entertainment: {
        detect: "sun",
        group: ["entertainment"],
        languages: [...ALL_LANGS]
    },
    education: {
        group: ["education", "knowledge"],
        languages: [...ALL_LANGS]
    },
    sports: {
        group: ["sports"],
        languages: [...ALL_LANGS]
    },
    movies: {
        group: ["movie", "cinema"],
        languages: [...ALL_LANGS]
    },
    news: {
        detect: "tv9",
        group: ["news"],
        languages: [...ALL_LANGS]
    },
    kids: {
        group: ["kids", "children"],
        languages: [...ALL_LANGS]
    },
    others: {
        group: [],
        languages: []
    }
};

// Extract tvg-language="X"
function getLanguage(ext) {
    const m = ext.match(/tvg-language="([^"]+)"/i);
    return m ? m[1].toLowerCase() : "";
}

// Extract group-title="X"
function getGroup(ext) {
    const m = ext.match(/group-title="([^"]+)"/i);
    return m ? m[1].toLowerCase() : "";
}

// Extract channel name (after the last comma)
function getName(ext) {
    const parts = ext.split(',');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

async function generate() {
    const { data } = await axios.get(PLAYLIST_URL);
    const lines = data.split("\n");

    const output = {};
    Object.keys(FILTERS).forEach(k => {
        output[k] = ["#EXTM3U"];
    });

    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith("#EXTINF")) continue;

        const ext = lines[i];
        const url = lines[i + 1];

        const low = ext.toLowerCase();
        const lang = getLanguage(low);
        const group = getGroup(low);
        const name = getName(low);

        let placed = false;

        for (const key of Object.keys(FILTERS)) {
            if (key === "others") continue;

            const def = FILTERS[key];

            let match = false;

            // Brand detection first (checks channel name)
            if (def.detect && name.includes(def.detect)) match = true;

            // Group detection fallback (checks group-title attribute)
            if (def.group && def.group.some(g => group.includes(g))) match = true;

            if (!match) continue;

            // Language filtering (if languages array is not empty, filter by language)
            // If array is empty, accept all languages
            if (def.languages.length > 0) {
                // Channels without language tags are accepted
                if (lang && !def.languages.includes(lang)) continue;
            }

            output[key].push(ext);
            output[key].push(url);
            placed = true;
            // this break remove the channels from there category.(if a zee news is in zee then it will not be in news category)
            // break;
        }

        if (!placed) {
            output["others"].push(ext);
            output["others"].push(url);
        }
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
    }

    // Write individual category files
    for (const key of Object.keys(output)) {
        fs.writeFileSync(`output/${key}.m3u`, output[key].join("\n"));
    }

    // Create combined all.m3u with section headers
    const combined = ["#EXTM3U"];

    const categoryOrder = ["zee", "sony", "entertainment", "music", "sports", "movies", "news", "kids", "education", "others"];
    const categoryLabels = {
        zee: "ZEE",
        sony: "SONY",
        entertainment: "ENTERTAINMENT",
        music: "MUSIC",
        sports: "SPORTS",
        movies: "MOVIES",
        news: "NEWS",
        kids: "KIDS",
        education: "EDUCATION",
        others: "OTHERS"
    };

    for (const key of categoryOrder) {
        if (!output[key] || output[key].length <= 1) continue; // Skip empty categories

        combined.push("");
        combined.push(`# ---------------- ${categoryLabels[key]} ----------------`);

        // Add all channels from this category (skip the #EXTM3U header)
        for (let i = 1; i < output[key].length; i++) {
            combined.push(output[key][i]);
        }
    }

    fs.writeFileSync("output/all.m3u", combined.join("\n"));

    console.log("✅ All IPTV category playlists generated successfully!");
    console.log("📁 Individual files: output/zee.m3u, output/sony.m3u, etc.");
    console.log("📄 Combined file: output/all.m3u");
}

generate();
