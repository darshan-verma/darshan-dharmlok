/**
 * Socket server for real-time chat only.
 * - Clients connect with NextAuth JWT (handshake auth).
 * - Clients join room chat:${roomId} to receive messages.
 * - Next.js API POSTs to /emit with secret to broadcast new messages.
 */
import http from "http";
import { Server } from "socket.io";
import express from "express";
import jwt from "jsonwebtoken";
import { parse as parseCookie } from "cookie";

const PORT = process.env.SOCKET_PORT || 3001;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const EMIT_SECRET = process.env.SOCKET_EMIT_SECRET;

if (!NEXTAUTH_SECRET) {
	console.warn("NEXTAUTH_SECRET not set; socket auth may fail.");
}
if (!EMIT_SECRET) {
	console.warn("SOCKET_EMIT_SECRET not set; /emit endpoint will reject requests.");
}

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		credentials: true,
	},
});

function getTokenFromHandshake(handshake) {
	const token = handshake.auth?.token || handshake.query?.token;
	if (token) return token;
	const cookieHeader = handshake.headers?.cookie;
	if (cookieHeader) {
		const cookies = parseCookie(cookieHeader);
		const nextAuthCookie = cookies["next-auth.session-token"] || cookies["__Secure-next-auth.session-token"];
		if (nextAuthCookie) return nextAuthCookie;
	}
	return null;
}

function verifyToken(token) {
	if (!NEXTAUTH_SECRET) return null;
	try {
		const decoded = jwt.verify(token, NEXTAUTH_SECRET);
		return decoded?.sub || decoded?.id || null;
	} catch {
		return null;
	}
}

io.use((socket, next) => {
	const token = getTokenFromHandshake(socket.handshake);
	const userId = verifyToken(token);
	if (!userId) {
		return next(new Error("Unauthorized"));
	}
	socket.userId = userId;
	next();
});

io.on("connection", (socket) => {
	socket.on("join", (roomId) => {
		if (roomId && typeof roomId === "string") {
			const room = `chat:${roomId}`;
			socket.join(room);
		}
	});
	socket.on("leave", (roomId) => {
		if (roomId && typeof roomId === "string") {
			socket.leave(`chat:${roomId}`);
		}
	});
});

// HTTP endpoint for Next.js API to trigger emit (no Socket.io client in API)
app.post("/emit", (req, res) => {
	const authHeader = req.headers.authorization;
	const secret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
	if (secret !== EMIT_SECRET) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const { roomId, message } = req.body;
	if (!roomId || !message) {
		return res.status(400).json({ error: "Missing roomId or message" });
	}
	const room = `chat:${roomId}`;
	io.to(room).emit("message", message);
	res.json({ ok: true });
});

server.listen(PORT, () => {
	console.log(`Socket server listening on port ${PORT}`);
});
