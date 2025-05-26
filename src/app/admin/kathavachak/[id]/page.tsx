"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    User,
    Phone,
    Mail,
    Calendar,
    MapPin,
    BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

// Mock kathavachak data - in a real app, you would fetch this from an API
const mockKathavachakDetails = {
    "1": {
        id: "1",
        name: "Pandit Ramesh Sharma",
        category: "Bhagavad Gita",
        phone: "+91 9876543210",
        email: "ramesh.sharma@gmail.com",
        status: "Active",
        rank: "Senior",
        address: "123 Ganga Nagar, New Delhi, 110001",
        joinedDate: "2023-05-15",
        lastActive: "2023-06-24T08:30:00",
        avatar: "/avatars/ramesh.jpg",
        bio: "Experienced Kathavachak with 15 years of expertise in Bhagavad Gita discourses. Has conducted over 200 sessions across India.",
        preferences: {
            notifications: true,
            newsletter: true,
            language: "Hindi",
        },
        activities: [
            { date: "2023-06-20", action: "Conducted Gita session" },
            { date: "2023-06-15", action: "Published new article" },
            { date: "2023-06-10", action: "Attended Dharma conference" },
        ],
    },
    "2": {
        id: "2",
        name: "Acharya Priya Joshi",
        category: "Ramayana",
        phone: "+91 8765432109",
        email: "priya.joshi@gmail.com",
        status: "Active",
        rank: "Expert",
        address: "456 Krishna Colony, Mumbai, 400001",
        joinedDate: "2023-04-10",
        lastActive: "2023-06-22T14:15:00",
        avatar: "/avatars/priya.jpg",
        bio: "Renowned Ramayana expert with deep knowledge of ancient texts and interpretations. Popular speaker at cultural and religious events.",
        preferences: {
            notifications: true,
            newsletter: false,
            language: "English",
        },
        activities: [
            { date: "2023-06-18", action: "Conducted Ramayana workshop" },
            { date: "2023-06-05", action: "Released audio lecture series" },
            { date: "2023-05-25", action: "Participated in panel discussion" },
        ],
    },
    "3": {
        id: "3",
        name: "Swami Amit Trivedi",
        category: "Vedas",
        phone: "+91 7654321098",
        email: "amit.trivedi@gmail.com",
        status: "Inactive",
        rank: "Master",
        address: "789 Ram Nagar, Bangalore, 560001",
        joinedDate: "2023-03-22",
        lastActive: "2023-05-10T11:45:00",
        avatar: "/avatars/amit.jpg",
        bio: "Vedic scholar with extensive knowledge of Sanskrit and ancient texts. Has authored several books on Vedic philosophy and practices.",
        preferences: {
            notifications: false,
            newsletter: true,
            language: "Sanskrit",
        },
        activities: [
            { date: "2023-05-08", action: "Published research paper" },
            { date: "2023-04-30", action: "Conducted Vedic chanting workshop" },
            { date: "2023-04-15", action: "Gave interview for documentary" },
        ],
    },
    "4": {
        id: "4",
        name: "Pandit Deepika Singh",
        category: "Puranas",
        phone: "+91 6543210987",
        email: "deepika.singh@gmail.com",
        status: "Active",
        rank: "Senior",
        address: "321 Shiva Lane, Chennai, 600001",
        joinedDate: "2023-02-14",
        lastActive: "2023-06-23T16:20:00",
        avatar: "/avatars/deepika.jpg",
        bio: "Specialist in Puranic literature with a focus on Shiva Purana and Bhagavata Purana. Known for engaging storytelling style.",
        preferences: {
            notifications: true,
            newsletter: true,
            language: "Tamil",
        },
        activities: [
            { date: "2023-06-20", action: "Conducted Purana discourse series" },
            { date: "2023-06-12", action: "Released new book" },
            { date: "2023-06-01", action: "Organized youth workshop" },
        ],
    },
    "5": {
        id: "5",
        name: "Acharya Vikram Mehta",
        category: "Upanishads",
        phone: "+91 5432109876",
        email: "vikram.mehta@gmail.com",
        status: "Inactive",
        rank: "Junior",
        address: "654 Hanuman Road, Jaipur, 302001",
        joinedDate: "2023-01-30",
        lastActive: "2023-04-15T09:10:00",
        avatar: "/avatars/vikram.jpg",
        bio: "Emerging scholar of Upanishadic philosophy with modern interpretations. Specializes in making ancient wisdom accessible to contemporary audiences.",
        preferences: {
            notifications: false,
            newsletter: false,
            language: "English",
        },
        activities: [
            { date: "2023-04-12", action: "Started online course" },
            { date: "2023-03-28", action: "Gave lecture at university" },
            { date: "2023-03-10", action: "Published article in journal" },
        ],
    },
};

