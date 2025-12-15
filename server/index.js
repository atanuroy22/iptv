import express from 'express';
import morgan from 'morgan';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(morgan('dev'));
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, 'public');
const HLS_DIR = path.join(PUBLIC_DIR, 'hls');
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
if (!fs.existsSync(HLS_DIR)) fs.mkdirSync(HLS_DIR);

// Serve HLS content
app.use('/hls', express.static(HLS_DIR, { maxAge: 0 }));

const jobs = new Map();

function startFfmpegJob(source, name) {
  const outDir = path.join(HLS_DIR, name);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPlaylist = path.join(outDir, 'index.m3u8');

  // Cleanup old segments
  for (const f of fs.readdirSync(outDir)) {
    try { fs.unlinkSync(path.join(outDir, f)); } catch {}
  }

  // ffmpeg command: copy codecs, create short HLS playlist
  const args = [
    '-i', source,
    '-c:v', 'copy',
    '-c:a', 'copy',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_list_size', '8',
    '-hls_flags', 'delete_segments',
    outPlaylist
  ];

  const proc = spawn('ffmpeg', args, { stdio: 'pipe' });
  jobs.set(name, proc);
  proc.stdout.on('data', d => process.stdout.write(`[ffmpeg:${name}] ${d}`));
  proc.stderr.on('data', d => process.stdout.write(`[ffmpeg:${name}] ${d}`));
  proc.on('exit', code => {
    console.log(`ffmpeg job '${name}' exited with code ${code}`);
    jobs.delete(name);
  });
  return { playlist: `/hls/${name}/index.m3u8` };
}

app.post('/transmux', (req, res) => {
  const { source, name } = req.body || {};
  if (!source || !name) return res.status(400).json({ error: 'source and name required' });
  if (jobs.has(name)) return res.json({ playlist: `/hls/${name}/index.m3u8`, status: 'running' });
  try {
    const result = startFfmpegJob(source, name);
    return res.json({ ...result, status: 'started' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to start ffmpeg' });
  }
});

app.post('/stop', (req, res) => {
  const { name } = req.body || {};
  const job = jobs.get(name);
  if (!job) return res.status(404).json({ error: 'job not found' });
  try { job.kill('SIGINT'); } catch {}
  jobs.delete(name);
  return res.json({ status: 'stopped' });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Transmux server listening on http://localhost:${port}`);
});
