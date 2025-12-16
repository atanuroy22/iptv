import axios from "axios";
import fs from "fs";

const PLAYLIST_URL = "https://iptv-org.github.io/iptv/countries/in.m3u";
const SPORTS_PLAYLIST_URL = "https://iptv-org.github.io/iptv/index.m3u";
const SHUBHAMKUR_BASE_URL = "https://raw.githubusercontent.com/Shubhamkur/Tv/main/";
const SHUBHAMKUR_FILES = ["tv", "tvid", "tvm3u", "waptv"];

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
    star: {
        detect: "star",
        group: ["star"],
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
        detect: "sport", // Added to detect 'sport' in channel name
        group: ["sports", "sport"], // Added 'sport' to group as well
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

const categoryOrder = ["zee", "sony", "star", "entertainment", "music", "sports", "movies", "news", "kids", "education", "others"];
const categoryLabels = {
    zee: "ZEE",
    sony: "SONY",
    star: "STAR",
    entertainment: "ENTERTAINMENT",
    music: "MUSIC",
    sports: "SPORTS",
    movies: "MOVIES",
    news: "NEWS",
    kids: "KIDS",
    education: "EDUCATION",
    others: "OTHERS"
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

// Function to convert various URL formats to playable streams
function convertToPlayableUrl(originalUrl, channelId) {
    // If it's already a direct stream URL, return as-is
    if (originalUrl.includes('.m3u8') || originalUrl.includes('.mpd') || originalUrl.includes('live/')) {
        return originalUrl;
    }
    
    // Handle tv4go pages - convert to proxy stream
    if (originalUrl.includes('tv4go.pages.dev/?id=')) {
        const id = originalUrl.split('id=')[1];
        return `https://tv4wap.github.io/ID11?id=${id}`;
    }
    
    // Handle direct ID references
    if (channelId) {
        return `https://tv4wap.github.io/ID11?id=${channelId}`;
    }
    
    // Handle other proxy services
    if (originalUrl.includes('tv4wap.github.io/ID11')) {
        return originalUrl;
    }
    
    // Handle HTML pages - convert to proxy stream
    if (originalUrl.includes('.html') || originalUrl.includes('wapka.xyz')) {
        // Extract channel ID from HTML URL if possible
        if (channelId) {
            return `https://tv4wap.github.io/ID11?id=${channelId}`;
        }
        // For wapka.xyz pages, try to convert to proxy
        if (originalUrl.includes('wapka.xyz')) {
            return `https://tv4wap.github.io/ID11?id=${originalUrl.split('/').pop().replace('.html', '')}`;
        }
        // For other HTML pages, use a generic proxy approach
        return originalUrl; // Keep as-is for now, may need specific handling
    }
    
    // Handle embed/player pages
    if (originalUrl.includes('embed') || originalUrl.includes('player')) {
        if (channelId) {
            return `https://tv4wap.github.io/ID11?id=${channelId}`;
        }
    }
    
    return originalUrl;
}

// Extract channel name (after the last comma)
function getName(ext) {
    const parts = ext.split(',');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}
async function processM3UFile(fileData, output) {
    const lines = fileData.split("\n");

    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith("#EXTINF")) continue;

        const ext = lines[i];
        const url = lines[i + 1];

        if (!url || !url.startsWith('http')) continue;

        // Convert URL to playable format
        const playableUrl = convertToPlayableUrl(url);
        
        // Force all channels from Shubhamkur M3U into sports category
        const modifiedExt = ext.replace(/group-title="[^"]+"/i, 'group-title="Sports"');
        output["sports"].push(modifiedExt);
        output["sports"].push(playableUrl);
    }
}

async function processTVJSON(fileData, output) {
    let jsonData;
    try {
        jsonData = JSON.parse(fileData);
    } catch (error) {
        console.log('Error parsing TV JSON:', error.message);
        console.log('File data preview:', fileData.substring(0, 200));
        return;
    }

    for (const channel of jsonData) {
        if (!channel.id) continue;
        
        const name = channel.id.toUpperCase().replace(/_/g, ' ');
        let url = '';
        
        // Get the streaming URL from different possible fields
        if (channel.m3u8) {
            url = channel.m3u8;
        } else if (channel.mpd) {
            url = channel.mpd;
        } else if (channel.url) {
            url = channel.url;
        }
        
        if (!url) continue;

        // Create logo URL if not provided
        let logo = channel.logo || `https://via.placeholder.com/100x100.png?text=${encodeURIComponent(name)}`;
        
        // Convert URL to playable format
        const playableUrl = convertToPlayableUrl(url, channel.id);
        
        // Force all channels into sports category
        const ext = `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="Sports"`;
        output["sports"].push(ext);
        output["sports"].push(playableUrl);
    }
}

