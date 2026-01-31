# Spillover

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Astro](https://img.shields.io/badge/Astro-5.x-orange.svg)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)

Save tracks to your Spotify library while listening on other platforms. Spillover lets you quickly search for and save tracks without switching apps.

Originally created as an **experiment using Claude Code** to drive implementation and refactoring.

---

## Features

### Core Features

- **Quick Search** - Search Spotify's catalog with instant results
- **One-Click Like** - Save tracks to your Liked Songs instantly
- **Playlist Support** - Add tracks to any of your playlists
- **Bulk Actions** - Like all imported tracks at once

### URL Import

Paste a link from any of these platforms to find the track on Spotify:

| Platform | Single Tracks | Playlists |
|----------|--------------|-----------|
| YouTube | Yes | Yes |
| YouTube Music | Yes | Yes |
| SoundCloud | Yes | Yes |
| Spotify | Yes | Yes |
| Deezer | Yes | Yes |
| Apple Music | Yes | Yes |
| Bandcamp | Yes | - |
| Tidal | Yes | Yes |
| Amazon Music | Yes | Yes |
| Mixcloud | Yes | - |
| Beatport | Yes | - |

**Text Import**: Paste a list of tracks in "Artist - Title" format (one per line) to import multiple tracks at once.

### Match Confidence Scoring

When importing tracks from external platforms, Spillover shows how well each matched track corresponds to the original:

- **High confidence** (green) - 80%+ match, likely the correct track
- **Medium confidence** (amber) - 50-79% match, review recommended
- **Low confidence** (red) - Below 50% match, may need manual verification

Confidence is calculated based on title similarity (60%) and artist match (40%), with intelligent handling of common variations like "(Official Video)", "feat.", remixes, and more.

### Playback Integration

- **Now Playing** - See what's currently playing on Spotify with live progress
- **Add to Queue** - Queue tracks for playback on your active Spotify session
- **Play Now** - Start playing a track immediately on Spotify
- **Recommendations** - Get track suggestions based on what you're listening to

### Progressive Web App (PWA)

- **Installable** - Add Spillover to your home screen on mobile or desktop
- **Share Sheet Integration** - Share links from any app directly to Spillover (mobile)
- **Offline Support** - Basic offline shell with cached assets
- **Native Feel** - Standalone app experience without browser chrome

### Browser Extension

- **Right-Click Search** - Select text on any page and search Spotify
- **Quick Access** - Open Spillover from your browser toolbar
- **Works Everywhere** - Compatible with Chrome, Edge, and other Chromium browsers

### Privacy

- **No Server Storage** - Your data stays with Spotify, we don't store anything
- **Optional Analytics** - Anonymous usage analytics via PostHog (opt-in only)
- **Secure Auth** - OAuth tokens stored in HTTP-only cookies
- **No Tracking** - IP tracking explicitly disabled

---

## Quick Start

### Prerequisites

- **Node.js** 18.x or later
- **npm** (comes with Node)
- A **Spotify Developer** account and application

### Setup

1. **Clone and install**

```bash
git clone git@github.com:mdeloughry/spillover.git
cd spillover
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:4321/api/auth/callback

# Optional: PostHog Analytics
PUBLIC_POSTHOG_KEY=
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

3. **Run the dev server**

```bash
npm run dev
```

Open `http://localhost:4321` in your browser.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `L` | Like first result |
| `Esc` | Close dialogs / blur input |

---

## API Reference

All endpoints require authentication except `/api/health`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | GET | Start OAuth flow |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/logout` | GET | Clear session |
| `/api/me` | GET | Get current user |
| `/api/search?q=` | GET | Search tracks |
| `/api/like` | POST/DELETE | Like/unlike track |
| `/api/like/bulk` | POST | Like multiple tracks |
| `/api/playlists` | GET | Get user playlists |
| `/api/playlist/add` | POST | Add track to playlist |
| `/api/now-playing` | GET | Get currently playing |
| `/api/player/state` | GET | Get playback state |
| `/api/player/queue` | POST | Add to queue |
| `/api/player/play` | POST | Play track now |
| `/api/suggestions?seeds=` | GET | Get recommendations |
| `/api/import-url` | POST | Import from URL |
| `/api/import-playlist` | POST | Import playlist/text list |

### Rate Limits

| Category | Limit |
|----------|-------|
| Search | 60/minute |
| Like/Playlist | 30/minute |
| Now Playing | 120/minute |
| Import | 30/minute |

---

## Tech Stack

- **Astro 5** - Web framework with Node adapter (SSR)
- **React 18** - Interactive components
- **TypeScript** - Type-safe application logic
- **Tailwind CSS** - Utility-first styling
- **Three.js** - Visualizer component (easter egg)
- **Spotify Web API** - Music data and playback
- **PostHog** - Optional analytics

---

## Building

### Production Build

```bash
npm run build
```

Output in `dist/`:
- `dist/client/` - Static assets
- `dist/server/` - SSR server

### Preview Production

```bash
npm run preview
```

### Run Production

```bash
node dist/server/entry.mjs
```

Or with PM2:

```bash
pm2 start dist/server/entry.mjs --name spillover
```

### Browser Extension

Build the extension zip:

```bash
npm run build:extension-zip
```

Load in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` directory

---

## Project Structure

```
src/
├── pages/           # Astro pages and API routes
│   ├── api/         # Server endpoints
│   └── *.astro      # Page templates
├── components/      # React/TSX components
├── layouts/         # Shared layouts
├── lib/             # Utilities and helpers
│   ├── api/         # API middleware
│   ├── spotify.ts   # Spotify API wrapper
│   ├── clipboard.ts # Share/copy utilities
│   └── ...
└── hooks/           # React hooks

extension/           # Browser extension
public/              # Static assets
├── icons/           # PWA icons
├── sw.js            # Service worker
└── manifest.webmanifest
```

---

## Security

- OAuth tokens in HTTP-only cookies
- CSRF protection via state parameter
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Input validation with SSRF protection
- Rate limiting per IP address

---

## Contributing

Contributions are welcome! This project started as an experiment but has grown into a useful tool.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test: `npm run build`
4. Submit a pull request

### Code Style

- Modern TypeScript and Astro conventions
- Small, focused, reusable components
- Treat `extension/` and `src/` as separate clients

---

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
