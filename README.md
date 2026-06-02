# Custom IPTV Playlist Generator

This repository is an educational Node.js playlist organizer template.

It demonstrates how to read M3U playlist data, categorize channels, and generate structured output files.

> All example streaming URLs have been removed for compliance. This project does not provide or distribute live IPTV sources.

---

## What this repo does

- Reads M3U playlist content from configured source URLs.
- Categorizes channels into groups such as `ZEE`, `SONY`, `STAR`, `SPORTS`, `MOVIES`, `NEWS`, `KIDS`, `TAMIL`, and `TELUGU`.
- Generates output files in the `output/` folder:
  - `all.m3u`
  - `custom-channels.json`
  - category-specific `.m3u` files

## Setup

1. Install Node.js 20+ and npm.
2. Open a terminal in this repository.
3. Install dependencies:

```bash
npm install
```

## Configure sources

Before generating, open `generate.js` and update the playlist source URLs with content you are legally allowed to use.

The top of `generate.js` contains constants such as:

- `PLAYLIST_URL`
- `SPORTS_PLAYLIST_URL`
- `TAMIL_PLAYLIST_URL`
- `TELUGU_PLAYLIST_URL`

Replace those values with authorized M3U source URLs or local playlist files.

## Generate output

Run the generator with:

```bash
npm start
```

Or directly:

```bash
node generate.js
```

This will create or update files in the `output/` directory.

## What is generated

- `output/all.m3u` — combined playlist of all categories
- `output/zee.m3u`, `output/sony.m3u`, `output/star.m3u`, etc.
- `output/custom-channels.json` — organized channel metadata

## Safe usage guidance

- Do not add unauthorized or pirated stream URLs.
- Use this repository only for learning how to process playlist data.
- Keep the player workflow disabled unless you are hosting only legally permitted content.

## Development notes

If you want to adapt the generator for your own playlists:

1. Edit `generate.js` to point to your source data.
2. Customize category filters in the `FILTERS` object.
3. Run `npm start` to regenerate output.

---

## Compliance

This repository has been updated to remove public IPTV playback links and unauthorized playlist URLs.

If you plan to publish or share generated output, ensure you have permission for every stream source used.

