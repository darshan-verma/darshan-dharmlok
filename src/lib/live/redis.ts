import IORedis from "ioredis";
import { getRedisUrl } from "@/lib/live/config";

let redisClient: IORedis | undefined;

export function getLiveRedis(): IORedis {
	if (!redisClient) {
		redisClient = new IORedis(getRedisUrl(), {
			maxRetriesPerRequest: null,
			enableReadyCheck: true,
		});
	}
	return redisClient;
}
