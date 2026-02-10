"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
	Mail,
	Phone,
	MapPin,
	Clock,
	Send,
	MessageSquare,
	Users,
	Headphones,
	CheckCircle,
	Sparkles,
	Star,
	ArrowRight,
	Zap,
	Globe,
} from "lucide-react";
import {
	motion,
	useScroll,
	useTransform,
	useInView,
	useSpring,
} from "framer-motion";

export default function ContactUsSection() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		subject: "",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const sectionRef = useRef<HTMLDivElement>(null);
	const statsRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
	const isStatsInView = useInView(statsRef, { once: false, amount: 0.3 });

	// Parallax effect for decorative elements
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"],
	});

	const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
	const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);
	const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 20]);
	const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -20]);

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Simulate form submission
		await new Promise((resolve) => setTimeout(resolve, 2000));

		setIsSubmitting(false);
		setSubmitSuccess(true);
		setFormData({ name: "", email: "", phone: "", subject: "", message: "" });

		setTimeout(() => setSubmitSuccess(false), 5000);
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				delayChildren: 0.3,
			},
		},
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { duration: 0.6, ease: "easeOut" },
		},
	};

	const contactInfo = [
		{
			icon: <MapPin className="w-6 h-6" />,
			secondaryIcon: (
				<Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-orange-400" />
			),
			title: "Visit Us",
			description: "123 Spiritual Lane, Mumbai, Maharashtra 400001, India",
			action: "Get Directions",
		},
		{
			icon: <Phone className="w-6 h-6" />,
			secondaryIcon: (
				<CheckCircle className="w-4 h-4 absolute -top-1 -right-1 text-orange-400" />
			),
			title: "Call Us",
			description: "+91 98765 43210",
			action: "Call Now",
		},
		{
			icon: <Mail className="w-6 h-6" />,
			secondaryIcon: (
				<Star className="w-4 h-4 absolute -top-1 -right-1 text-orange-400" />
			),
			title: "Email Us",
			description: "contact@dharmlok.com",
			action: "Send Email",
		},
		{
			icon: <Clock className="w-6 h-6" />,
			secondaryIcon: (
				<Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-orange-400" />
			),
			title: "Working Hours",
			description: "Mon - Sat: 9:00 AM - 6:00 PM",
			action: "Schedule Meeting",
		},
	];

	const stats = [
		{
			icon: <MessageSquare />,
			value: 10000,
			label: "Messages Answered",
			suffix: "+",
		},
		{ icon: <Users />, value: 5000, label: "Happy Users", suffix: "+" },
		{ icon: <Headphones />, value: 24, label: "Hours Support", suffix: "/7" },
		{ icon: <Globe />, value: 50, label: "Cities Served", suffix: "+" },
	];

	const subjects = [
		"General Inquiry",
		"Pooja Booking",
		"Temple Information",
		"Technical Support",
		"Partnership",
		"Feedback",
		"Other",
	];

	return (
		<section
			id="contact-section"
			ref={sectionRef}
			className="w-full py-24 px-4 bg-gradient-to-b from-orange-50 to-amber-50 text-gray-800 overflow-hidden relative"
		>
			{/* Decorative background elements */}
			<motion.div
				className="absolute top-20 left-10 w-64 h-64 rounded-full bg-orange-500/5 blur-3xl"
				style={{ y: y1, rotate: rotate1 }}
			/>
			<motion.div
				className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl"
				style={{ y: y2, rotate: rotate2 }}
			/>
			<motion.div
				className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-orange-500/30"
				animate={{
					y: [0, -15, 0],
					opacity: [0.5, 1, 0.5],
				}}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			/>
			<motion.div
				className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-amber-500/30"
				animate={{
					y: [0, 20, 0],
					opacity: [0.5, 1, 0.5],
				}}
				transition={{
					duration: 4,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
					delay: 1,
				}}
			/>

			<motion.div
				className="container mx-auto max-w-6xl relative z-10"
				initial="hidden"
				animate={isInView ? "visible" : "hidden"}
				variants={containerVariants}
			>
				<motion.div
					className="flex flex-col items-center mb-6"
					variants={itemVariants}
				>
					<motion.span
						className="text-orange-600 font-medium mb-2 flex items-center gap-2"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						<Zap className="w-4 h-4" />
						GET IN TOUCH
					</motion.span>
					<h2 className="text-4xl md:text-5xl font-light mb-4 text-center">
						Contact Us
					</h2>
					<motion.div
						className="w-24 h-1 bg-orange-500"
						initial={{ width: 0 }}
						animate={{ width: 96 }}
						transition={{ duration: 1, delay: 0.5 }}
					></motion.div>
				</motion.div>

				<motion.p
					className="text-center max-w-2xl mx-auto mb-16 text-gray-600"
					variants={itemVariants}
				>
					We&apos;re here to help you on your spiritual journey. Whether you
					have questions about our services, need assistance with bookings, or
					want to share feedback, our team is ready to assist you.
				</motion.p>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
					{/* Contact Form */}
					<motion.div
						className="bg-white rounded-2xl shadow-xl p-8"
						variants={itemVariants}
						whileHover={{ y: -5, transition: { duration: 0.2 } }}
					>
						<h3 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
							<Send className="w-6 h-6 text-orange-500" />
							Send us a Message
						</h3>

						{submitSuccess && (
							<motion.div
								className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2"
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
							>
								<CheckCircle className="w-5 h-5" />
								Thank you! Your message has been sent successfully.
							</motion.div>
						)}

						<form onSubmit={handleSubmit} className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<motion.div
									className="space-y-2"
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3 }}
								>
									<label className="text-sm font-medium text-gray-700">
										Full Name *
									</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										required
										className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
										placeholder="Your name"
									/>
								</motion.div>

								<motion.div
									className="space-y-2"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.4 }}
								>
									<label className="text-sm font-medium text-gray-700">
										Email Address *
									</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										required
										className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
										placeholder="your@email.com"
									/>
								</motion.div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<motion.div
									className="space-y-2"
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.5 }}
								>
									<label className="text-sm font-medium text-gray-700">
										Phone Number
									</label>
									<input
										type="tel"
										name="phone"
										value={formData.phone}
										onChange={handleInputChange}
										className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
										placeholder="+91 98765 43210"
									/>
								</motion.div>

								<motion.div
									className="space-y-2"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.6 }}
								>
									<label className="text-sm font-medium text-gray-700">
										Subject *
									</label>
									<select
										name="subject"
										value={formData.subject}
										onChange={handleInputChange}
										required
										className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-white"
									>
										<option value="">Select a subject</option>
										{subjects.map((subject) => (
											<option key={subject} value={subject}>
												{subject}
											</option>
										))}
									</select>
								</motion.div>
							</div>

							<motion.div
								className="space-y-2"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.7 }}
							>
								<label className="text-sm font-medium text-gray-700">
									Message *
								</label>
								<textarea
									name="message"
									value={formData.message}
									onChange={handleInputChange}
									required
									rows={5}
									className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none"
									placeholder="How can we help you?"
								/>
							</motion.div>

							<motion.button
								type="submit"
								disabled={isSubmitting}
								className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								{isSubmitting ? (
									<>
										<motion.div
											className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
											animate={{ rotate: 360 }}
											transition={{
												duration: 1,
												repeat: Number.POSITIVE_INFINITY,
												ease: "linear",
											}}
										/>
										Sending...
									</>
								) : (
									<>
										Send Message <Send className="w-5 h-5" />
									</>
								)}
							</motion.button>
						</form>
					</motion.div>

					{/* Contact Info Cards */}
					<div className="space-y-6">
						{contactInfo.map((info, index) => (
							<ContactInfoCard
								key={index}
								icon={info.icon}
								secondaryIcon={info.secondaryIcon}
								title={info.title}
								description={info.description}
								action={info.action}
								variants={itemVariants}
								delay={index * 0.15}
							/>
						))}

						{/* Map Placeholder */}
						<motion.div
							className="rounded-2xl overflow-hidden shadow-lg h-48 relative group"
							variants={itemVariants}
							whileHover={{ y: -5, transition: { duration: 0.2 } }}
						>
							<Image
								src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
								alt="Map Location"
								fill
								className="object-cover group-hover:scale-110 transition-transform duration-500"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent flex items-end justify-center p-4">
								<motion.button
									className="bg-white text-gray-800 px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<MapPin className="w-4 h-4 text-orange-500" />
									View on Map
								</motion.button>
							</div>
						</motion.div>
					</div>
				</div>

				{/* Stats Section */}
				<motion.div
					ref={statsRef}
					className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
					initial="hidden"
					animate={isStatsInView ? "visible" : "hidden"}
					variants={containerVariants}
				>
					{stats.map((stat, index) => (
						<StatCounter
							key={index}
							icon={stat.icon}
							value={stat.value}
							label={stat.label}
							suffix={stat.suffix}
							delay={index * 0.1}
						/>
					))}
				</motion.div>

				{/* FAQ CTA Section */}
				<motion.div
					className="mt-20 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6"
					initial={{ opacity: 0, y: 30 }}
					animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
					transition={{ duration: 0.8, delay: 0.5 }}
				>
					<div className="flex-1">
						<h3 className="text-2xl font-medium mb-2">Have more questions?</h3>
						<p className="text-white/90">
							Check out our FAQ section for quick answers to common queries.
						</p>
					</div>
					<motion.button
						className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						View FAQs <ArrowRight className="w-4 h-4" />
					</motion.button>
				</motion.div>
			</motion.div>
		</section>
	);
}

