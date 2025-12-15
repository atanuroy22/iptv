import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Attempt to fetch a static ffmpeg if not present. Best-effort; skip on failure.
function hasFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function addToPath(binDir) {
  const currentPath = process.env.PATH || ''
  if (!currentPath.includes(binDir)) {
    process.env.PATH = `${binDir}${path.delimiter}${currentPath}`
  }
}

async function main() {
  if (hasFfmpeg()) return

  const platform = os.platform()
  const arch = os.arch()
  const outDir = path.join(process.cwd(), 'vendor', 'ffmpeg')
  const binDir = path.join(outDir, 'bin')
  if (!existsSync(binDir)) mkdirSync(binDir, { recursive: true })

  try {
    if (platform === 'linux' && (arch === 'x64' || arch === 'arm64')) {
      // Fetch static ffmpeg from John Van Sickle builds (Linux)
      const tar = arch === 'arm64' ? 'ffmpeg-release-arm64-static.tar.xz' : 'ffmpeg-release-amd64-static.tar.xz'
      const url = `https://johnvansickle.com/ffmpeg/releases/${tar}`
      execSync(`curl -fsSL ${url} -o ffmpeg.tar.xz`)
      execSync('tar -xf ffmpeg.tar.xz')
      const dirName = execSync('echo ffmpeg-*static').toString().trim()
      execSync(`cp -f ${dirName}/ffmpeg ${binDir}/ffmpeg`)
      execSync(`chmod +x ${binDir}/ffmpeg`)
      addToPath(binDir)
    } else if (platform === 'win32') {
      // Fetch Windows static build from Gyan.dev
      const zip = 'ffmpeg-6.1.1-essentials_build.zip'
      const url = `https://www.gyan.dev/ffmpeg/builds/${zip}`
      execSync(`powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${zip}'"`)
      execSync(`powershell -Command "Expand-Archive -Path '${zip}' -DestinationPath '.' -Force"`)
      const dirName = execSync('powershell -Command "Get-ChildItem -Directory ffmpeg-* | Select-Object -First 1 -ExpandProperty Name"').toString().trim()
      execSync(`powershell -Command "Copy-Item -Path '${dirName}\\bin\\ffmpeg.exe' -Destination '${binDir}\\ffmpeg.exe' -Force"`)
      addToPath(binDir)
    } else if (platform === 'darwin') {
      // macOS: try brew if available, otherwise skip
      try {
        execSync('brew --version', { stdio: 'ignore' })
        execSync('brew install ffmpeg')
      } catch {
        // no brew; skip
      }
    }
  } catch {
    // best-effort
  }
}

main()