import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	// Clear existing destinations
	await prisma.destination.deleteMany({});

	await prisma.destination.createMany({
		data: [
			{
				name: "Kedarnath Yatra",
				description:
					"A sacred journey to Lord Shiva's temple in the Himalayas. Experience the divine beauty of snow-capped peaks and spiritual tranquility at one of the twelve Jyotirlingas. Trek through breathtaking landscapes and witness the powerful energy of this ancient shrine.",
				image: "/travel-destinations/kedarnath.jpg",
				location: "Uttarakhand, India",
				category: "Pilgrimage",
				price: 15000,
				travelByAir: `<strong>Nearest Airport:</strong> Jolly Grant Airport, Dehradun (approx. 239 km)<br/><br/>
<strong>Flight Options:</strong><br/>
• Direct flights available from Delhi (1 hour)<br/>
• Connecting flights from Mumbai, Bangalore, Kolkata<br/><br/>
<strong>From Airport:</strong><br/>
• Taxi/Cab to Gaurikund (7-8 hours, ₹3000-4000)<br/>
• Helicopter services available from Phata/Sersi to Kedarnath (seasonal)<br/><br/>
<strong>Helicopter Booking:</strong><br/>
Advance booking recommended during peak season (May-June, Sep-Oct)`,
				travelByTrain: `<strong>Nearest Railway Station:</strong> Rishikesh Railway Station (225 km)<br/><br/>
<strong>Major Trains:</strong><br/>
• Nanda Devi Express (from Delhi)<br/>
• Jan Shatabdi Express<br/>
• Mussoorie Express<br/><br/>
<strong>From Railway Station:</strong><br/>
• Taxi to Gaurikund (6-7 hours, ₹2500-3500)<br/>
• Shared cabs available<br/><br/>
<strong>Alternative:</strong> Haridwar Railway Station (244 km) - well connected to major cities`,
				travelByBus: `<strong>ISBT Kashmiri Gate, Delhi to Rishikesh:</strong><br/>
• Regular Volvo and Ordinary buses (6-7 hours)<br/>
• Fare: ₹500-800<br/><br/>
<strong>Rishikesh to Gaurikund:</strong><br/>
• State transport buses available<br/>
• Private operators run regular services<br/>
• Journey time: 7-8 hours<br/><br/>
<strong>Direct Options:</strong><br/>
UPSRTC operates direct buses from major cities during pilgrimage season`,
				travelByRoad: `<strong>Route from Delhi:</strong> Delhi → Haridwar → Rishikesh → Srinagar → Rudraprayag → Gaurikund (465 km, 12-13 hours)<br/><br/>
<strong>Road Condition:</strong><br/>
• Well-maintained NH highway till Rishikesh<br/>
• Hilly roads after Rishikesh - drive carefully<br/>
• Monsoon season may cause landslides<br/><br/>
<strong>Final Trek:</strong><br/>
• 16 km trek from Gaurikund to Kedarnath<br/>
• Pony/Doli services available<br/>
• Trek duration: 6-8 hours`,
			},
			{
				name: "Rishikesh Yoga Retreat",
				description:
					"Find peace by the holy Ganges with meditation and yoga. Experience authentic ashram life, practice yoga on the riverbanks, attend evening Ganga Aarti, and discover inner peace in the Yoga Capital of the World.",
				image: "/travel-destinations/rishikesh.jpg",
				location: "Rishikesh, India",
				category: "Spiritual Wellness",
				price: 12000,
				travelByAir: `<strong>Nearest Airport:</strong> Jolly Grant Airport, Dehradun (21 km)<br/><br/>
<strong>Airlines Operating:</strong><br/>
• Air India, IndiGo, SpiceJet<br/>
• Direct flights from Delhi, Mumbai, Bangalore<br/><br/>
<strong>Airport Transfer:</strong><br/>
• Pre-paid taxi: ₹700-1000 (45 minutes)<br/>
• Private cabs available<br/>
• Many ashrams provide pickup services`,
				travelByTrain: `<strong>Rishikesh Railway Station:</strong> Well connected to major cities<br/><br/>
<strong>Popular Trains:</strong><br/>
• Dehradun Shatabdi Express (from Delhi)<br/>
• Nanda Devi Express<br/>
• Mussoorie Express<br/><br/>
<strong>From Station:</strong><br/>
• Auto-rickshaw to city center: ₹50-100<br/>
• Shared autos available<br/>
• Walking distance to many ashrams`,
				travelByBus: `<strong>From Delhi (240 km):</strong><br/>
• Volvo buses from ISBT Kashmiri Gate<br/>
• Ordinary buses available every 30 minutes<br/>
• Fare: ₹400-700<br/>
• Journey: 5-6 hours<br/><br/>
<strong>From Haridwar (25 km):</strong><br/>
• Frequent buses every 15 minutes<br/>
• Fare: ₹30-50<br/>
• Journey: 45 minutes`,
				travelByRoad: `<strong>NH 58 Route from Delhi:</strong> Delhi → Meerut → Roorkee → Haridwar → Rishikesh (240 km, 5-6 hours)<br/><br/>
<strong>Road Condition:</strong><br/>
• Excellent 6-lane highway<br/>
• Scenic drive along Ganges<br/>
• Multiple dhabas and rest stops<br/><br/>
<strong>Parking:</strong><br/>
Ample parking available near major ashrams and hotels`,
			},
			{
				name: "Varanasi Temple Tour",
				description:
					"Witness the mesmerizing Ganga Aarti and visit ancient temples of Varanasi. Walk through narrow lanes filled with history, experience the spiritual energy of the oldest living city, and take a sacred boat ride at sunrise on the Ganges.",
				image: "/travel-destinations/varansi.jpg",
				location: "Varanasi, Uttar Pradesh",
				category: "Pilgrimage",
				price: 10000,
				travelByAir: `<strong>Lal Bahadur Shastri Airport:</strong> 26 km from city center<br/><br/>
<strong>Well Connected To:</strong><br/>
• Daily flights from Delhi, Mumbai, Bangalore, Kolkata<br/>
• International connections via Delhi/Mumbai<br/><br/>
<strong>Airport Transfer:</strong><br/>
• Pre-paid taxi: ₹500-700 (45 minutes)<br/>
• App-based cabs: Ola, Uber available<br/>
• Hotel pickups can be arranged`,
				travelByTrain: `<strong>Varanasi Junction (Cantt):</strong> Main railway station<br/><br/>
<strong>Major Trains:</strong><br/>
• Kashi Vishwanath Express (from Delhi)<br/>
• Mahamana Express<br/>
• Poorva Express<br/>
• Shiv Ganga Express<br/><br/>
<strong>Other Stations:</strong><br/>
• Varanasi City Station (closer to ghats)<br/>
• Manduadih Station<br/><br/>
<strong>From Station:</strong> Auto-rickshaw to ghats: ₹100-150`,
				travelByBus: `<strong>From Lucknow (320 km):</strong><br/>
• UP Roadways AC/Non-AC buses<br/>
• Private Volvo operators<br/>
• Journey: 6-7 hours<br/><br/>
<strong>From Prayagraj (130 km):</strong><br/>
• Frequent buses every hour<br/>
• Journey: 3-4 hours<br/><br/>
<strong>Bus Stand:</strong><br/>
Varanasi Bus Stand located near railway station`,
				travelByRoad: `<strong>From Delhi (820 km):</strong> Delhi → Agra → Kanpur → Prayagraj → Varanasi (12-14 hours)<br/><br/>
<strong>From Lucknow (320 km):</strong> Via NH 56, excellent highway (5-6 hours)<br/><br/>
<strong>Road Condition:</strong><br/>
• Major highways well-maintained<br/>
• GPS recommended for navigating city<br/><br/>
<strong>Parking:</strong><br/>
Limited parking near ghats - use paid parking lots`,
			},
			{
				name: "Amarnath Cave Expedition",
				description:
					"Experience the divine journey to Lord Shiva's ice lingam shrine in the Himalayas. Embark on a challenging yet rewarding pilgrimage through stunning mountain landscapes, encountering devotion and spirituality at every step.",
				image: "/travel-destinations/amarnath.jpg",
				location: "Jammu & Kashmir, India",
				category: "Adventure Pilgrimage",
				price: 18000,
				travelByAir: `<strong>Nearest Airport:</strong> Sheikh ul-Alam Airport, Srinagar (95 km from Pahalgam)<br/><br/>
<strong>Flight Connectivity:</strong><br/>
• Direct flights from Delhi, Mumbai, Bangalore<br/>
• Air India, IndiGo, SpiceJet, GoAir<br/><br/>
<strong>Airport to Base Camp:</strong><br/>
• Taxi to Pahalgam: ₹2500-3500 (3 hours)<br/>
• Helicopter services to Panchtarni (registration required)<br/><br/>
<strong>Important:</strong> Advance registration mandatory for Yatra`,
				travelByTrain: `<strong>Nearest Railway Station:</strong> Jammu Tawi (290 km)<br/><br/>
<strong>Major Trains:</strong><br/>
• Swaraj Express (from Delhi)<br/>
• Himgiri Express<br/>
• Jammu Mail<br/><br/>
<strong>Jammu to Pahalgam:</strong><br/>
• Taxi: ₹3500-4500 (7-8 hours)<br/>
• Shared cabs available<br/><br/>
<strong>Registration:</strong> Yatra permit collection at designated counters`,
				travelByBus: `<strong>From Jammu to Pahalgam:</strong><br/>
• JKSRTC buses operate during Yatra season<br/>
• Private operators available<br/>
• Journey: 8-9 hours<br/><br/>
<strong>From Srinagar to Pahalgam:</strong><br/>
• Regular buses (96 km, 3 hours)<br/>
• Fare: ₹200-300<br/><br/>
<strong>Shuttle Service:</strong><br/>
Base camp to Chandanwari provided during Yatra`,
				travelByRoad: `<strong>Routes to Pahalgam Base Camp:</strong><br/>
• Via Jammu: Jammu → Udhampur → Ramban → Anantnag → Pahalgam (290 km)<br/>
• Via Srinagar: Srinagar → Anantnag → Pahalgam (96 km)<br/><br/>
<strong>Trek Routes (Choose One):</strong><br/>
1. <strong>Pahalgam Route:</strong> 48 km, 3-5 days<br/>
2. <strong>Baltal Route:</strong> 14 km, same day return<br/><br/>
<strong>Important:</strong> Registration, health certificate, and insurance mandatory`,
			},
			{
				name: "Bodh Gaya Spiritual Retreat",
				description:
					"Visit the sacred Bodhi Tree where Buddha attained enlightenment. Explore ancient monasteries, practice meditation at holy sites, and immerse yourself in the peaceful Buddhist culture and teachings in this UNESCO World Heritage Site.",
				image: "/travel-destinations/bodh gaya.jpg",
				location: "Bodh Gaya, Bihar",
				category: "Buddhist Pilgrimage",
				price: 14000,
				travelByAir: `<strong>Gaya International Airport:</strong> 12 km from Bodh Gaya<br/><br/>
<strong>Direct Flights From:</strong><br/>
• Delhi, Mumbai, Kolkata, Bangkok, Paro<br/>
• Air India, IndiGo, SpiceJet, Thai Airways<br/><br/>
<strong>Airport Transfer:</strong><br/>
• Pre-paid taxi: ₹300-400 (30 minutes)<br/>
• Auto-rickshaw available<br/>
• Many monasteries provide pickup service`,
				travelByTrain: `<strong>Gaya Junction:</strong> Major railway station (17 km)<br/><br/>
<strong>Well Connected Trains:</strong><br/>
• Mahabodhi Express (from Delhi)<br/>
• Poorva Express (from Howrah)<br/>
• Rajgir Express<br/><br/>
<strong>From Station:</strong><br/>
• Auto-rickshaw: ₹150-200 (30 minutes)<br/>
• Shared autos available<br/>
• Bus service to Bodh Gaya`,
				travelByBus: `<strong>From Gaya (17 km):</strong><br/>
• Regular buses every 15 minutes<br/>
• Bihar State Tourism buses<br/>
• Journey: 30-40 minutes<br/><br/>
<strong>From Patna (135 km):</strong><br/>
• Deluxe and ordinary buses<br/>
• Journey: 3-4 hours<br/><br/>
<strong>From Varanasi (250 km):</strong><br/>
• Direct buses available<br/>
• Journey: 5-6 hours`,
				travelByRoad: `<strong>From Patna (135 km):</strong> NH 83, excellent highway (2.5-3 hours)<br/><br/>
<strong>From Varanasi (250 km):</strong> Via Gaya, well-maintained roads (5-6 hours)<br/><br/>
<strong>Road Condition:</strong><br/>
• Good condition year-round<br/>
• Well-signposted<br/>
• Multiple dhabas and rest stops<br/><br/>
<strong>Local Transport:</strong><br/>
Cycle rickshaws and autos for monastery visits`,
			},
		],
	});

	console.log("✅ Travel destinations seeded successfully!");
}

main()
	.catch((e) => console.error(e))
	.finally(async () => await prisma.$disconnect());
