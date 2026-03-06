"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Socket } from "socket.io-client";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ChatMessageType, ChatRoomType } from "@/types/chat";

interface ChatConversationProps {
	roomId: string;
	onBack?: () => void;
	showBackButton?: boolean;
	room?: ChatRoomType;
	onRoomUpdated?: (room: ChatRoomType) => void;
}

export default function ChatConversation({
	roomId,
	onBack,
	showBackButton = false,
	room,
	onRoomUpdated,
}: ChatConversationProps) {
	const { data: session, status } = useSession();
	const [messages, setMessages] = useState<ChatMessageType[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [_socket, setSocket] = useState<Socket | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const socketRef = useRef<Socket | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editFile, setEditFile] = useState<File | null>(null);
	const [savingGroup, setSavingGroup] = useState(false);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		if (!roomId || status !== "authenticated") {
			setLoading(false);
			return;
		}
		const fetchMessages = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`);
				if (res.status === 401 || res.status === 403) {
					setError("Unauthorized");
					return;
				}
				if (res.status === 404) {
					setError("Chat not found");
					return;
				}
				if (!res.ok) throw new Error("Failed to load messages");
				const data = await res.json();
				setMessages(data.messages ?? []);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to load messages");
			} finally {
				setLoading(false);
			}
		};
		fetchMessages();
	}, [roomId, status]);

	useEffect(() => {
		if (!roomId || status !== "authenticated") return;
		const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
		if (!socketUrl) return;

		let s: Socket | null = null;
		(async () => {
			try {
				const tokenRes = await fetch("/api/chat/socket-token");
				if (!tokenRes.ok) return;
				const { token } = await tokenRes.json();
				const { io: ioClient } = await import("socket.io-client");
				s = ioClient(socketUrl, {
					auth: { token },
					transports: ["websocket", "polling"],
				});
				socketRef.current = s;
				setSocket(s);
				s.emit("join", roomId);
				s.on("message", (msg: ChatMessageType) => {
					setMessages((prev) => {
						if (prev.some((m) => m.id === msg.id)) return prev;
						return [...prev, msg];
					});
				});
			} catch {
				// Socket optional; chat still works via API
			}
		})();
		return () => {
			if (s) {
				s.emit("leave", roomId);
				s.disconnect();
			}
			socketRef.current = null;
			setSocket(null);
		};
	}, [roomId, status]);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	useEffect(() => {
		if (room?.type === "group") {
			setEditName(room.name || "");
		}
	}, [room?.id, room?.type, room?.name]);

	const isGroup = room?.type === "group";
	const isAdmin =
		!!session?.user?.id &&
		(isGroup
			? (room?.adminIds ?? []).includes(session.user.id) ||
			  room?.createdById === session.user.id
			: false);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!roomId || !text.trim() || !session?.user) return;
		setSending(true);
		try {
			const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: text.trim() }),
			});
			const data = await res.json();
			if (res.ok && data.message) {
				setMessages((prev) => [...prev, data.message]);
				setText("");
			}
		} finally {
			setSending(false);
		}
	};

	const handleSaveGroup = async () => {
		if (!roomId || !isGroup || !isAdmin) return;
		setSavingGroup(true);
		try {
			let imageUrl: string | undefined = undefined;
			if (editFile) {
				const fd = new FormData();
				fd.set("file", editFile);
				fd.set("type", "image");
				fd.set("prefix", `chat/groups/${roomId}`);
				const uploadRes = await fetch("/api/upload/community-media", {
					method: "POST",
					body: fd,
				});
				if (uploadRes.ok) {
					const up = await uploadRes.json();
					imageUrl = up.url;
				}
			}

			const patchRes = await fetch(`/api/chat/rooms/${roomId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: editName.trim() || undefined,
					...(imageUrl ? { imageUrl } : {}),
				}),
			});
			if (patchRes.ok) {
				const data = await patchRes.json();
				if (data.room && onRoomUpdated) onRoomUpdated(data.room);
				setEditOpen(false);
				setEditFile(null);
			}
		} finally {
			setSavingGroup(false);
		}
	};

	if (status !== "authenticated") {
		return (
			<div className="rounded-xl border bg-white p-4 text-center text-gray-600">
				Sign in to chat.
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-xl border bg-red-50 p-4 text-red-700 flex flex-col gap-2">
				<p>{error}</p>
				{showBackButton && onBack && (
					<Button variant="outline" size="sm" onClick={onBack}>
						Back to inbox
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="flex-1 rounded-xl border bg-white flex flex-col min-h-0">
			{showBackButton && onBack && (
				<div className="p-2 border-b">
					<Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-orange-500">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to inbox
					</Button>
				</div>
			)}
			{isGroup && (
				<div className="px-4 py-3 border-b flex items-center gap-3">
					<Avatar className="h-10 w-10 shrink-0">
						{room?.imageUrl ? (
							<Image
								src={room.imageUrl}
								alt=""
								width={40}
								height={40}
								className="rounded-full object-cover"
							/>
						) : null}
						<AvatarFallback>
							{(room?.name || "Group").slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="font-medium text-gray-900 truncate">
							{room?.name || "Group"}
						</p>
					</div>
					{isAdmin && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setEditOpen(true)}
						>
							Edit group
						</Button>
					)}
				</div>
			)}
			{loading ? (
				<div className="flex items-center justify-center flex-1">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
				</div>
			) : (
				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex gap-2 ${
								msg.senderId === session?.user?.id ? "flex-row-reverse" : ""
							}`}
						>
							<Avatar className="h-8 w-8 shrink-0">
								<AvatarFallback className="text-xs">
									{(msg.sender?.name || "U").slice(0, 1)}
								</AvatarFallback>
							</Avatar>
							<div
								className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
									msg.senderId === session?.user?.id
										? "bg-primary text-primary-foreground"
										: "bg-gray-100 text-gray-900"
								}`}
							>
								<p>{msg.text}</p>
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
			)}
			<form onSubmit={handleSend} className="flex gap-2 p-3 border-t">
				<input
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Type a message..."
					className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
				/>
				<Button type="submit" size="icon" disabled={sending || !text.trim()}>
					{sending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</Button>
			</form>

			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit group</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<label className="text-sm font-medium text-gray-700">Group name</label>
							<input
								type="text"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">Group image</label>
							<input
								type="file"
								accept="image/*"
								onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
								className="mt-1 block w-full text-sm"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
							Cancel
						</Button>
						<Button type="button" onClick={handleSaveGroup} disabled={savingGroup}>
							{savingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
