"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Save,
	Plus,
	Trash2,
	Video as VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
	CardDescription,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { toast } from "@/lib/toast";

type Product = {
	id: string;
	name: string;
	description?: string;
	category: string[]; // <-- should be string[]
	date: string;
	pricePerUnit: number;
	availableQty: number;
	status: string;
	images: string[];
	videos: string[];
	createdAt?: string;
	updatedAt?: string;
};

const statusOptions = [
	{ value: "Active", label: "Active" },
	{ value: "Inactive", label: "Inactive" },
];

const getStatusColor = (status: string) =>
	status === "Active"
		? "bg-green-100 text-green-800"
		: "bg-red-100 text-red-800";

const formatDate = (dateString: string | Date) => {
	if (!dateString) return "N/A";
	const date =
		typeof dateString === "string" ? new Date(dateString) : dateString;
	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

export default function ProductDetailPage() {
	const params = useParams();
	const router = useRouter();
	const productId = params?.id as string;

	const [product, setProduct] = useState<Product | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editedProduct, setEditedProduct] = useState<Product | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [imageInput, setImageInput] = useState("");
	const [videoInput, setVideoInput] = useState("");
	const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
	const [isAddingCategory, setIsAddingCategory] = useState(false);
	const [newCategory, setNewCategory] = useState("");
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const response = await fetch(`/api/e-shop/${productId}`);
				if (!response.ok) throw new Error("Failed to fetch product");
				const data = await response.json();
				setProduct(data);
				setEditedProduct(data);
			} catch {
				router.push("/admin/e-shop");
			}
		};
		if (productId) fetchProduct();
	}, [productId, router]);

	useEffect(() => {
		// Fetch all categories for dropdown
		const fetchCategories = async () => {
			try {
				const response = await fetch("/api/categories");
				if (!response.ok) return;
				const data: string[] = await response.json();
				// Remove duplicates just in case
				const uniqueCategories = Array.from(new Set(data));
				setCategoryOptions(uniqueCategories);
			} catch {}
		};
		fetchCategories();
	}, []);

	const validateForm = (data: Product) => {
		const errors: Record<string, string> = {};
		if (!data.name?.trim()) errors.name = "Product name is required";
		if (!data.date?.trim()) errors.date = "Date is required";
		if (!data.category) errors.category = "Category is required";
		if (
			data.pricePerUnit === undefined ||
			isNaN(Number(data.pricePerUnit)) ||
			Number(data.pricePerUnit) < 0
		)
			errors.pricePerUnit = "Price per unit is required and must be >= 0";
		if (
			data.availableQty === undefined ||
			isNaN(Number(data.availableQty)) ||
			Number(data.availableQty) < 0
		)
			errors.availableQty = "Available quantity is required and must be >= 0";
		if (!data.status) errors.status = "Status is required";
		return errors;
	};

	const handleSave = async () => {
		if (!editedProduct) return;
		const validation = validateForm(editedProduct);
		setErrors(validation);
		if (Object.keys(validation).length > 0) return;
		setIsSaving(true);
		try {
			const response = await fetch(`/api/e-shop/${productId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(editedProduct),
			});
			if (!response.ok) throw new Error("Failed to update product");
			const updated = await response.json();
			setProduct(updated);
			setEditedProduct(updated);
			setIsEditing(false);
			toast.success("Product updated successfully!");
		} catch {
			toast.error("Failed to update product");
		} finally {
			setIsSaving(false);
		}
	};

	const handleAddImage = () => {
		const url = imageInput.trim();
		if (!url || !editedProduct) return;
		if (editedProduct.images.includes(url)) return;
		setEditedProduct({
			...editedProduct,
			images: [...editedProduct.images, url],
		});
		setImageInput("");
	};
	// --- Image Upload ---
	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || !editedProduct) return;
		setIsUploadingImage(true);
		const uploaded: string[] = [];
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("productId", productId);
				const response = await fetch("/api/upload/product-image", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload image");
				const { imageUrl } = await response.json();
				uploaded.push(imageUrl);
			}
			setEditedProduct({
				...editedProduct,
				images: [...editedProduct.images, ...uploaded],
			});
			toast.success("Image(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload image(s)");
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleRemoveImage = (url: string) => {
		if (!editedProduct) return;
		setEditedProduct({
			...editedProduct,
			images: editedProduct.images.filter((img) => img !== url),
		});
	};

	const handleAddVideo = () => {
		const url = videoInput.trim();
		if (!url || !editedProduct) return;
		if (editedProduct.videos.includes(url)) return;
		setEditedProduct({
			...editedProduct,
			videos: [...editedProduct.videos, url],
		});
		setVideoInput("");
	};
	// --- Video Upload ---
	const handleVideoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || !editedProduct) return;
		setIsUploadingVideo(true);
		const uploaded: string[] = [];
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("productId", productId);
				const response = await fetch("/api/upload/product-video", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) throw new Error("Failed to upload video");
				const { videoUrl } = await response.json();
				uploaded.push(videoUrl);
			}
			setEditedProduct({
				...editedProduct,
				videos: [...editedProduct.videos, ...uploaded],
			});
			toast.success("Video(s) uploaded successfully!");
		} catch {
			toast.error("Failed to upload video(s)");
		} finally {
			setIsUploadingVideo(false);
		}
	};

	const handleRemoveVideo = (url: string) => {
		if (!editedProduct) return;
		setEditedProduct({
			...editedProduct,
			videos: editedProduct.videos.filter((vid) => vid !== url),
		});
	};

	const handleAddCategory = () => {
		const trimmed = newCategory.trim();
		if (!trimmed) return;
		if (!categoryOptions.includes(trimmed)) {
			setCategoryOptions((prev) => [...prev, trimmed]);
		}
		if (editedProduct) {
			setEditedProduct({ ...editedProduct, category: [trimmed] });
		}
		setNewCategory("");
		setIsAddingCategory(false);
	};

	if (!product || !editedProduct) {
		return (
			<div className="flex justify-center items-center h-40">Loading...</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/e-shop")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">Product Details</h1>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="md:col-span-1 h-fit">
					<CardHeader className="text-center p-4 pb-2">
						<CardTitle className="text-center text-lg">
							{product.name}
						</CardTitle>
						<CardDescription>
							<span
								className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
									product.status
								)}`}
							>
								{product.status}
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-4 pt-0">
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Category:</span>
							<span>
								{Array.isArray(product.category)
									? product.category[0]
									: product.category}
							</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Date:</span>
							<span>{product.date ? formatDate(product.date) : "N/A"}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Price per Unit:</span>
							<span>₹{product.pricePerUnit?.toLocaleString("en-IN")}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="font-medium">Available Stock:</span>
							<span>{product.availableQty}</span>
						</div>
					</CardContent>
					<CardFooter className="p-4 pt-0">
						<Button
							className="w-full text-sm h-8"
							variant={isEditing ? "outline" : "default"}
							onClick={() => setIsEditing(!isEditing)}
						>
							{isEditing ? "Cancel" : "Edit Product"}
						</Button>
					</CardFooter>
				</Card>
				<div className="md:col-span-2">
					{/* Only show the edit card if editing, otherwise show the details card */}
					{isEditing ? (
						<Card>
							<CardHeader>
								<CardTitle>Edit Product</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* All editable fields in one card */}
								<div className="space-y-2">
									<Label htmlFor="name">Product Name *</Label>
									<Input
										id="name"
										value={editedProduct.name}
										onChange={(e) =>
											setEditedProduct({
												...editedProduct,
												name: e.target.value,
											})
										}
										className={errors.name ? "border-red-500" : ""}
									/>
									{errors.name && (
										<p className="text-sm text-red-500">{errors.name}</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="date">Date *</Label>
									<Input
										id="date"
										type="date"
										value={editedProduct.date}
										onChange={(e) =>
											setEditedProduct({
												...editedProduct,
												date: e.target.value,
											})
										}
										className={errors.date ? "border-red-500" : ""}
									/>
									{errors.date && (
										<p className="text-sm text-red-500">{errors.date}</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="category">Category *</Label>
									{isAddingCategory ? (
										<div className="flex gap-2">
											<Input
												id="newCategory"
												value={newCategory}
												onChange={(e) => setNewCategory(e.target.value)}
												placeholder="Enter new category"
												autoFocus
												className={errors.category ? "border-red-500" : ""}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddCategory();
													}
													if (e.key === "Escape") {
														setIsAddingCategory(false);
														setNewCategory("");
													}
												}}
											/>
											<Button
												type="button"
												variant="outline"
												onClick={handleAddCategory}
												disabled={!newCategory.trim()}
											>
												Add
											</Button>
											<Button
												type="button"
												variant="ghost"
												onClick={() => {
													setIsAddingCategory(false);
													setNewCategory("");
												}}
											>
												Cancel
											</Button>
										</div>
									) : (
										<div className="flex gap-2">
											<Select
												value={editedProduct.category?.[0] || ""}
												onValueChange={(value) =>
													setEditedProduct({
														...editedProduct,
														category: [value],
													})
												}
											>
												<SelectTrigger
													id="category"
													className={errors.category ? "border-red-500" : ""}
												>
													<SelectValue placeholder="Select category" />
												</SelectTrigger>
												<SelectContent>
													{categoryOptions
														.filter((cat, idx, arr) => arr.indexOf(cat) === idx)
														.map((cat) => (
															<SelectItem key={cat} value={cat}>
																{cat}
															</SelectItem>
														))}
												</SelectContent>
											</Select>
											{/* <Button
												type="button"
												variant="outline"
												onClick={() => setIsAddingCategory(true)}
											>
												Add New
											</Button> */}
										</div>
									)}
									{errors.category && (
										<p className="text-sm text-red-500">{errors.category}</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="pricePerUnit">Price per Unit (₹) *</Label>
									<Input
										id="pricePerUnit"
										type="number"
										min={0}
										step="any"
										value={editedProduct.pricePerUnit}
										onChange={(e) =>
											setEditedProduct({
												...editedProduct,
												pricePerUnit: Number(e.target.value),
											})
										}
										className={errors.pricePerUnit ? "border-red-500" : ""}
									/>
									{errors.pricePerUnit && (
										<p className="text-sm text-red-500">
											{errors.pricePerUnit}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="availableQty">Available Quantity *</Label>
									<Input
										id="availableQty"
										type="number"
										min={0}
										step={1}
										value={editedProduct.availableQty}
										onChange={(e) =>
											setEditedProduct({
												...editedProduct,
												availableQty: Number(e.target.value),
											})
										}
										className={errors.availableQty ? "border-red-500" : ""}
									/>
									{errors.availableQty && (
										<p className="text-sm text-red-500">
											{errors.availableQty}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="status">Status *</Label>
									<Select
										value={editedProduct.status}
										onValueChange={(value) =>
											setEditedProduct({ ...editedProduct, status: value })
										}
									>
										<SelectTrigger
											id="status"
											className={errors.status ? "border-red-500" : ""}
										>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.status && (
										<p className="text-sm text-red-500">{errors.status}</p>
									)}
								</div>
								<div className="space-y-2">
									<Label>Description</Label>
									<Input
										value={editedProduct.description || ""}
										onChange={(e) =>
											setEditedProduct({
												...editedProduct,
												description: e.target.value,
											})
										}
										placeholder="Enter product description"
									/>
								</div>
								{/* Images Section */}
								<div className="space-y-2">
									<Label>Product Images</Label>
									<div className="flex flex-wrap gap-3">
										{editedProduct.images.map((img, idx) => (
											<div
												key={img}
												className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
											>
												<Image
													src={img}
													alt={`Product Image ${idx + 1}`}
													fill
													sizes="128px"
													style={{ objectFit: "cover" }}
													className="object-cover w-full h-full"
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveImage(img)}
													className="absolute top-1 right-1 bg-white/80"
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</div>
										))}
										<label className="w-32 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
											<Plus className="h-6 w-6 text-gray-400" />
											<span className="text-xs text-gray-500">Add Image</span>
											<input
												type="file"
												accept="image/*"
												multiple
												className="hidden"
												onChange={handleImageUpload}
												disabled={isUploadingImage}
											/>
										</label>
									</div>
									{isUploadingImage && (
										<p className="text-xs text-blue-600">
											Uploading image(s)...
										</p>
									)}
								</div>
								{/* Videos Section */}
								<div className="space-y-2">
									<Label>Product Videos</Label>
									<div className="flex flex-wrap gap-3">
										{editedProduct.videos.map((vid) => (
											<div
												key={vid}
												className="relative w-40 h-24 rounded border overflow-hidden flex items-center justify-center bg-muted"
											>
												<video
													src={vid}
													controls
													className="object-cover w-full h-full"
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveVideo(vid)}
													className="absolute top-1 right-1 bg-white/80"
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</div>
										))}
										<label className="w-40 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer bg-muted hover:bg-gray-100 transition">
											<VideoIcon className="h-6 w-6 text-gray-400" />
											<span className="text-xs text-gray-500">Add Video</span>
											<input
												type="file"
												accept="video/mp4,video/webm,video/ogg"
												multiple
												className="hidden"
												onChange={handleVideoUpload}
												disabled={isUploadingVideo}
											/>
										</label>
									</div>
									{isUploadingVideo && (
										<p className="text-xs text-blue-600">
											Uploading video(s)...
										</p>
									)}
								</div>
							</CardContent>
							<CardFooter>
								<Button onClick={handleSave} disabled={isSaving}>
									{isSaving ? (
										<>
											<Save className="h-4 w-4 mr-2 animate-spin" />
											Saving...
										</>
									) : (
										<>
											<Save className="h-4 w-4 mr-2" />
											Save Changes
										</>
									)}
								</Button>
							</CardFooter>
						</Card>
					) : (
						<Card>
							<CardHeader>
								<CardTitle>Product Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">
										Description
									</h3>
									<p className="font-medium text-foreground whitespace-pre-wrap">
										{product.description || "No description provided"}
									</p>
								</div>
								{product.images && product.images.length > 0 && (
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Images
										</h3>
										<div className="flex flex-wrap gap-3">
											{product.images.map((img, idx) => (
												<div
													key={img}
													className="relative w-32 h-20 rounded border overflow-hidden flex items-center justify-center bg-muted"
												>
													<Image
														src={img}
														alt={`Product Image ${idx + 1}`}
														fill
														sizes="128px"
														style={{ objectFit: "cover" }}
														className="object-cover w-full h-full"
													/>
												</div>
											))}
										</div>
									</div>
								)}
								{product.videos && product.videos.length > 0 && (
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground">
											Videos
										</h3>
										<div className="flex flex-wrap gap-3">
											{product.videos.map((vid) => (
												<div
													key={vid}
													className="relative w-40 h-24 rounded border overflow-hidden flex items-center justify-center bg-muted"
												>
													<video
														src={vid}
														controls
														className="object-cover w-full h-full"
													/>
												</div>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
