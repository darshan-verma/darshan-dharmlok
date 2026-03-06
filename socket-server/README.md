# Socket server (real-time chat)

Runs alongside the Next.js app. Used only for real-time chat (1:1 and group).

## Env

- `NEXTAUTH_SECRET` – same as Next.js app (to verify JWT).
- `SOCKET_EMIT_SECRET` – secret for the `/emit` HTTP endpoint (Next.js API calls this to broadcast).
- `SOCKET_PORT` – default 3001.
- `NEXT_PUBLIC_APP_URL` – allowed CORS origin (e.g. http://localhost:3000).

In the **Next.js** app `.env` add:

- `SOCKET_SERVER_URL` – e.g. http://localhost:3001 (used by API to call `/emit`).
- `SOCKET_EMIT_SECRET` – same value as in this server.
- `NEXT_PUBLIC_SOCKET_URL` – e.g. http://localhost:3001 (for browser Socket.io client).

## Run

```bash
cd socket-server && npm install && npm run dev
```

Or in production: `npm start`.

## Protocol

- **Client**: Connect with Socket.io; auth via `auth: { token: "<NextAuth session JWT>" }` or session cookie. Then emit `join` with `roomId` to join `chat:${roomId}`.
- **Server**: On new message, Next.js API POSTs to `SOCKET_SERVER_URL/emit` with `Authorization: Bearer SOCKET_EMIT_SECRET` and body `{ roomId, message }`. This server emits `message` to room `chat:${roomId}`.
