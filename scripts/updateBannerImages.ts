import prisma from "../src/lib/prisma";

async function updateBannerImages() {
	const dharmgurus = await prisma.user.findMany({
		where: { userType: "Dharmguru" },
	});
	for (const guru of dharmgurus) {
		await prisma.user.update({
			where: { id: guru.id },
			data: {
				bannerImageUrl: null,
			},
		});
	}
	console.log("Banner images updated!");
	await prisma.$disconnect();
}

updateBannerImages().catch((e) => {
	console.error(e);
	prisma.$disconnect();
});