interface ContactInfoCardProps {
	icon: React.ReactNode;
	secondaryIcon?: React.ReactNode;
	title: string;
	description: string;
	action: string;
	variants: {
		hidden: { opacity: number; y?: number };
		visible: {
			opacity: number;
			y?: number;
			transition: { duration: number; ease: string };
		};
	};
	delay: number;
}

function ContactInfoCard({
	icon,
	secondaryIcon,
	title,
	description,
	action,
	variants,
	delay,
}: ContactInfoCardProps) {
	return (
		<motion.div
			className="bg-white rounded-xl p-6 shadow-lg flex items-start gap-4 group hover:shadow-xl transition-shadow"
			variants={variants}
			transition={{ delay }}
			whileHover={{ y: -5, x: 5, transition: { duration: 0.2 } }}
		>
			<motion.div
				className="text-orange-500 bg-orange-100 p-3 rounded-lg transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white relative flex-shrink-0"
				whileHover={{
					rotate: [0, -10, 10, -5, 0],
					transition: { duration: 0.5 },
				}}
			>
				{icon}
				{secondaryIcon}
			</motion.div>
			<div className="flex-1">
				<h4 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
					{title}
				</h4>
				<p className="text-gray-600 text-sm mb-2">{description}</p>
				<motion.span
					className="text-orange-500 text-sm font-medium flex items-center gap-1 cursor-pointer"
					whileHover={{ x: 5 }}
				>
					{action} <ArrowRight className="w-4 h-4" />
				</motion.span>
			</div>
		</motion.div>
	);
}

