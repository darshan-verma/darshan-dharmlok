export type SuvicharTextStatus = "active" | "inactive";
export type DailySuvicharStatus = "draft" | "scheduled" | "published" | "expired";

export interface SuvicharSafeArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface TodaySuvicharText {
	blocknoteJson: unknown;
	plainText?: string;
	title?: string;
	language?: string;
}

export interface TodaySuvicharFrame {
	imageUrl: string;
	width: number;
	height: number;
	safeArea: SuvicharSafeArea;
	defaultTextColor: string;
	defaultFontSize: number;
	defaultTextAlign: string;
}

export type {
	TextStyleOverrides,
	SuvicharTextAlign,
	SuvicharVerticalAlign,
	SuvicharFontWeight,
} from "./textStyle";

export interface TodaySuvicharResponse {
	id: string;
	scheduledDate: string;
	text: TodaySuvicharText;
	frame: TodaySuvicharFrame;
	textStyleOverrides?: import("./textStyle").TextStyleOverrides | null;
}

export interface SuvicharTextDto {
	id: string;
	title: string;
	slug: string;
	blocknoteJson: string;
	plainText: string;
	language: string;
	status: SuvicharTextStatus;
	createdBy?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface SuvicharFrameDto {
	id: string;
	name: string;
	imageUrl: string;
	thumbnailUrl?: string | null;
	width: number;
	height: number;
	safeAreaX: number;
	safeAreaY: number;
	safeAreaWidth: number;
	safeAreaHeight: number;
	defaultTextColor: string;
	defaultFontSize: number;
	defaultTextAlign: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface DailySuvicharDto {
	id: string;
	suvicharTextId: string;
	frameId: string;
	scheduledDate: string;
	status: DailySuvicharStatus;
	textStyleOverrides?: import("./textStyle").TextStyleOverrides | null;
	publishedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	suvicharText?: SuvicharTextDto;
	frame?: SuvicharFrameDto;
}
