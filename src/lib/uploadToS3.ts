import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./s3Client";

export async function uploadToS3(
	fileBuffer: Buffer,
	fileName: string,
	mimeType: string
): Promise<string> {
	const bucket = process.env.MY_S3_BUCKET!;
	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: fileName,
			Body: fileBuffer,
			ContentType: mimeType,
		})
	);
	return `https://${bucket}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${fileName}`;
}