interface StatCounterProps {
	icon: React.ReactNode;
	value: number;
	label: string;
	suffix: string;
	delay: number;
}

function StatCounter({ icon, value, label, suffix, delay }: StatCounterProps) {
	const countRef = useRef(null);
	const isInView = useInView(countRef, { once: false });
	const [hasAnimated, setHasAnimated] = useState(false);

	const springValue = useSpring(0, {
		stiffness: 50,
		damping: 10,
	});

	useEffect(() => {
		if (isInView && !hasAnimated) {
			springValue.set(value);
			setHasAnimated(true);
		} else if (!isInView && hasAnimated) {
			springValue.set(0);
			setHasAnimated(false);
		}
	}, [isInView, value, springValue, hasAnimated]);

	const displayValue = useTransform(springValue, (latest) =>
		Math.floor(latest),
	);

	return (
		<motion.div
			className="bg-white/70 backdrop-blur-sm p-6 rounded-xl flex flex-col items-center text-center group hover:bg-white transition-colors duration-300 shadow-lg"
			variants={{
				hidden: { opacity: 0, y: 20 },
				visible: {
					opacity: 1,
					y: 0,
					transition: { duration: 0.6, delay },
				},
			}}
			whileHover={{ y: -5, transition: { duration: 0.2 } }}
		>
			<motion.div
				className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300"
				whileHover={{ rotate: 360, transition: { duration: 0.8 } }}
			>
				{icon}
			</motion.div>
			<motion.div
				ref={countRef}
				className="text-3xl font-bold text-gray-800 flex items-center"
			>
				<motion.span>{displayValue}</motion.span>
				<span>{suffix}</span>
			</motion.div>
			<p className="text-gray-600 text-sm mt-1">{label}</p>
			<motion.div className="w-10 h-0.5 bg-orange-500 mt-3 group-hover:w-16 transition-all duration-300" />
		</motion.div>
	);
}
