import axios from "axios";
import fs from "fs";

const PLAYLIST_URL = "https://iptv-org.github.io/iptv/countries/in.m3u";
const SPORTS_PLAYLIST_URL = "https://iptv-org.github.io/iptv/index.m3u";
const TAMIL_PLAYLIST_URL = "https://iptv-org.github.io/iptv/languages/tam.m3u";
const TELUGU_PLAYLIST_URL = "https://iptv-org.github.io/iptv/languages/tel.m3u";
const tamilLocalUrl =
  "https://raw.githubusercontent.com/amazeyourself/tamil-local-iptv/main/channels.m3u";
const SHUBHAMKUR_BASE_URL =
  "https://raw.githubusercontent.com/Shubhamkur/Tv/main/";
const SHUBHAMKUR_FILES = ["waptv"];
const CRICHD_API_URL = "https://crichd2api.teachub.workers.dev/";
const CRICHD_PLAYER_BASE =
  "https://calm-sun-04d5.rojoni9589.workers.dev/indexind?dtv=https://crichd1.teachub.workers.dev/?v=";

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
  "sinhala",
];

// Category Filters
// Each category uses the ALL_LANGS filter defined above
// You can customize individual categories by modifying their 'languages' array
const FILTERS = {
  zee: {
    detect: "zee", // detected using tvg-name
    languages: [...ALL_LANGS],
  },
  sony: {
    detect: "sony", // detected using tvg-name
    languages: [...ALL_LANGS],
  },
  star: {
    detect: "star",
    group: ["star"],
    languages: [...ALL_LANGS],
  },
  music: {
    group: ["music"],
    languages: [...ALL_LANGS],
  },
  entertainment: {
    detect: "sun",
    group: ["entertainment", "education", "knowledge"],
    languages: [...ALL_LANGS],
  },
  sports: {
    detect: "sport", // Added to detect 'sport' in channel name
    group: ["sports", "sport"], // Added 'sport' to group as well
    languages: [...ALL_LANGS],
  },
  movies: {
    group: ["movie", "cinema"],
    languages: [...ALL_LANGS],
  },
  news: {
    detect: "tv9",
    group: ["news"],
    languages: [...ALL_LANGS],
  },
  kids: {
    group: ["kids", "children", "cartoon", "animation"],
    languages: [...ALL_LANGS],
  },
  others: {
    group: [],
    languages: [],
  },
};

