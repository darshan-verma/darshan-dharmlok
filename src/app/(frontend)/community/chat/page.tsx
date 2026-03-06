"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Loader2, MessageCircle, ArrowLeft, Users, Search } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import ChatConversation from "@/components/community/ChatConversation";
import type { ChatRoomType } from "@/types/chat";

const USERS_PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

interface ChatUserListItem {
	id: string;
	name: string;
	email: string;
	profileImageUrl: string | null;
	image: string | null;
}

export default function ChatListPage() {
	const { data: session, status } = useSession();
	const [rooms, setRooms] = useState<ChatRoomType[]>([]);
	const [roomsLoading, setRoomsLoading] = useState(true);
	const [roomsError, setRoomsError] = useState<string | null>(null);
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

	const [users, setUsers] = useState<ChatUserListItem[]>([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const [usersPage, setUsersPage] = useState(1);
	const [usersTotalPages, setUsersTotalPages] = useState(1);
	const [searchInput, setSearchInput] = useState("");

	const [createGroupOpen, setCreateGroupOpen] = useState(false);
	const [groupSelectedIds, setGroupSelectedIds] = useState<Set<string>>(new Set());
	const [groupName, setGroupName] = useState("");
	const [groupCreateLoading, setGroupCreateLoading] = useState(false);
	const [groupUsers, setGroupUsers] = useState<ChatUserListItem[]>([]);
	const [groupUsersPage, setGroupUsersPage] = useState(1);
	const [groupUsersTotalPages, setGroupUsersTotalPages] = useState(1);

	const fetchRooms = useCallback(async () => {
		if (status !== "authenticated") return;
		try {
			setRoomsLoading(true);
			const res = await fetch("/api/chat/rooms");
			if (res.status === 401) {
				setRooms([]);
				return;
			}
			if (!res.ok) throw new Error("Failed to fetch chats");
			const data = await res.json();
			setRooms(data.rooms ?? []);
		} catch (e) {
			setRoomsError(e instanceof Error ? e.message : "Failed to load chats");
		} finally {
			setRoomsLoading(false);
		}
	}, [status]);

	const fetchUsers = useCallback(
		async (page: number, search: string, forModal: boolean) => {
			if (!session?.user?.id) return;
			try {
				if (forModal) setGroupCreateLoading(true);
				else setUsersLoading(true);
				const params = new URLSearchParams({
					userType: "user",
					excludeUserId: session.user.id,
					page: String(page),
					limit: String(USERS_PAGE_SIZE),
				});
				if (search.trim()) params.set("search", search.trim());
				const res = await fetch(`/api/users?${params}`);
				if (!res.ok) throw new Error("Failed to fetch users");
				const data = await res.json();
				const list = (data.users ?? []).map((u: { id: string; name: string; email: string; profileImageUrl?: string | null; image?: string | null }) => ({
					id: u.id,
					name: u.name,
					email: u.email,
					profileImageUrl: u.profileImageUrl ?? null,
					image: u.image ?? null,
				}));
				const totalPages = data.pagination?.totalPages ?? 1;
				if (forModal) {
					setGroupUsers(list);
					setGroupUsersTotalPages(totalPages);
					setGroupUsersPage(page);
				} else {
					setUsers(list);
					setUsersTotalPages(totalPages);
					setUsersPage(page);
				}
			} catch {
				// ignore
			} finally {
				if (forModal) setGroupCreateLoading(false);
				else setUsersLoading(false);
			}
		},
		[session?.user?.id]
	);

	useEffect(() => {
		if (status !== "authenticated") {
			setRoomsLoading(false);
			return;
		}
		fetchRooms();
	}, [status, fetchRooms]);

	useEffect(() => {
		if (status !== "authenticated") return;
		const t = setTimeout(() => {
			fetchUsers(1, searchInput, false);
		}, DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [status, searchInput, fetchUsers]);

	const handleStartChat = async (userId: string) => {
		if (!session?.user?.id) return;
		try {
			const res = await fetch("/api/chat/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "direct", participantIds: [userId] }),
			});
			const data = await res.json();
			if (res.ok && data.room) {
				setSelectedRoomId(data.room.id);
				fetchRooms();
			}
		} catch {
			// ignore
		}
	};

	const openCreateGroup = () => {
		setCreateGroupOpen(true);
		setGroupSelectedIds(new Set());
		setGroupName("");
		setGroupUsersPage(1);
		fetchUsers(1, "", true);
	};

	const toggleGroupUser = (id: string) => {
		setGroupSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleCreateGroup = async () => {
		if (!session?.user?.id || groupSelectedIds.size === 0) return;
		setGroupCreateLoading(true);
		try {
			const res = await fetch("/api/chat/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "group",
					participantIds: Array.from(groupSelectedIds),
					name: groupName.trim() || undefined,
				}),
			});
			const data = await res.json();
			if (res.ok && data.room) {
				setSelectedRoomId(data.room.id);
				setCreateGroupOpen(false);
				fetchRooms();
			}
		} finally {
			setGroupCreateLoading(false);
		}
	};

	const getRoomTitle = (room: ChatRoomType) => {
		if (room.type === "group") return room.name || "Group";
		const participants = room.participants ?? [];
		const other = participants.find((p) => p.id !== session?.user?.id);
		return other?.name ?? "Direct chat";
	};

	const getRoomAvatar = (room: ChatRoomType) => {
		if (room.type === "group") {
			return room.name ? room.name.slice(0, 2).toUpperCase() : "G";
		}
		const participants = room.participants ?? [];
		const other = participants.find((p) => p.id !== session?.user?.id);
		const name = other?.name ?? "U";
		return name.slice(0, 1);
	};

	const getRoomImage = (room: ChatRoomType) => {
		if (room.type === "group") return room.imageUrl ?? null;
		const participants = room.participants ?? [];
		const other = participants.find((p) => p.id !== session?.user?.id);
		return other?.profileImageUrl ?? other?.image ?? null;
	};

	return (
		<div className="min-h-screen bg-[#f5f5f0] flex flex-col">
			<Header />
<div className="container mx-auto px-4 py-4 flex-1 flex flex-col max-w-6xl min-h-0">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold text-gray-900">Chat</h1>
					<Link
						href="/community"
						className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Community
					</Link>
				</div>

				{status !== "authenticated" && (
					<div className="rounded-xl border bg-white p-4 text-center text-gray-600">
						Sign in to view your conversations.
					</div>
				)}

				{status === "authenticated" && (
					<div className="flex-1 flex gap-4 min-h-0">
						{/* Left panel: Users */}
						<div className="w-80 shrink-0 flex flex-col rounded-xl border bg-white overflow-hidden">
							<div className="p-3 border-b">
								<h2 className="font-semibold text-gray-900 mb-2">People</h2>
								<div className="relative">
									<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										type="text"
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
										placeholder="Search users..."
										className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
									/>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-2 w-full"
									onClick={openCreateGroup}
								>
									<Users className="h-4 w-4 mr-2" />
									Create group
								</Button>
							</div>
							<div className="flex-1 overflow-y-auto min-h-0">
								{usersLoading && users.length === 0 ? (
									<div className="flex justify-center py-8">
										<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
									</div>
								) : users.length === 0 ? (
									<div className="p-4 text-center text-sm text-gray-500">
										No users found.
									</div>
								) : (
									<ul className="divide-y">
										{users.map((u) => (
											<li key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50">
												<Avatar className="h-9 w-9 shrink-0">
													{u.profileImageUrl || u.image ? (
														<Image
															src={u.profileImageUrl || u.image || ""}
															alt=""
															width={36}
															height={36}
															className="rounded-full object-cover"
														/>
													) : null}
													<AvatarFallback className="text-xs">
														{(u.name || "U").slice(0, 1)}
													</AvatarFallback>
												</Avatar>
												<span className="flex-1 truncate text-sm font-medium text-gray-900">
													{u.name}
												</span>
												<Button
													type="button"
													size="sm"
													variant="secondary"
													onClick={() => handleStartChat(u.id)}
												>
													Chat
												</Button>
											</li>
										))}
									</ul>
								)}
								{usersTotalPages > 1 && (
									<div className="flex items-center justify-center gap-2 p-2 border-t">
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={usersPage <= 1}
											onClick={() => fetchUsers(usersPage - 1, searchInput, false)}
										>
											Prev
										</Button>
										<span className="text-xs text-gray-500">
											{usersPage} / {usersTotalPages}
										</span>
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={usersPage >= usersTotalPages}
											onClick={() => fetchUsers(usersPage + 1, searchInput, false)}
										>
											Next
										</Button>
									</div>
								)}
							</div>
						</div>

						{/* Right panel: Inbox or Conversation */}
<div className="flex-1 flex flex-col min-w-0 min-h-0">
							{selectedRoomId ? (
								<ChatConversation
									roomId={selectedRoomId}
									room={rooms.find((r) => r.id === selectedRoomId)}
									onRoomUpdated={(updated) => {
										setRooms((prev) =>
											prev.map((r) =>
												r.id === updated.id ? { ...r, ...updated } : r
											)
										);
									}}
									onBack={() => setSelectedRoomId(null)}
									showBackButton
								/>
							) : (
								<>
									{roomsLoading ? (
										<div className="flex flex-col items-center justify-center py-12 rounded-xl border bg-white">
											<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
											<p className="text-muted-foreground">Loading chats...</p>
										</div>
									) : roomsError ? (
										<div className="text-center py-12 text-red-500 rounded-xl border bg-white">
											{roomsError}
										</div>
									) : rooms.length === 0 ? (
										<div className="rounded-xl border bg-white p-12 text-center text-gray-500">
											<MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
											<p>No chats yet. Start a chat from the list or create a group.</p>
										</div>
									) : (
										<div className="rounded-xl border bg-white divide-y overflow-hidden">
											{rooms.map((room) => (
												<button
													key={room.id}
													type="button"
													onClick={() => setSelectedRoomId(room.id)}
													className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left"
												>
													<Avatar className="h-12 w-12 shrink-0">
														{getRoomImage(room) ? (
															<Image
																src={getRoomImage(room)!}
																alt=""
																width={48}
																height={48}
																className="rounded-full object-cover"
															/>
														) : null}
														<AvatarFallback>
															{getRoomAvatar(room)}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<p className="font-medium text-gray-900 truncate">
															{getRoomTitle(room)}
														</p>
														{room.lastMessage && (
															<p className="text-sm text-gray-500 truncate">
																{room.lastMessage.sender?.name}: {room.lastMessage.text}
															</p>
														)}
													</div>
												</button>
											))}
										</div>
									)}
								</>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Create group modal */}
			<Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Create group</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<label className="text-sm font-medium text-gray-700">Group name (optional)</label>
							<input
								type="text"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								placeholder="e.g. Family"
								className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">Add people</label>
							{groupCreateLoading && groupUsers.length === 0 ? (
								<div className="flex justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
								</div>
							) : (
								<ul className="mt-1 max-h-48 overflow-y-auto rounded border border-gray-200 divide-y">
									{groupUsers.map((u) => (
										<li key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50">
											<input
												type="checkbox"
												checked={groupSelectedIds.has(u.id)}
												onChange={() => toggleGroupUser(u.id)}
												className="rounded border-gray-300"
											/>
											<Avatar className="h-8 w-8 shrink-0">
												<AvatarFallback className="text-xs">
													{(u.name || "U").slice(0, 1)}
												</AvatarFallback>
											</Avatar>
											<span className="flex-1 truncate text-sm">{u.name}</span>
										</li>
									))}
								</ul>
							)}
							{groupUsersTotalPages > 1 && (
								<div className="flex items-center justify-center gap-2 mt-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={groupUsersPage <= 1}
										onClick={() => fetchUsers(groupUsersPage - 1, "", true)}
									>
										Prev
									</Button>
									<span className="text-xs text-gray-500">
										{groupUsersPage} / {groupUsersTotalPages}
									</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={groupUsersPage >= groupUsersTotalPages}
										onClick={() => fetchUsers(groupUsersPage + 1, "", true)}
									>
										Next
									</Button>
								</div>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCreateGroupOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleCreateGroup}
							disabled={groupSelectedIds.size === 0 || groupCreateLoading}
						>
							{groupCreateLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Create"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Footer />
		</div>
	);
}
