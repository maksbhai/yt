# Media Hub Lite

A polished MVP downloader built with Next.js App Router for **lawful media downloads only** from YouTube links, direct media file URLs, and user-permitted sources.

> This project does not implement bypassing platform protections or unauthorized copyrighted content retrieval.

## Tech Stack

- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Zod validation
- Vercel-ready structure

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Run in development

```bash
npm run dev
```

Open `http://localhost:3000`.

### 3) Production build check

```bash
npm run build
npm run start
```

## Deploy on Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com/new).
3. Keep default framework settings (Next.js detected automatically).
4. Deploy.

No extra infrastructure is required for the MVP.

## API Overview

### `POST /api/analyze`
Analyze a YouTube or direct media URL.

**Request**

```json
{
  "url": "https://example.com/path/video.mp4"
}
```

**Success Response**

```json
{
  "ok": true,
  "media": {
    "sourceUrl": "https://example.com/path/video.mp4",
    "title": "video",
    "fileName": "video.mp4",
    "mimeType": "video/mp4",
    "sizeBytes": 123456,
    "previewUrl": "https://example.com/path/video.mp4",
    "canDownloadVideo": true,
    "canDownloadAudio": true
  }
}
```

### `POST /api/download`
Create a fast download payload for selected format.

**Request**

```json
{
  "url": "https://example.com/path/video.mp4",
  "format": "video"
}
```

**Success Response**

```json
{
  "ok": true,
  "downloadUrl": "https://example.com/path/video.mp4",
  "fileName": "video.mp4",
  "format": "video"
}
```

## Supported Source Explanation

This MVP supports:
- **YouTube links** (`youtube.com`, `youtu.be`) when direct stream URLs are available.
- **Direct media file URLs** (HTTP/HTTPS), such as URLs ending in common media extensions (`.mp4`, `.webm`, `.mp3`, `.m4a`, etc.) or URLs returning media content-type headers.

If a source cannot be validated as direct/supportable media, the API returns a clear `UNSUPPORTED_SOURCE` error.

## Behavior Notes

- Prioritizes speed by providing direct source download URLs when lawful and supported.
- Includes an audio option for direct audio sources and video sources that expose audio-capable media.
- Uses typed validation and user-friendly API/UI error handling.

## Future Extension Points

- Optional authenticated user workspace/history.
- Additional lawful source adapters (with explicit permission-based integrations).
- Server-side transcoding pipeline for advanced audio extraction when deployment resources allow.
- Background jobs and resumable transfers for very large files.
