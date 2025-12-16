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

// Function to get channel logo based on channel name
function getChannelLogo(channelName) {
    const logoMappings = {
        'fox cricket': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Fox_Cricket_Logo.png/150px-Fox_Cricket_Logo.png',
        'willow tv': 'https://cdn.jsdelivr.net/gh/HelloPeopleTv4you/tv-logo@refs/heads/main/crichd2-runded/38-by-xfireflix.png',
        'star sports': 'https://www.tataplay.com/s3-api/v1/assets/channels/star-sports-1.gif',
        'sony sports': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Sony_Pictures_Network.svg/512px-Sony_Pictures_Network.svg.png',
        'tnt sports': 'https://eu1-prod-images.disco-api.com/2023/07/03/d90c87a7-968b-47b4-bf66-98686bcd043b.png',
        't sports': 'https://yt3.googleusercontent.com/eY6Yt0YDmWSheMmneYNjUD_2N5p8r2nFca9CENifrZ9TugWxrQW24oznjqBJPOFmSs2M6avemg=s900-c-k-c0x00ffffff-no-rj',
        'ptv sports': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_Ad4PNlqneWGKqwJ5ayE57PVczpsXK5a9c7AuD5b2CWYjBS5R_RQjZ8Anu2zq1GxRdcrLkhn8r7HMM0S1s-XOcYIZgfvLOaI41hAOuF8',
        'a sports': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNm9wSyxdIjvlYdwU2-sq1LCSVXkkqXBWBXA&s',
        'ten sports': 'https://cdn.jsdelivr.net/gh/HelloPeopleTv4you/tv-logo@refs/heads/main/crichd2-runded/10-by-xfireflix.png',
        'astro cricket': 'https://cdn.jsdelivr.net/gh/HelloPeopleTv4you/tv-logo@refs/heads/main/crichd2-runded/1745008895589.png',
        'geo sports': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTByiiGGHZsObgvhWaw9Vegy0hJE4ofIyjIr0yW6WIBBKGYNk6TM2acXFbh&s=10',
        'criclife': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE35VK2_hzS658JLoU8wJ3-8ts909wrRXNRPKJcRlltQ&s'
    };
    
    const lowerName = channelName.toLowerCase();
    for (const [key, logo] of Object.entries(logoMappings)) {
        if (lowerName.includes(key)) {
            return logo;
        }
    }
    
    return `https://via.placeholder.com/100x100.png?text=${encodeURIComponent(channelName)}`;
}

// Function to check if URL is a direct playback channel
function isDirectPlaybackChannel(originalUrl) {
    return originalUrl.includes('.html') || 
           originalUrl.includes('wapka.xyz') || 
           originalUrl.includes('embed') || 
           originalUrl.includes('player') ||
           originalUrl.includes('allinonereborn') ||
           originalUrl.includes('tv4go.pages.dev');
}

// Function to convert stream URLs to playable format (simplified)
function convertToPlayableUrl(originalUrl) {
    // If it's already a direct stream URL, return as-is
    if (originalUrl.includes('.m3u8') || originalUrl.includes('live/')) {
        return originalUrl;
    }
    
    // Filter out MPD URLs as they may not be supported by all players
    if (originalUrl.includes('.mpd')) {
        return null; // Return null to exclude MPD channels
    }
    
    // Handle ID11 proxy URLs
    if (originalUrl.includes('tv4wap.github.io/ID11')) {
        return originalUrl;
    }
    
    return originalUrl; // Keep other URLs as-is for direct channels
}