const categoryOrder = [
  "zee",
  "sony",
  "star",
  "entertainment",
  "music",
  "sports",
  "movies",
  "news",
  "kids",
  "tamil",
  "telugu",
  "others",
];
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
  others: "OTHERS",
  tamil: "TAMIL",
  telugu: "TELUGU",
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
    "fox cricket":
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Fox_Cricket_Logo.png/150px-Fox_Cricket_Logo.png",
    "willow tv":
      "https://cdn.jsdelivr.net/gh/HelloPeopleTv4you/tv-logo@refs/heads/main/crichd2-runded/38-by-xfireflix.png",
    "star sports":
      "https://www.tataplay.com/s3-api/v1/assets/channels/star-sports-1.gif",
    "sony sports":
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Sony_Pictures_Network.svg/512px-Sony_Pictures_Network.svg.png",
    "tnt sports":
      "https://eu1-prod-images.disco-api.com/2023/07/03/d90c87a7-968b-47b4-bf66-98686bcd043b.png",
    "t sports":
      "https://yt3.googleusercontent.com/eY6Yt0YDmWSheMmneYNjUD_2N5p8r2nFca9CENifrZ9TugWxrQW24oznjqBJPOFmSs2M6avemg=s900-c-k-c0x00ffffff-no-rj",
    "ptv sports":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_Ad4PNlqneWGKqwJ5ayE57PVczpsXK5a9c7AuD5b2CWYjBS5R_RQjZ8Anu2zq1GxRdcrLkhn8r7HMM0S1s-XOcYIZgfvLOaI41hAOuF8",
    "a sports":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNm9wSyxdIjvlYdwU2-sq1LCSVXkkqXBWBXA&s",
    "ten sports":
      "https://cdn.jsdelivr.net/gh/HelloPeopleTv4you/tv-logo@refs/heads/main/crichd2-runded/10-by-xfireflix.png",
    "ten cricket":
      "https://cdn.jsdelivr.net/gh/HelloPeopleTv4you/tv-logo@refs/heads/main/crichd2-runded/10-by-xfireflix.png",
    "astro cricket":
      "https://cdn.jsdelivr.net/gh/HelloPeopleTv4you/tv-logo@refs/heads/main/crichd2-runded/1745008895589.png",
    "geo sports":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTByiiGGHZsObgvhWaw9Vegy0hJE4ofIyjIr0yW6WIBBKGYNk6TM2acXFbh&s=10",
    criclife:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE35VK2_hzS658JLoU8wJ3-8ts909wrRXNRPKJcRlltQ&s",
    "zee cinema":
      "https://img.favpng.com/22/7/13/zee-cinema-zee-tv-high-definition-television-zee-entertainment-enterprises-png-favpng-KHDwBVhTwzz18Sh6EeZGTisrV.jpg",
    "and pictures":
      "https://imagesdishtvd2h.whatsonindia.com/dasimages/channel/landscape/360x270/HivVrdof.png",
    "star select":
      "https://upload.wikimedia.org/wikipedia/en/thumb/5/50/Star_Selects_logo.svg/300px-Star_Selects_logo.svg.png",
    "zee tv":
      "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Zee_TV_logo.svg/300px-Zee_TV_logo.svg.png",
    "sony tv":
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Sony_Pictures_Network.svg/512px-Sony_Pictures_Network.svg.png",
    "star plus":
      "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Star_Plus.svg/300px-Star_Plus.svg.png",
    "colors tv":
      "https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/Colors_TV_logo.svg/300px-Colors_TV_logo.svg.png",
    mtv: "https://upload.wikimedia.org/wikipedia/en/thumb/6/69/MTV_2021_logo.svg/300px-MTV_2021_logo.svg.png",
  };

  const lowerName = channelName.toLowerCase();
  for (const [key, logo] of Object.entries(logoMappings)) {
    if (lowerName.includes(key)) {
      return logo;
    }
  }

  // Generate a better placeholder with channel name initials and color
  const initials = channelName
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .join("")
    .substring(0, 3);
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
  ];
  const colorIndex =
    channelName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  const bgColor = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=${bgColor.replace("#", "")}&color=fff&size=100&bold=true`;
}

// Function to check if URL is a direct playback channel
function isDirectPlaybackChannel(originalUrl) {
  return (
    originalUrl.includes(".html") ||
    originalUrl.includes("wapka.xyz") ||
    originalUrl.includes("embed") ||
    originalUrl.includes("player") ||
    originalUrl.includes("allinonereborn") ||
    originalUrl.includes("tv4go.pages.dev") ||
    originalUrl.includes("tv4wap.github.io/ID")
  );
}

// Function to convert stream URLs to playable format (simplified)
function convertToPlayableUrl(originalUrl) {
  // If it's already a direct stream URL, return as-is
  if (originalUrl.includes(".m3u8") || originalUrl.includes("live/")) {
    return originalUrl;
  }

  // Filter out MPD URLs as they may not be supported by all players
  if (originalUrl.includes(".mpd")) {
    return null; // Return null to exclude MPD channels
  }

  // Filter out proxy URLs - they should go to direct HTML instead
  if (originalUrl.includes("tv4wap.github.io/ID")) {
    return null; // Return null to move proxy channels to direct HTML
  }

  return originalUrl; // Keep other URLs as-is for direct channels
}

// Extract channel name (after the last comma)
function getName(ext) {
  const parts = ext.split(",");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// Normalize channel name for better deduplication
function normalizeChannelName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

function getM3uAttrValue(ext, attrName) {
  const m = ext.match(new RegExp(`${attrName}="([^"]*)"`, "i"));
  return m ? m[1] : "";
}

function getM3uDisplayName(ext) {
  const idx = ext.indexOf(",");
  return idx >= 0 ? ext.slice(idx + 1).trim() : "";
}

