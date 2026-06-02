import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("output");
const removed = [];

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const name of fs.readdirSync(outputDir)) {
  const fullPath = path.join(outputDir, name);
  const isPlaylistArtifact =
    name.toLowerCase().endsWith(".m3u") ||
    name.toLowerCase() === "direct.html" ||
    name.toLowerCase() === "custom-channels.json";

  if (isPlaylistArtifact && fs.statSync(fullPath).isFile()) {
    fs.rmSync(fullPath);
    removed.push(name);
  }
}

const noticePath = path.join(outputDir, "README.txt");
const notice = [
  "This output directory has been decommissioned for DMCA compliance.",
  "Playlist generation and redistribution have been disabled.",
].join("\n");

fs.writeFileSync(noticePath, `${notice}\n`, "utf8");

console.log("Compliance mode active. Streaming outputs are disabled.");
if (removed.length) {
  console.log(`Removed artifacts: ${removed.join(", ")}`);
}
