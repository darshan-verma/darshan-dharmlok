import prisma from "@/lib/prisma";

/**
 * Deletes a user and all related records that block removal.
 * MongoDB/Prisma required relations are cleared in dependency order.
 */
export async function deleteUserWithRelations(userId: string): Promise<void> {
	await prisma.$transaction([
		// Community content
		prisma.comment.deleteMany({
			where: {
				OR: [
					{ userId },
					{ post: { userId } },
					{ video: { userId } },
				],
			},
		}),
		prisma.media.deleteMany({ where: { post: { userId } } }),
		prisma.post.deleteMany({ where: { userId } }),

		// Live sessions & scheduling
		prisma.sessionParticipant.deleteMany({
			where: {
				OR: [{ userId }, { session: { instructorId: userId } }],
			},
		}),
		prisma.reminder.deleteMany({
			where: {
				OR: [{ userId }, { session: { instructorId: userId } }],
			},
		}),
		prisma.booking.deleteMany({
			where: {
				OR: [
					{ userId },
					{ teacherId: userId },
					{ yogaSession: { trainerId: userId } },
				],
			},
		}),
		prisma.liveSession.deleteMany({ where: { instructorId: userId } }),
		prisma.teacherAvailability.deleteMany({ where: { teacherId: userId } }),
		prisma.yogaSession.deleteMany({ where: { trainerId: userId } }),

		// Reviews, chat, commerce
		prisma.review.deleteMany({ where: { userId } }),
		prisma.chatMessage.deleteMany({ where: { senderId: userId } }),
		prisma.serviceOffering.deleteMany({ where: { providerId: userId } }),
		prisma.product.deleteMany({ where: { sellerId: userId } }),

		// Travel
		prisma.travelBooking.deleteMany({ where: { userId } }),
		prisma.hotelBooking.deleteMany({ where: { userId } }),
		prisma.travelPortalQuery.deleteMany({ where: { userId } }),

		// Profile media & addresses
		prisma.image.deleteMany({ where: { userId } }),
		prisma.video.deleteMany({ where: { userId } }),
		prisma.address.deleteMany({ where: { userId } }),

		prisma.user.delete({ where: { id: userId } }),
	]);
}
