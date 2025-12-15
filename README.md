# Custom IPTV Playlist Generator

Automatically generates custom IPTV M3U playlists (Zee, Sony, Sports, Star and Others) by pulling the latest data from iptv-org and sorting channels into relevant categories. Channels can now appear in multiple categories.

------------------------------------
FEATURES
------------------------------------

- Categorizes channels into:
  • Zee
  • Sony
  • Star
  • Sports

- Creates TWO types of playlists:
  1. Separate .m3u files for each category (in output/ folder)
  2. A combined all.m3u file with all channels organized by category sections


------------------------------------
DIRECT PLAYLIST URLs
------------------------------------
COMBINED all.m3u PLAYLIST (zee, sony, star, sports categories and All other channels): https://atanuroy22.github.io/iptv/output/all.m3u - [▶ Play ](https://atanuroy22.github.io/iptv/player/index.html?url=https://atanuroy22.github.io/iptv/output/all.m3u)

INDIVIDUAL CATEGORY PLAYLISTS:

Zee: https://atanuroy22.github.io/iptv/output/zee.m3u - [▶ Play ](https://atanuroy22.github.io/iptv/player/index.html?url=https://atanuroy22.github.io/iptv/output/zee.m3u)

Sony: https://atanuroy22.github.io/iptv/output/sony.m3u - [▶ Play ](https://atanuroy22.github.io/iptv/player/index.html?url=https://atanuroy22.github.io/iptv/output/sony.m3u)

Star: https://atanuroy22.github.io/iptv/output/star.m3u - [▶ Play ](https://atanuroy22.github.io/iptv/player/index.html?url=https://atanuroy22.github.io/iptv/output/star.m3u)

Sports: https://atanuroy22.github.io/iptv/output/sports.m3u - [▶ Play ](https://atanuroy22.github.io/iptv/player/index.html?url=https://atanuroy22.github.io/iptv/output/sports.m3u)

etc.

These URLs auto-refresh every 4 hours.

------------------------------------
EPG (XMLTV) SUPPORT
------------------------------------
- You can pass an EPG URL to the player using `&epg=`. Example:

  [▶ Play with EPG](https://atanuroy22.github.io/iptv/player/index.html?url=https://atanuroy22.github.io/iptv/output/all.m3u&epg=https://example.com/guide.xml)

- If the EPG host blocks cross-origin requests, use your deployed server as a proxy:

  `&epg=https://<your-domain>/epg?url=https%3A%2F%2Fexample.com%2Fguide.xml`

------------------------------------
LICENSE
------------------------------------
MIT License – free to use and modify.
