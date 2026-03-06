export interface ChatUser {
	id: string;
	name: string | null;
	image: string | null;
	profileImageUrl: string | null;
}

export interface ChatMessageType {
	id: string;
	chatRoomId: string;
	senderId: string;
	text: string;
	attachmentUrl: string | null;
	attachmentType: string | null;
	createdAt: string;
	sender: ChatUser;
}

export interface ChatRoomType {
	id: string;
	type: string;
	name: string | null;
	imageUrl?: string | null;
	createdById?: string | null;
	adminIds?: string[];
	participantIds: string[];
	createdAt: string;
	updatedAt: string;
	lastMessage: ChatMessageType | null;
	participants?: ChatUser[];
}