// Categories for Kathavachaks
const kathavachakCategories = [
    "Bhagavad Gita",
    "Ramayana",
    "Mahabharata",
    "Vedas",
    "Puranas",
    "Upanishads",
    "Bhakti Yoga",
    "Other",
];

// Ranks for Kathavachaks
const kathavachakRanks = ["Junior", "Senior", "Expert", "Master"];
interface Activity {
    date: string;
    action: string;
}
interface Kathavachak {
    id: string;
    name: string;
    email: string;
    phone: string;
    category: string;
    status: string;
    rank: string;
    address: string;
    joinedDate: string;
    avatar?: string;
    bio?: string;
    preferences: {
        notifications: boolean;
        newsletter: boolean;
        language: string;
    };
    activities: { date: string; action: string }[];
}
export default function KathavachakDetailPage() {
    const params = useParams();
    const router = useRouter();
    const kathavachakId = params.id as string;

    const [kathavachak, setKathavachak] = useState<Kathavachak | null>(null);
    const [editedKathavachak, setEditedKathavachak] =
        useState<Kathavachak | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Memoize the fetch function and add proper dependencies
    const fetchKathavachakData = useCallback(() => {
        // First check mock data
        let kathavachakData =
            mockKathavachakDetails[
                kathavachakId as keyof typeof mockKathavachakDetails
            ];

        // If not found in mock data, check localStorage
        if (!kathavachakData && typeof window !== "undefined") {
            const savedKathavachaks = localStorage.getItem("kathavachaks");
            if (savedKathavachaks) {
                const allKathavachaks = JSON.parse(savedKathavachaks);
                kathavachakData = allKathavachaks.find(
                    (k: Kathavachak) => k.id === kathavachakId
                );
            }
        }

        if (kathavachakData) {
            // Ensure preferences and activities are properly initialized
            const kathavachakWithPreferences = {
                ...kathavachakData,
                preferences: {
                    notifications: kathavachakData.preferences?.notifications ?? true,
                    newsletter: kathavachakData.preferences?.newsletter ?? true,
                    language: kathavachakData.preferences?.language ?? "en",
                },
                activities: kathavachakData.activities || [], // Ensure activities is always an array
            };
            setKathavachak(kathavachakWithPreferences);
            setEditedKathavachak({ ...kathavachakWithPreferences });
        } else {
            // If kathavachak not found, redirect to kathavachaks list
            router.push("/admin/kathavachak");
        }
    }, [kathavachakId, router]);

    const handleSaveChanges = () => {
        if (!editedKathavachak) return;

        // Update the kathavachak in localStorage
        if (typeof window !== "undefined") {
            const savedKathavachaks = localStorage.getItem("kathavachaks");
            if (savedKathavachaks) {
                let allKathavachaks = JSON.parse(savedKathavachaks);
                allKathavachaks = allKathavachaks.map((k: Kathavachak) =>
                    k.id === kathavachakId ? { ...editedKathavachak } : k
                );
                localStorage.setItem("kathavachaks", JSON.stringify(allKathavachaks));
            }
        }

        setKathavachak(editedKathavachak);
        setIsEditing(false);
        // In a real app, you would save changes to the backend
        alert("Kathavachak details updated successfully!");
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid date";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(date);
    };

    // Call the memoized function
    useEffect(() => {
        fetchKathavachakData();
    }, [fetchKathavachakData]);

    if (!kathavachak) {
        return <div className="p-6">Loading kathavachak details...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push("/admin/kathavachak")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Kathavachak Details</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Kathavachak Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                            {kathavachak.avatar && !imageError ? (
                                <Image
                                    src={kathavachak.avatar}
                                    alt={kathavachak.name}
                                    width={96}
                                    height={96}
                                    className="w-full h-full rounded-full object-cover"
                                    onError={() => setImageError(true)}
                                    unoptimized={true} // Only needed if using external URLs
                                />
                            ) : (
                                <User className="h-12 w-12 text-muted-foreground" />
                            )}
                        </div>
                        <CardTitle>{kathavachak.name}</CardTitle>
                        <CardDescription>
                            <div className="flex flex-col gap-2 items-center">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        kathavachak.status === "Active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {kathavachak.status}
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {kathavachak.rank}
                                </span>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{kathavachak.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{kathavachak.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{kathavachak.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Joined: {formatDate(kathavachak.joinedDate)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{kathavachak.address}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant={isEditing ? "outline" : "default"}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? "Cancel Editing" : "Edit Kathavachak"}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Tabs Section */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="details">
                        <TabsList className="grid grid-cols-3 mb-4">
                            <TabsTrigger value="details">Kathavachak Details</TabsTrigger>
                            <TabsTrigger value="preferences">Preferences</TabsTrigger>
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>
                                        Update kathavachak&apos;s personal details and contact
                                        information.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isEditing ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={editedKathavachak?.name || ""}
                                                        onChange={(e) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            name: e.target.value,
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={editedKathavachak?.email || ""}
                                                        onChange={(e) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            email: e.target.value,
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">Phone</Label>
                                                    <Input
                                                        id="phone"
                                                        value={editedKathavachak?.phone || ""}
                                                        onChange={(e) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            phone: e.target.value,
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Category</Label>
                                                    <Select
                                                        value={editedKathavachak?.category || ""}
                                                        onValueChange={(value) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            category: value,
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger id="category">
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {kathavachakCategories.map((category) => (
                                                                    <SelectItem key={category} value={category}>
                                                                        {category}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rank">Rank</Label>
                                                    <Select
                                                        value={editedKathavachak?.rank || ""}
                                                        onValueChange={(value) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            rank: value,
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger id="rank">
                                                            <SelectValue placeholder="Select rank" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {kathavachakRanks.map((rank) => (
                                                                    <SelectItem key={rank} value={rank}>
                                                                        {rank}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="status">Status</Label>
                                                    <Select
                                                        value={editedKathavachak?.status || ""}
                                                        onValueChange={(value) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            status: value,
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger id="status">
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="Active">Active</SelectItem>
                                                                <SelectItem value="Inactive">
                                                                    Inactive
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address">Address</Label>
                                                <Input
                                                    id="address"
                                                    value={editedKathavachak?.address || ""}
                                                    onChange={(e) =>
                                                        setEditedKathavachak((prev) =>
                                                            prev
                                                                ? {
                                                                        ...prev,
                                                                        address: e.target.value,
                                                                }
                                                                : null
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bio">Bio</Label>
                                                <Textarea
                                                    id="bio"
                                                    value={editedKathavachak?.bio || ""}
                                                    onChange={(e) =>
                                                        setEditedKathavachak((prev) =>
                                                            prev
                                                                ? {
                                                                        ...prev,
                                                                        bio: e.target.value,
                                                                }
                                                                : null
                                                        )
                                                    }
                                                    rows={4}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/30 rounded-lg">
                                                <h3 className="font-medium mb-2">About</h3>
                                                <p className="text-muted-foreground">
                                                    {kathavachak.bio}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                                                <div>
                                                    <h3 className="text-sm text-muted-foreground">
                                                        Full Name
                                                    </h3>
                                                    <p className="font-medium">{kathavachak.name}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm text-muted-foreground">
                                                        Email
                                                    </h3>
                                                    <p className="font-medium">{kathavachak.email}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm text-muted-foreground">
                                                        Phone
                                                    </h3>
                                                    <p className="font-medium">{kathavachak.phone}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm text-muted-foreground">
                                                        Category
                                                    </h3>
                                                    <p className="font-medium">{kathavachak.category}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm text-muted-foreground">
                                                        Rank
                                                    </h3>
                                                    <p className="font-medium">{kathavachak.rank}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm text-muted-foreground">
                                                        Status
                                                    </h3>
                                                    <p className="font-medium">{kathavachak.status}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <h3 className="text-sm text-muted-foreground">
                                                        Address
                                                    </h3>
                                                    <p className="font-medium">{kathavachak.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                {isEditing && (
                                    <CardFooter>
                                        <Button onClick={handleSaveChanges} className="w-full">
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </TabsContent>

                        <TabsContent value="preferences" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kathavachak Preferences</CardTitle>
                                    <CardDescription>
                                        Manage notification settings and kathavachak preferences.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="notifications">
                                                        Email Notifications
                                                    </Label>
                                                    <input
                                                        type="checkbox"
                                                        id="notifications"
                                                        checked={
                                                            editedKathavachak?.preferences?.notifications ??
                                                            false
                                                        }
                                                        onChange={(e) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            preferences: {
                                                                                ...prev.preferences,
                                                                                notifications: e.target.checked,
                                                                            },
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                        className="h-4 w-4"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="newsletter">
                                                        Subscribe to Newsletter
                                                    </Label>
                                                    <input
                                                        type="checkbox"
                                                        id="newsletter"
                                                        checked={
                                                            editedKathavachak?.preferences?.newsletter ??
                                                            false
                                                        }
                                                        onChange={(e) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            preferences: {
                                                                                ...prev.preferences,
                                                                                newsletter: e.target.checked,
                                                                            },
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                        className="h-4 w-4"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="language">Preferred Language</Label>
                                                    <Select
                                                        value={
                                                            editedKathavachak?.preferences?.language || ""
                                                        }
                                                        onValueChange={(value) =>
                                                            setEditedKathavachak((prev) =>
                                                                prev
                                                                    ? {
                                                                            ...prev,
                                                                            preferences: {
                                                                                ...prev.preferences,
                                                                                language: value,
                                                                            },
                                                                    }
                                                                    : null
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger id="language">
                                                            <SelectValue placeholder="Select language" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="Hindi">Hindi</SelectItem>
                                                                <SelectItem value="English">English</SelectItem>
                                                                <SelectItem value="Sanskrit">
                                                                    Sanskrit
                                                                </SelectItem>
                                                                <SelectItem value="Tamil">Tamil</SelectItem>
                                                                <SelectItem value="Bengali">Bengali</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <h3 className="text-sm text-muted-foreground">
                                                            Email Notifications
                                                        </h3>
                                                        <p className="font-medium">
                                                            {kathavachak.preferences?.notifications
                                                                ? "Enabled"
                                                                : "Disabled"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm text-muted-foreground">
                                                            Newsletter
                                                        </h3>
                                                        <p className="font-medium">
                                                            {kathavachak.preferences?.newsletter
                                                                ? "Subscribed"
                                                                : "Not Subscribed"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm text-muted-foreground">
                                                            Preferred Language
                                                        </h3>
                                                        <p className="font-medium">
                                                            {kathavachak.preferences?.language}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                {isEditing && (
                                    <CardFooter>
                                        <Button onClick={handleSaveChanges} className="w-full">
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Preferences
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Log</CardTitle>
                                    <CardDescription>
                                        Recent kathavachak activities and interactions.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {kathavachak?.activities?.length ? (
                                            kathavachak.activities.map(
                                                (activity: Activity, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                                                    >
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{activity.action}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatDate(activity.date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">
                                                No activities found
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
