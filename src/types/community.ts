export interface PostUser {
	id: string;
	name: string | null;
	profileImageUrl: string | null;
	image: string | null;
}

export interface PostMedia {
	id: string;
	type: string;
	url: string;
}

export interface PostType {
	id: string;
	userId: string;
	userType: string;
	caption: string | null;
	likes: string[];
	media: PostMedia[];
	user: PostUser;
	commentCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface CommentType {
	id: string;
	text: string;
	userId: string;
	postId: string | null;
	createdAt: string;
	user: PostUser;
}
