# Dharmlok Real-Time Live Broadcasting (Phase-1 Live)

This module is for true live broadcasting (not upload-and-play VOD).

## Live Flow

1. Broadcaster creates a live session via API.
2. App returns:
   - `ingestUrl` (RTMP endpoint),
   - one-time `streamKey` (plain).
3. Broadcaster starts OBS/encoder push to ingest server.
4. Ingest server calls app auth hook:
   - `POST /api/live/internal/ingest-auth`
5. If allowed, stream is accepted and packaged to HLS.
6. Viewers call playback grant API:
   - `GET /api/live/broadcasts/:id/playback`
7. App returns signed CloudFront live manifest URL + signed cookies.
8. Player consumes HLS live stream in near real-time.

## Implemented Endpoints

- `POST /api/live/broadcasts`
  - Creates a new broadcast and secure stream key.
- `GET /api/live/broadcasts`
  - Lists recent broadcasts.
- `GET /api/live/broadcasts/:id`
  - Returns broadcast details and live state.
- `POST /api/live/broadcasts/:id/go-live`
  - Marks session live.
- `POST /api/live/broadcasts/:id/end`
  - Ends live session.
- `GET /api/live/broadcasts/:id/playback`
  - Returns signed live manifest and sets CloudFront cookies.
- `POST /api/live/internal/ingest-auth`
  - Validates stream key for RTMP ingest.

## Required Environment Variables

- `REDIS_URL`
- `LIVE_INGEST_BASE_URL` (example: `rtmp://ingest.dharmlok.in`)
- `LIVE_PLAYBACK_BASE_URL` (example: `https://cdn.dharmlok.in`)
- `LIVE_PLAYBACK_PREFIX` (default: `live`)
- `LIVE_PLAYBACK_TOKEN_TTL_SECONDS` (default: `120`)
- `CLOUDFRONT_KEY_PAIR_ID`
- `CLOUDFRONT_PRIVATE_KEY`
- `CLOUDFRONT_COOKIE_DOMAIN` (recommended: `dharmlok.in`)

## Minimal Broadcaster Steps (OBS)

Use custom stream:
- Server: `<LIVE_INGEST_BASE_URL>/live`
- Stream key: key from `POST /api/live/broadcasts`

## Minimal Viewer Steps

1. Open your watch page.
2. Fetch `GET /api/live/broadcasts/:id/playback`.
3. Use `manifestUrl` in player.
4. Browser automatically uses signed cookies for segments.

## NGINX RTMP auth hook example

Use `on_publish` callback:

```nginx
application live {
  live on;
  record off;
  on_publish http://app.dharmlok.in/api/live/internal/ingest-auth;
}
```

The callback payload should include stream key as `name` or `streamKey`.