// Extract channel name (after the last comma)
function getName(ext) {
    const parts = ext.split(',');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// Normalize channel name for better deduplication
function normalizeChannelName(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
}
// Simplified function to process all SHUBHAMKUR files
async function processShubhamkurFiles(filename, fileData, output, channelTracker, directChannels) {
    try {
        if (filename === 'tvm3u') {
            // Process M3U file
            const lines = fileData.split("\n");
            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].startsWith("#EXTINF")) continue;
                const ext = lines[i];
                const url = lines[i + 1];
                if (!url || !url.startsWith('http')) continue;

                const name = normalizeChannelName(getName(ext));
                
                if (isDirectPlaybackChannel(url)) {
                    if (!channelTracker["direct"].has(name)) {
                        channelTracker["direct"].add(name);
                        directChannels.push({ name, url, logo: getChannelLogo(name) });
                    }
                    continue;
                }
                
                const playableUrl = convertToPlayableUrl(url);
                if (!playableUrl) {
                    // MPD channels go to direct HTML instead
                    if (!channelTracker["direct"].has(name)) {
                        channelTracker["direct"].add(name);
                        directChannels.push({ name, url, logo: getChannelLogo(name) });
                    }
                    continue;
                }
                
                if (!channelTracker["sports"].has(name)) {
                    channelTracker["sports"].add(name);
                    const modifiedExt = ext.replace(/group-title="[^"]+"/i, 'group-title="Sports"');
                    output["sports"].push(modifiedExt);
                    output["sports"].push(playableUrl);
                }
            }
        } else {
            // Process JSON files (tv, tvid, waptv)
            const jsonData = JSON.parse(fileData);
            
            if (filename === 'waptv') {
                // Process WAPTV format
                for (const channels of Object.values(jsonData)) {
                    if (!Array.isArray(channels)) continue;
                    for (const channel of channels) {
                        if (!channel.channel_name || !channel.url) continue;
                        
                        const name = normalizeChannelName(channel.channel_name);
                        const url = channel.url;
                        
                        if (isDirectPlaybackChannel(url)) {
                            if (!channelTracker["direct"].has(name)) {
                                channelTracker["direct"].add(name);
                                directChannels.push({ 
                                    name, 
                                    url, 
                                    logo: channel.image || getChannelLogo(name) 
                                });
                            }
                            continue;
                        }
                        
                        const playableUrl = convertToPlayableUrl(url);
                        if (!playableUrl) {
                            // MPD channels go to direct HTML instead
                            if (!channelTracker["direct"].has(name)) {
                                channelTracker["direct"].add(name);
                                directChannels.push({ 
                                    name, 
                                    url, 
                                    logo: channel.image || getChannelLogo(name) 
                                });
                            }
                            continue;
                        }
                        
                        if (!channelTracker["sports"].has(name)) {
                            channelTracker["sports"].add(name);
                            const logo = channel.image || getChannelLogo(name);
                            const ext = `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="Sports"`;
                            output["sports"].push(ext);
                            output["sports"].push(playableUrl);
                        }
                    }
                }
            } else if (filename === 'tvid') {
                // Process TVID format
                for (const channel of jsonData) {
                    if (!channel.id || !channel.name) continue;
                    
                    const name = normalizeChannelName(channel.name);
                    const url = `https://tv4wap.github.io/ID11?id=${channel.id}`;
                    
                    if (!channelTracker["sports"].has(name)) {
                        channelTracker["sports"].add(name);
                        const logo = channel.logo || getChannelLogo(name);
                        const ext = `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="Sports"`;
                        output["sports"].push(ext);
                        output["sports"].push(url);
                    }
                }
            } else {
                // Process TV format
                for (const channel of jsonData) {
                    if (!channel.id) continue;
                    
                    const name = normalizeChannelName(channel.id.toUpperCase().replace(/_/g, ' '));
                    const url = channel.m3u8 || channel.mpd || channel.url;
                    if (!url) continue;
                    
                    if (isDirectPlaybackChannel(url)) {
                        if (!channelTracker["direct"].has(name)) {
                            channelTracker["direct"].add(name);
                            directChannels.push({ 
                                name, 
                                url, 
                                logo: channel.logo || getChannelLogo(name) 
                            });
                        }
                        continue;
                    }
                    
                    const playableUrl = convertToPlayableUrl(url);
                    if (!playableUrl) {
                        // MPD channels go to direct HTML instead
                        if (!channelTracker["direct"].has(name)) {
                            channelTracker["direct"].add(name);
                            directChannels.push({ 
                                name, 
                                url, 
                                logo: channel.logo || getChannelLogo(name) 
                            });
                        }
                        continue;
                    }
                    
                    if (!channelTracker["sports"].has(name)) {
                        channelTracker["sports"].add(name);
                        const logo = channel.logo || getChannelLogo(name);
                        const ext = `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="Sports"`;
                        output["sports"].push(ext);
                        output["sports"].push(playableUrl);
                    }
                }
            }
        }
    } catch (error) {
        console.log(`Error processing ${filename}:`, error.message);
    }
}