function parseM3uEntries(lines) {
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const ext = lines[i];
    if (!ext || !ext.startsWith("#EXTINF")) continue;
    const url = (lines[i + 1] || "").trim();
    if (!url) continue;
    entries.push({ ext, url });
  }
  return entries;
}

function inferCategoryByGroupTitle(m3uEntries, existingById) {
  const countsByGroup = new Map();
  for (const { ext, url } of m3uEntries) {
    if (!url.startsWith("https://")) continue;
    const id = getM3uAttrValue(ext, "tvg-id").trim();
    if (!id) continue;
    const existing = existingById.get(id);
    if (!existing) continue;
    const groupTitle = getM3uAttrValue(ext, "group-title").trim();
    if (!groupTitle) continue;
    const category =
      typeof existing.category === "number" ? existing.category : 0;
    let groupCounts = countsByGroup.get(groupTitle);
    if (!groupCounts) {
      groupCounts = new Map();
      countsByGroup.set(groupTitle, groupCounts);
    }
    groupCounts.set(category, (groupCounts.get(category) || 0) + 1);
  }

  const inferred = new Map();
  for (const [groupTitle, groupCounts] of countsByGroup.entries()) {
    let bestCategory = 0;
    let bestCount = -1;
    for (const [category, count] of groupCounts.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestCategory = category;
      }
    }
    inferred.set(groupTitle, bestCategory);
  }
  return inferred;
}

function directIdFromUrl(url) {
  const b64 = Buffer.from(String(url), "utf8")
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `direct:${b64.slice(0, 80)}`;
}

function inferIsHdFromName(name) {
  const n = String(name || "").toLowerCase();
  if (!n) return false;
  if (/\b(720|1080|1440|2160)p\b/.test(n)) return true;
  if (/\b(4k|uhd)\b/.test(n)) return true;
  if (/\bhd\b/.test(n) && !/\b(sd|480p|360p|240p|576p)\b/.test(n)) return true;
  return false;
}

function inferCategoryFromGroupTitle(groupTitle) {
  const g = String(groupTitle || "")
    .toLowerCase()
    .trim();
  if (!g) return 0;
  if (g === "news") return 12;
  if (g === "sports") return 8;
  if (g === "kids") return 7;
  if (g === "movies") return 6;
  if (g === "entertainment") return 5;
  return 0;
}