async function processTVIDJSON(fileData, output) {
    let jsonData;
    try {
        jsonData = JSON.parse(fileData);
    } catch (error) {
        console.log('Error parsing TVID JSON:', error.message);
        console.log('File data preview:', fileData.substring(0, 200));
        return;
    }

    for (const channel of jsonData) {
        if (!channel.id || !channel.name) continue;
        
        const name = channel.name;
        const logo = channel.logo || `https://via.placeholder.com/100x100.png?text=${encodeURIComponent(name)}`;
        
        // Create ID11 proxy URL and convert to playable format
        const originalUrl = `https://tv4wap.github.io/ID11?id=${channel.id}`;
        const playableUrl = convertToPlayableUrl(originalUrl, channel.id);

        // Force all channels into sports category
        const ext = `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="Sports"`;
        output["sports"].push(ext);
        output["sports"].push(playableUrl);
    }
}

async function processWAPTVJSON(fileData, output) {
    let jsonData;
    try {
        jsonData = JSON.parse(fileData);
    } catch (error) {
        console.log('Error parsing WAPTV JSON:', error.message);
        console.log('File data preview:', fileData.substring(0, 200));
        return;
    }

    // Process each match category
    for (const [matchName, channels] of Object.entries(jsonData)) {
        if (!Array.isArray(channels)) continue;
        
        for (const channel of channels) {
            if (!channel.channel_name || !channel.url) continue;
            
            const name = channel.channel_name;
            const logo = channel.image || `https://via.placeholder.com/100x100.png?text=${encodeURIComponent(name)}`;
            const url = channel.url;

            // Convert URL to playable format
            const playableUrl = convertToPlayableUrl(url);

            // Force all channels into sports category
            const ext = `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="Sports"`;
            output["sports"].push(ext);
            output["sports"].push(playableUrl);
        }
    }
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

            // Override group-title for brand-specific categories
            const brandCategories = ["zee", "sony", "star"];
            let modifiedExt = ext;
            if (brandCategories.includes(key)) {
                const brandName = categoryLabels[key]; // Get the brand name from categoryLabels
                modifiedExt = ext.replace(/group-title="[^"]+"/i, `group-title="${brandName}"`);
            }
            output[key].push(modifiedExt);
            output[key].push(url);
            placed = true;
        }

        if (!placed) {
            output["others"].push(ext);
            output["others"].push(url);
        }
    }

    // --- Process SPORTS_PLAYLIST_URL for sports channels only ---
    const { data: globalSportsData } = await axios.get(SPORTS_PLAYLIST_URL);
    const globalSportsLines = globalSportsData.split("\n");

    for (let i = 0; i < globalSportsLines.length; i++) {
        if (!globalSportsLines[i].startsWith("#EXTINF")) continue;

        const ext = globalSportsLines[i];
        const url = globalSportsLines[i + 1];

        const low = ext.toLowerCase();
        const lang = getLanguage(low);
        const group = getGroup(low);
        const name = getName(low);

        const def = FILTERS["sports"];
        let match = false;

        // Brand detection first (checks channel name)
        if (def.detect && name.includes(def.detect)) match = true;

        // Group detection fallback (checks group-title attribute)
        if (def.group && def.group.some(g => group.includes(g))) match = true;

        if (match) {
            // Language filtering (if languages array is not empty, filter by language)
            if (def.languages.length > 0) {
                if (lang && !def.languages.includes(lang)) continue;
            }
            output["sports"].push(ext);
            output["sports"].push(url);
        }
    }
    // --- End of SPORTS_PLAYLIST_URL processing ---

    // --- Process all SHUBHAMKUR files for comprehensive channel collection ---
    try {
        for (const filename of SHUBHAMKUR_FILES) {
            const fileUrl = SHUBHAMKUR_BASE_URL + filename;
            console.log(`Processing Shubhamkur file: ${filename}`);
            
            const response = await axios.get(fileUrl);
            const fileData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            
            if (filename === 'tvm3u') {
                // Process M3U file (existing logic)
                await processM3UFile(fileData, output);
            } else if (filename === 'tv') {
                // Process JSON file with direct streaming URLs
                await processTVJSON(fileData, output);
            } else if (filename === 'tvid') {
                // Process JSON file with ID11 proxy URLs
                await processTVIDJSON(fileData, output);
            } else if (filename === 'waptv') {
                // Process WAPTV JSON format
                await processWAPTVJSON(fileData, output);
            }
        }
    } catch (error) {
        console.log('Warning: Could not fetch Shubhamkur/Tv channels:', error.message);
    }
    // --- End of SHUBHAMKUR processing ---



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
