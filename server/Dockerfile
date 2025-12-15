# Minimal Docker image with Node and ffmpeg for the transmux server
FROM node:18-slim

# Install ffmpeg (Debian)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.js"]