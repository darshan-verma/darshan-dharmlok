import type { DailySuvichar, SuvicharFrame, SuvicharText } from "@prisma/client";
import type {
	DailySuvicharDto,
	SuvicharFrameDto,
	SuvicharTextDto,
	TodaySuvicharResponse,
} from "./types";
import { parseBlocknoteJson } from "./dates";
import { parseTextStyleOverrides } from "./textStyle";

export function serializeText(row: SuvicharText): SuvicharTextDto {
	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		blocknoteJson: row.blocknoteJson,
		plainText: row.plainText,
		language: row.language,
		status: row.status as SuvicharTextDto["status"],
		createdBy: row.createdBy,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export function serializeFrame(row: SuvicharFrame): SuvicharFrameDto {
	return {
		id: row.id,
		name: row.name,
		imageUrl: row.imageUrl,
		thumbnailUrl: row.thumbnailUrl,
		width: row.width,
		height: row.height,
		safeAreaX: row.safeAreaX,
		safeAreaY: row.safeAreaY,
		safeAreaWidth: row.safeAreaWidth,
		safeAreaHeight: row.safeAreaHeight,
		defaultTextColor: row.defaultTextColor,
		defaultFontSize: row.defaultFontSize,
		defaultTextAlign: row.defaultTextAlign,
		status: row.status,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export function serializeDaily(
	row: DailySuvichar & {
		suvicharText?: SuvicharText | null;
		frame?: SuvicharFrame | null;
	},
): DailySuvicharDto {
	const frameDefaults = row.frame
		? {
				defaultTextColor: row.frame.defaultTextColor,
				defaultTextAlign: row.frame.defaultTextAlign,
			}
		: undefined;

	return {
		id: row.id,
		suvicharTextId: row.suvicharTextId,
		frameId: row.frameId,
		scheduledDate: row.scheduledDate,
		status: row.status as DailySuvicharDto["status"],
		textStyleOverrides: parseTextStyleOverrides(
			row.textStyleOverrides,
			frameDefaults,
		),
		publishedAt: row.publishedAt?.toISOString() ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		suvicharText: row.suvicharText ? serializeText(row.suvicharText) : undefined,
		frame: row.frame ? serializeFrame(row.frame) : undefined,
	};
}

export function serializeToday(
	row: DailySuvichar & { suvicharText: SuvicharText; frame: SuvicharFrame },
): TodaySuvicharResponse {
	const frameDefaults = {
		defaultTextColor: row.frame.defaultTextColor,
		defaultTextAlign: row.frame.defaultTextAlign,
	};

	return {
		id: row.id,
		scheduledDate: row.scheduledDate,
		textStyleOverrides: parseTextStyleOverrides(
			row.textStyleOverrides,
			frameDefaults,
		),
		text: {
			blocknoteJson: parseBlocknoteJson(row.suvicharText.blocknoteJson),
			plainText: row.suvicharText.plainText,
			title: row.suvicharText.title,
			language: row.suvicharText.language,
		},
		frame: {
			imageUrl: row.frame.imageUrl,
			width: row.frame.width,
			height: row.frame.height,
			safeArea: {
				x: row.frame.safeAreaX,
				y: row.frame.safeAreaY,
				width: row.frame.safeAreaWidth,
				height: row.frame.safeAreaHeight,
			},
			defaultTextColor: row.frame.defaultTextColor,
			defaultFontSize: row.frame.defaultFontSize,
			defaultTextAlign: row.frame.defaultTextAlign,
		},
	};
}