async function generate() {
    const { data } = await axios.get(PLAYLIST_URL);
    const lines = data.split("\n");

    const output = {};
    const channelTracker = {}; // Track unique channels to avoid duplicates
    const directChannels = []; // Store direct playback channels
    
    Object.keys(FILTERS).forEach(k => {
        output[k] = ["#EXTM3U"];
        channelTracker[k] = new Set(); // Track channel names per category
    });
    channelTracker["direct"] = new Set(); // Track direct playback channels

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
            
            // Check if URL is MPD and redirect to direct channels
            if (url.includes('.mpd')) {
                const name = normalizeChannelName(getName(ext));
                if (!channelTracker["direct"].has(name)) {
                    channelTracker["direct"].add(name);
                    directChannels.push({ name, url, logo: getChannelLogo(name) });
                }
                continue;
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
            
            // Process all SHUBHAMKUR files with simplified function
            await processShubhamkurFiles(filename, fileData, output, channelTracker, directChannels);
        }
    } catch (error) {
        console.log('Warning: Could not fetch Shubhamkur/Tv channels:', error.message);
    }
    // --- End of SHUBHAMKUR processing ---



    // Create output directory if it doesn't exist
    if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
    }

    // Generate direct.html for direct playback channels
    if (directChannels.length > 0) {
        const directHtml = generateDirectChannelsHtml(directChannels);
        fs.writeFileSync('output/direct.html', directHtml);
        console.log(`Generated direct.html with ${directChannels.length} direct playback channels`);
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

// Function to generate HTML for direct playback channels
function generateDirectChannelsHtml(channels) {
    const htmlChannels = channels.map(channel => `
        <div class="channel-card" onclick="window.open('${channel.url}', '_blank')">
            <img src="${channel.logo}" alt="${channel.name}" class="channel-logo" />
            <div class="channel-name">${channel.name}</div>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Direct Playback Channels</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            color: white;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            color: rgba(255,255,255,0.9);
            font-size: 1.1rem;
        }
        
        .channels-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .channel-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            cursor: pointer;
            text-decoration: none;
        }
        
        .channel-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        .channel-logo {
            width: 100%;
            height: 120px;
            object-fit: cover;
            background: #f0f0f0;
        }
        
        .channel-name {
            padding: 15px;
            font-size: 0.9rem;
            font-weight: 600;
            color: #333;
            text-align: center;
            border-top: 1px solid #eee;
        }
        
        .footer {
            text-align: center;
            color: rgba(255,255,255,0.8);
            margin-top: 40px;
        }
        
        @media (max-width: 768px) {
            .channels-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .channel-logo {
                height: 100px;
            }
        }
        
        @media (max-width: 480px) {
            .channels-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 10px;
            }
            
            .header h1 {
                font-size: 1.5rem;
            }
            
            .channel-logo {
                height: 80px;
            }
            
            .channel-name {
                padding: 10px;
                font-size: 0.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Direct Playback Channels</h1>
            <p>Click on any channel to open it in a new tab</p>
        </div>
        
        <div class="channels-grid">
            ${htmlChannels}
        </div>
        
        <div class="footer">
            <p>Total Channels: ${channels.length} | Generated on ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;
}

generate();