function writeCustomChannelsJsonFromM3uLines(m3uLines, directChannels = []) {
  const outputPath = "output/custom-channels.json";

  let existingChannels = [];
  try {
    if (fs.existsSync(outputPath)) {
      const raw = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.channels)) {
        existingChannels = parsed.channels;
      }
    }
  } catch {
    existingChannels = [];
  }

  const existingById = new Map();
  for (const ch of existingChannels) {
    if (ch && typeof ch.id === "string" && ch.id.trim()) {
      existingById.set(ch.id, ch);
    }
  }
  const existingUrls = new Set(
    existingChannels
      .map((c) => (c && typeof c.url === "string" ? c.url : ""))
      .filter(Boolean)
  );

  const m3uEntries = parseM3uEntries(m3uLines);
  const inferredCategories = inferCategoryByGroupTitle(
    m3uEntries,
    existingById
  );

  const channels = Array.isArray(existingChannels) ? existingChannels : [];
  const usedIds = new Set(existingById.keys());

  for (const { ext, url } of m3uEntries) {
    if (!url.startsWith("https://")) continue;

    const id = getM3uAttrValue(ext, "tvg-id").trim();
    if (!id) continue;

    const existing = existingById.get(id);
    const groupTitle = getM3uAttrValue(ext, "group-title").trim();
    const displayName = getM3uDisplayName(ext);
    const tvgLogo = getM3uAttrValue(ext, "tvg-logo").trim();
    const categoryFromGroup = inferCategoryFromGroupTitle(groupTitle);
    const inferredCategory =
      categoryFromGroup !== 0
        ? categoryFromGroup
        : inferredCategories.get(groupTitle) ?? 0;
    const inferredIsHd = inferIsHdFromName(displayName || id);

    if (existing) {
      if (
        typeof existing.url === "string" &&
        !existing.url.startsWith("https://")
      ) {
        existing.url = url;
      }
      if (typeof existing.name !== "string" || !existing.name.trim()) {
        existing.name = displayName || id;
      }
      if (
        (typeof existing.logo_url !== "string" || !existing.logo_url.trim()) &&
        tvgLogo
      ) {
        existing.logo_url = tvgLogo;
      }
      if (
        (typeof existing.category !== "number" || existing.category === 0) &&
        inferredCategory !== 0
      ) {
        existing.category = inferredCategory;
      }
      if (
        typeof existing.is_hd !== "boolean" ||
        (existing.is_hd === false &&
          inferIsHdFromName(existing.name || displayName || id))
      ) {
        existing.is_hd = inferIsHdFromName(existing.name || displayName || id);
      }
      continue;
    }

    if (usedIds.has(id)) continue;
    usedIds.add(id);

    channels.push({
      id,
      name: displayName || id,
      url,
      logo_url: tvgLogo || "",
      category: inferredCategory,
      language: 0,
      is_hd: inferredIsHd,
    });
    existingUrls.add(url);
  }

  for (const ch of directChannels) {
    if (!ch || typeof ch.url !== "string") continue;
    const url = ch.url.trim();
    if (!url || !url.startsWith("http")) continue;
    if (existingUrls.has(url)) continue;

    const id = directIdFromUrl(url);
    const existing = existingById.get(id);
    const name =
      ch.name && typeof ch.name === "string" && ch.name.trim()
        ? ch.name.trim()
        : id;
    const logo_url =
      ch.logo && typeof ch.logo === "string" && ch.logo.trim()
        ? ch.logo.trim()
        : "";
    const inferredIsHd = inferIsHdFromName(name);

    if (existing) {
      if (typeof existing.url === "string" && existing.url !== url) {
        existing.url = url;
      }
      if (typeof existing.name !== "string" || !existing.name.trim()) {
        existing.name = name;
      }
      if (
        (typeof existing.logo_url !== "string" || !existing.logo_url.trim()) &&
        logo_url
      ) {
        existing.logo_url = logo_url;
      }
      if (
        typeof existing.is_hd !== "boolean" ||
        (existing.is_hd === false && inferredIsHd)
      ) {
        existing.is_hd = inferredIsHd;
      }
      existingUrls.add(url);
      continue;
    }

    if (usedIds.has(id)) continue;
    usedIds.add(id);

    channels.push({
      id,
      name,
      url,
      logo_url,
      category: 0,
      language: 0,
      is_hd: inferredIsHd,
    });
    existingUrls.add(url);
  }

  fs.writeFileSync(outputPath, JSON.stringify({ channels }, null, 2));
}
// Simplified function to process all SHUBHAMKUR files
async function processShubhamkurFiles(
  filename,
  fileData,
  output,
  channelTracker,
  directChannels
) {
  try {
    if (filename === "tvm3u") {
      // Process M3U file
      const lines = fileData.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith("#EXTINF")) continue;
        const ext = lines[i];
        const url = lines[i + 1];
        if (!url || !url.startsWith("http")) continue;

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

        // For SHUBHAMKUR sources, add all channels to direct HTML only
        if (!channelTracker["direct"].has(name)) {
          channelTracker["direct"].add(name);
          // For direct browser playback, use the original URL
          directChannels.push({ name, url: url, logo: getChannelLogo(name) });
        }
      }
    } else {
      // Process JSON files (tv, tvid, waptv)
      const jsonData = JSON.parse(fileData);

      if (filename === "waptv") {
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
                  logo: channel.image || getChannelLogo(name),
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
                  logo: channel.image || getChannelLogo(name),
                });
              }
              continue;
            }

            // For SHUBHAMKUR sources, add all channels to direct HTML only
            if (!channelTracker["direct"].has(name)) {
              channelTracker["direct"].add(name);
              const logo = channel.image || getChannelLogo(name);
              // For direct browser playback, use the original URL
              directChannels.push({
                name,
                url: url,
                logo,
              });
            }
          }
        }
      } else if (filename === "tvid") {
        // Process TVID format
        for (const channel of jsonData) {
          if (!channel.id || !channel.name) continue;

          const name = normalizeChannelName(channel.name);
          const url = `https://tv4wap.github.io/ID11?id=${channel.id}`;

          // Check if this is a proxy URL and move to direct channels
          if (!channelTracker["direct"].has(name)) {
            channelTracker["direct"].add(name);
            directChannels.push({
              name,
              url,
              logo: channel.logo || getChannelLogo(name),
            });
          }
        }
      } else {
        // Process TV format
        for (const channel of jsonData) {
          if (!channel.id) continue;

          const name = normalizeChannelName(
            channel.id.toUpperCase().replace(/_/g, " ")
          );
          const url = channel.m3u8 || channel.mpd || channel.url;
          if (!url) continue;

          if (isDirectPlaybackChannel(url)) {
            if (!channelTracker["direct"].has(name)) {
              channelTracker["direct"].add(name);
              directChannels.push({
                name,
                url,
                logo: channel.logo || getChannelLogo(name),
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
                logo: channel.logo || getChannelLogo(name),
              });
            }
            continue;
          }

          // For SHUBHAMKUR sources, add all channels to direct HTML only
          if (!channelTracker["direct"].has(name)) {
            channelTracker["direct"].add(name);
            const logo = channel.logo || getChannelLogo(name);
            // For direct browser playback, use the original URL
            directChannels.push({
              name,
              url: url,
              logo,
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(`Error processing ${filename}:`, error.message);
  }
}

// Function to process Crichd channels
async function processCrichdChannels(directChannels, channelTracker) {
  try {
    console.log(`Fetching Crichd channels from: ${CRICHD_API_URL}`);
    const { data: responseData } = await axios.get(CRICHD_API_URL);

    if (
      !responseData ||
      !responseData.data ||
      !Array.isArray(responseData.data)
    ) {
      console.log("Invalid Crichd API response format");
      return;
    }

    for (const match of responseData.data) {
      if (!match.channels || !Array.isArray(match.channels)) continue;

      for (const channel of match.channels) {
        if (!channel.id || !channel.name) continue;

        const name = normalizeChannelName(channel.name);
        const url = CRICHD_PLAYER_BASE + channel.id;

        if (!channelTracker["direct"].has(name)) {
          channelTracker["direct"].add(name);
          directChannels.push({
            name: channel.name, // Keep original name for display
            url: url,
            logo: getChannelLogo(channel.name),
          });
        }
      }
    }
    console.log(
      `Added Crichd channels. Total direct channels: ${directChannels.length}`
    );
  } catch (error) {
    console.log("Warning: Could not fetch Crichd channels:", error.message);
  }
}

async function generate() {
  const { data } = await axios.get(PLAYLIST_URL);
  const lines = data.split("\n");

  const output = {};
  const channelTracker = {}; // Track unique channels to avoid duplicates
  const directChannels = []; // Store direct playback channels

  Object.keys(FILTERS).forEach((k) => {
    output[k] = ["#EXTM3U"];
    channelTracker[k] = new Set(); // Track channel names per category
  });
  // Initialize Tamil output separately (sourced from language playlist)
  output["tamil"] = ["#EXTM3U"];
  // Initialize Telugu output separately (sourced from language playlist)
  output["telugu"] = ["#EXTM3U"];
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
      if (def.group && def.group.some((g) => group.includes(g))) match = true;

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
        if (/group-title="[^"]+"/i.test(ext)) {
          modifiedExt = ext.replace(
            /group-title="[^"]+"/i,
            `group-title="${brandName}"`
          );
        } else {
          modifiedExt = ext.replace(
            /^(#EXTINF[^,]*)/,
            `$1 group-title="${brandName}"`
          );
        }
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
    if (def.group && def.group.some((g) => group.includes(g))) match = true;

    if (match) {
      // Language filtering (if languages array is not empty, filter by language)
      if (def.languages.length > 0) {
        if (lang && !def.languages.includes(lang)) continue;
      }

      // Check if URL is proxy URL or MPD and redirect to direct channels
      if (url.includes(".mpd") || url.includes("tv4wap.github.io/ID")) {
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

  // --- Process SPORTS_PLAYLIST_URL for kids channels only ---
  for (let i = 0; i < globalSportsLines.length; i++) {
    if (!globalSportsLines[i].startsWith("#EXTINF")) continue;

    const ext = globalSportsLines[i];
    const url = globalSportsLines[i + 1];

    const low = ext.toLowerCase();
    const lang = getLanguage(low);
    const group = getGroup(low);
    const name = getName(low);

    const def = FILTERS["kids"];
    let match = false;

    // Group detection (Kids/Children/Cartoon/Animation)
    if (def.group && def.group.some((g) => group.includes(g))) match = true;

    // Basic name hint if needed
    if (!match && name.includes("kid")) match = true;

    if (match) {
      // Language filtering
      if (def.languages.length > 0) {
        if (lang && !def.languages.includes(lang)) continue;
      }

      // Redirect proxy/MPD to direct channels
      if (url.includes(".mpd") || url.includes("tv4wap.github.io/ID")) {
        const n = normalizeChannelName(getName(ext));
        if (!channelTracker["direct"].has(n)) {
          channelTracker["direct"].add(n);
          directChannels.push({ name: n, url, logo: getChannelLogo(n) });
        }
        continue;
      }

      output["kids"].push(ext);
      output["kids"].push(url);
    }
  }
  // --- End of KIDS processing ---

  // --- Process all SHUBHAMKUR files for comprehensive channel collection ---
  try {
    for (const filename of SHUBHAMKUR_FILES) {
      const fileUrl = SHUBHAMKUR_BASE_URL + filename;
      console.log(`Processing Shubhamkur file: ${filename}`);

      const response = await axios.get(fileUrl);
      const fileData =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);

      // Process all SHUBHAMKUR files with simplified function
      await processShubhamkurFiles(
        filename,
        fileData,
        output,
        channelTracker,
        directChannels
      );
    }
  } catch (error) {
    console.log(
      "Warning: Could not fetch Shubhamkur/Tv channels:",
      error.message
    );
  }
  // --- End of SHUBHAMKUR processing ---

  // --- Process Crichd channels ---
  await processCrichdChannels(directChannels, channelTracker);
  // --- End of Crichd processing ---

  // --- Fetch and append Tamil language playlist ---
  try {
    console.log(`Fetching Tamil channels from: ${TAMIL_PLAYLIST_URL}`);
    const { data: tamilData } = await axios.get(TAMIL_PLAYLIST_URL);
    const tamilLines = tamilData.split("\n");
    for (let i = 0; i < tamilLines.length; i++) {
      if (!tamilLines[i].startsWith("#EXTINF")) continue;
      const ext = tamilLines[i];
      const url = tamilLines[i + 1];
      if (!url) continue;

      // Force group-title to TAMIL for all Tamil channels
      let modifiedExt;
      if (/group-title="[^"]+"/i.test(ext)) {
        modifiedExt = ext.replace(
          /group-title="[^"]+"/i,
          'group-title="TAMIL"'
        );
      } else {
        modifiedExt = ext.replace(/^(#EXTINF[^,]*)/, '$1 group-title="TAMIL"');
      }

      output["tamil"].push(modifiedExt);
      output["tamil"].push(url);
    }
    console.log(
      `Added Tamil channels. Total entries: ${(output["tamil"].length - 1) / 2}`
    );
  } catch (error) {
    console.log("Warning: Could not fetch Tamil playlist:", error.message);
  }

  // --- Fetch and append Tamil local IPTV playlist ---
  try {
    console.log(`Fetching Tamil local channels from: ${tamilLocalUrl}`);
    const { data: tamilLocalData } = await axios.get(tamilLocalUrl);
    const tamilLocalLines = tamilLocalData.split("\n");
    for (let i = 0; i < tamilLocalLines.length; i++) {
      if (!tamilLocalLines[i].startsWith("#EXTINF")) continue;
      const ext = tamilLocalLines[i];
      const url = tamilLocalLines[i + 1];
      if (!url) continue;

      // Force group-title to TAMIL for all Tamil channels
      let modifiedExt;
      if (/group-title="[^"]+"/i.test(ext)) {
        modifiedExt = ext.replace(
          /group-title="[^"]+"/i,
          'group-title="TAMIL"'
        );
      } else {
        modifiedExt = ext.replace(/^(#EXTINF[^,]*)/, '$1 group-title="TAMIL"');
      }

      output["tamil"].push(modifiedExt);
      output["tamil"].push(url);
    }
    console.log(
      `Added Tamil local channels. Total Tamil entries: ${
        (output["tamil"].length - 1) / 2
      }`
    );
  } catch (error) {
    console.log(
      "Warning: Could not fetch Tamil local playlist:",
      error.message
    );
  }
  // --- Fetch and append Telugu language playlist ---
  try {
    console.log(`Fetching Telugu channels from: ${TELUGU_PLAYLIST_URL}`);
    const { data: teluguData } = await axios.get(TELUGU_PLAYLIST_URL);
    const teluguLines = teluguData.split("\n");
    for (let i = 0; i < teluguLines.length; i++) {
      if (!teluguLines[i].startsWith("#EXTINF")) continue;
      const ext = teluguLines[i];
      const url = teluguLines[i + 1];
      if (!url) continue;

      // Force group-title to TELUGU for all Telugu channels
      let modifiedExt;
      if (/group-title="[^"]+"/i.test(ext)) {
        modifiedExt = ext.replace(
          /group-title="[^"]+"/i,
          'group-title="TELUGU"'
        );
      } else {
        modifiedExt = ext.replace(/^(#EXTINF[^,]*)/, '$1 group-title="TELUGU"');
      }

      output["telugu"].push(modifiedExt);
      output["telugu"].push(url);
    }
    console.log(
      `Added Telugu channels. Total entries: ${(output["telugu"].length - 1) / 2}`
    );
  } catch (error) {
    console.log("Warning: Could not fetch Telugu playlist:", error.message);
  }
  // --- End of Telugu processing ---

  // Create output directory if it doesn't exist
  if (!fs.existsSync("output")) {
    fs.mkdirSync("output");
  }

  // Generate direct.html for direct playback channels
  if (directChannels.length > 0) {
    const directHtml = generateDirectChannelsHtml(directChannels);
    fs.writeFileSync("output/direct.html", directHtml);
    console.log(
      `Generated direct.html with ${directChannels.length} direct playback channels`
    );
  }

  // Write individual category files
  // Remove stale education file if present (merged into entertainment)
  if (fs.existsSync("output/education.m3u")) {
    try {
      fs.rmSync("output/education.m3u");
    } catch {
      /* ignore */
    }
  }
  for (const key of Object.keys(output)) {
    fs.writeFileSync(`output/${key}.m3u`, output[key].join("\n"));
  }

  // Create combined all.m3u with section headers
  const combined = ["#EXTM3U"];

  for (const key of categoryOrder) {
    if (!output[key] || output[key].length <= 1) continue; // Skip empty categories

    // combined.push("");
    // combined.push(`# ---------------- ${categoryLabels[key]} ----------------`);

    // Add all channels from this category (skip the #EXTM3U header)
    for (let i = 1; i < output[key].length; i++) {
      combined.push(output[key][i]);
    }
  }

  fs.writeFileSync("output/all.m3u", combined.join("\n"));
  writeCustomChannelsJsonFromM3uLines(combined, directChannels);

  console.log("✅ All IPTV category playlists generated successfully!");
  console.log("📁 Individual files: output/zee.m3u, output/sony.m3u, etc.");
  console.log("📄 Combined file: output/all.m3u");
}

// Function to generate HTML for direct playback channels
function generateDirectChannelsHtml(channels) {
  // Helper to escape HTML in text/attributes
  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const htmlChannels = channels
    .map((channel) => {
      const safeName = escapeHtml(channel.name || "");
      const safeUrl = escapeHtml(channel.url || "");
      const safeLogo = escapeHtml(channel.logo || "");

      // Use simple anchor tag instead of inline JavaScript to avoid syntax issues
      return `
        <a class="channel-card" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
            <img src="${safeLogo}" alt="${safeName}" class="channel-logo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(
        safeName.substring(0, 3).toUpperCase()
      )}&background=888888&color=fff&size=100&bold=true'" />
            <div class="channel-name">${safeName}</div>
        </a>
    `;
    })
    .join("");

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
            <p>Total Channels: ${
              channels.length
            } | Generated on ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;
}

generate();
