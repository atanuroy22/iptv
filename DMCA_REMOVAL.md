DMCA removal actions
====================

Files removed from the working tree in response to a DMCA notice:

- player/play.html
- player/index.html
- player/play2.html
- player/blocker.html
- player/blocker2.html
- output/all.m3u
- output/custom-channels.json
- output/direct.html
- output/entertainment.m3u
- output/kids.m3u
- output/movies.m3u
- output/music.m3u
- output/news.m3u
- output/others.m3u
- output/sony.m3u
- output/sports.m3u
- output/star.m3u
- output/tamil.m3u
- output/telugu.m3u
- output/zee.m3u

Next steps (recommended) to permanently remove these files from the repository history
-----------------------------------------------------------------------------------

1) Preferred: use `git filter-repo` (recommended)

```bash
# Clone a mirror of the repository (replace URL):
git clone --mirror https://github.com/<username>/<repo>.git
cd <repo>.git

# Remove the listed paths from all revisions:
git filter-repo --invert-paths \
  --path player/play.html \
  --path player/index.html \
  --path player/play2.html \
  --path player/blocker.html \
  --path player/blocker2.html \
  --path output/all.m3u \
  --path output/custom-channels.json \
  --path output/direct.html \
  --path output/entertainment.m3u \
  --path output/kids.m3u \
  --path output/movies.m3u \
  --path output/music.m3u \
  --path output/news.m3u \
  --path output/others.m3u \
  --path output/sony.m3u \
  --path output/sports.m3u \
  --path output/star.m3u \
  --path output/tamil.m3u \
  --path output/telugu.m3u \
  --path output/zee.m3u

# Force-push cleaned history back to GitHub (careful: this rewrites history):
git push --force --mirror
```

2) Alternative: use the BFG Repo-Cleaner

```bash
# Create a bare clone:
git clone --mirror https://github.com/<username>/<repo>.git
java -jar bfg.jar --delete-files "*.m3u" --delete-files "play.html" <repo>.git
cd <repo>.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force --mirror
```

3) After rewriting history, notify GitHub Support with the actions taken and include the command outputs and the force-push confirmation.

Notes
-----
- Rewriting history will affect all collaborators. Coordinate with them before pushing.
- Keep local backups before running these commands.

If you want, I can prepare the exact `git filter-repo` command with your repository URL filled in and a short reply text to send to GitHub Support.
