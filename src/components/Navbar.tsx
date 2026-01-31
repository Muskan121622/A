
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Settings, LogOut, MapPin, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import axios from "axios";
import { indianStates } from "@/data/indian_locations";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
        >
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <motion.div
                    className="flex items-center gap-2 cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    onClick={() => navigate('/')}
                >
                    <img
                        src="/Screenshot 2025-11-21 114200.png"
                        alt="AgriSphere AI Logo"
                        className="w-10 h-10 rounded-full object-cover shadow-glow-primary border-2 border-primary/30"
                    />
                    <span className="text-2xl font-bold gradient-text">AgriSphere AI</span>
                </motion.div>

                <nav className="hidden xl:flex items-center gap-6">
                    {(() => {
                        const userRole = user?.role;
                        const isGov = userRole === 'government';
                        const isBuyer = userRole === 'buyer';

                        return [
                            { name: "Home", path: "/", public: true, buyer: true },
                            { name: "Buyer Dashboard", path: "/buyer/dashboard", public: false, gov: false, buyer: true },
                            // Corrected Order as requested
                            { name: "Marketplace", path: "/marketplace", public: false, gov: false, buyer: false },
                            { name: "Community Forum", path: "/community", public: false, gov: false, buyer: false },
                            { name: "Advisory Hub", path: "/advisory-hub", public: false, gov: false, buyer: false },
                            { name: "Disease Detection", path: "/disease-detection", public: false, gov: false, buyer: false },
                            { name: "Digital Twin", path: "/digital-twin", public: false, gov: false, buyer: false },
                            { name: "Voice Assistant", path: "/voice-assistant", public: false, gov: false, buyer: false },
                            // Sensors = IoT Monitoring
                            // { name: "Sensors", path: "/iot-monitoring", public: false, gov: false, buyer: false }, // Removed as per instruction
                            { name: "Fertilizer AI", path: "/fertilizer-recommendation", public: false, gov: false, buyer: false },
                            { name: "Pest Forecast", path: "/pest-prediction", public: false, gov: false, buyer: false },

                            { name: "Admin Dashboard", path: "/gov/dashboard", public: false, gov: true, buyer: false },
                        ].filter(item => {
                            if (item.public) return !isAuthenticated;
                            if (!isAuthenticated) return false;

                            if (isGov) return item.gov === true || (item.public && item.name === 'Home');
                            if (isBuyer) return item.buyer === true || (item.public && item.name === 'Home');

                            // Default (Farmer)
                            return item.gov === false && item.buyer !== true;
                        }).map((item, i) => (
                            <motion.a
                                key={item.name}
                                href={item.path}
                                className="text-foreground/80 hover:text-foreground transition-colors relative group text-base font-medium"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300" />
                            </motion.a>
                        ));
                    })()}
                </nav>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {!isAuthenticated && (
                        <>
                            <Button
                                variant="outline"
                                className="hidden md:inline-flex"
                                onClick={() => navigate('/login')}
                            >
                                Login
                            </Button>
                            <Button
                                className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
                                onClick={() => navigate('/signup')}
                            >
                                Get Started
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </>
                    )}
                    {isAuthenticated && (
                        <UserProfileMenu />
                    )}
                </div>
            </div>
        </motion.header>
    );
};

// Internal Component for User Profile
const UserProfileMenu = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Extended Profile State
    const [profile, setProfile] = useState({
        name: localStorage.getItem("agrisphere_username") || "Farmer_User",
        email: localStorage.getItem("agrisphere_email") || "",
        bio: localStorage.getItem("agrisphere_bio") || "Passionate farmer.",
        photoUrl: localStorage.getItem("agrisphere_photo") || "",
        dob: localStorage.getItem("agrisphere_dob") || "",
        country: "India",
        state: localStorage.getItem("agrisphere_state") || "",
        district: localStorage.getItem("agrisphere_district") || "",
        village: localStorage.getItem("agrisphere_village") || "",
        farmSize: localStorage.getItem("agrisphere_farmSize") || "",
        experience: localStorage.getItem("agrisphere_experience") || "",
        crops: localStorage.getItem("agrisphere_crops") || ""
    });

    const API_URL = 'http://localhost:5000';

    // Reload Data on Open
    useEffect(() => {
        if (isOpen) {
            setProfile({
                name: localStorage.getItem("agrisphere_username") || "Farmer_User",
                email: localStorage.getItem("agrisphere_email") || "",
                bio: localStorage.getItem("agrisphere_bio") || "Passionate farmer.",
                photoUrl: localStorage.getItem("agrisphere_photo") || "",
                dob: localStorage.getItem("agrisphere_dob") || "",
                country: "India",
                state: localStorage.getItem("agrisphere_state") || "",
                district: localStorage.getItem("agrisphere_district") || "",
                village: localStorage.getItem("agrisphere_village") || "",
                farmSize: localStorage.getItem("agrisphere_farmSize") || "",
                experience: localStorage.getItem("agrisphere_experience") || "",
                crops: localStorage.getItem("agrisphere_crops") || ""
            });
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGPS = () => {
        setIsLoadingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Use OpenStreetMap Nominatim for free reverse geocoding
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const address = res.data.address;

                    // Extract village/town/city
                    const village = address.village || address.town || address.city || address.suburb || "";
                    const state = address.state || "";
                    const district = address.state_district || address.county || "";

                    setProfile(prev => ({
                        ...prev,
                        village: village,
                        // Try to auto-match state/district if exact match found
                        state: Object.keys(indianStates).find(s => s === state) || prev.state,
                        district: district || prev.district // Allow manual override if mismatch
                    }));
                } catch (error) {
                    console.error("GPS Error", error);
                    alert("Failed to fetch address from GPS. Please enter manually.");
                } finally {
                    setIsLoadingLocation(false);
                }
            }, (error) => {
                console.error("Geolocation error", error);
                setIsLoadingLocation(false);
                alert("Location access denied or unavailable.");
            });
        } else {
            setIsLoadingLocation(false);
            alert("Geolocation is not supported by your browser.");
        }
    };

    const handleSave = async () => {
        // Save to local storage with correct keys
        localStorage.setItem("agrisphere_username", profile.name);
        localStorage.setItem("agrisphere_email", profile.email);
        localStorage.setItem("agrisphere_bio", profile.bio);
        localStorage.setItem("agrisphere_photo", profile.photoUrl);
        localStorage.setItem("agrisphere_dob", profile.dob);
        localStorage.setItem("agrisphere_state", profile.state);
        localStorage.setItem("agrisphere_district", profile.district);
        localStorage.setItem("agrisphere_village", profile.village);
        localStorage.setItem("agrisphere_farmSize", profile.farmSize);
        localStorage.setItem("agrisphere_experience", profile.experience);
        localStorage.setItem("agrisphere_crops", profile.crops);

        // Save to backend
        try {
            await axios.post(`${API_URL}/user/profile`, {
                username: profile.name,
                ...profile
            });
        } catch (e) {
            console.error("Failed to save profile to backend", e);
        }

        setIsOpen(false);
        // Force reload to update UI components relying on localStorage
        window.location.reload();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                    <Avatar className="h-9 w-9 border-2 border-primary/40">
                        <AvatarImage src={profile.photoUrl} alt={profile.name} className="object-cover" />
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                    </Avatar>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 text-white border-slate-800 max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                        Farmer Profile
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-0">
                    <div className="grid gap-6 py-4">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-4 border-slate-800 shadow-xl">
                                    <AvatarImage src={profile.photoUrl} className="object-cover" />
                                    <AvatarFallback className="text-3xl bg-slate-800">{profile.name[0]}</AvatarFallback>
                                </Avatar>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <span className="text-xs text-white font-medium">Change</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-slate-400">Click image to upload photo</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-slate-950 border-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" type="date" value={profile.dob} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} className="bg-slate-950 border-slate-700" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Location</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Input value="India" disabled className="bg-slate-950 border-slate-700 opacity-70" />

                                <Select value={profile.state} onValueChange={(val) => setProfile({ ...profile, state: val, district: "" })}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700">
                                        <SelectValue placeholder="Select State" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] bg-slate-900 border-slate-700 text-white">
                                        {Object.keys(indianStates).map(state => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={profile.district} onValueChange={(val) => setProfile({ ...profile, district: val })} disabled={!profile.state}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700">
                                        <SelectValue placeholder="Select District" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] bg-slate-900 border-slate-700 text-white">
                                        {profile.state && indianStates[profile.state]?.map((dist) => (
                                            <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative">
                                    <Input
                                        placeholder="Village / Town"
                                        value={profile.village}
                                        onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                                        className="bg-slate-950 border-slate-700 pr-10"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-0 top-0 h-full hover:bg-transparent hover:text-green-400"
                                        onClick={handleGPS}
                                        disabled={isLoadingLocation}
                                        title="Use GPS"
                                    >
                                        {isLoadingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Farm Details</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="Farm Size (Acres)" type="number" value={profile.farmSize} onChange={(e) => setProfile({ ...profile, farmSize: e.target.value })} className="bg-slate-950 border-slate-700" />
                                <Input placeholder="Experience (Years)" type="number" value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} className="bg-slate-950 border-slate-700" />
                            </div>
                            <Input placeholder="Primary Crops (e.g. Wheat, Rice, Cotton)" value={profile.crops} onChange={(e) => setProfile({ ...profile, crops: e.target.value })} className="bg-slate-950 border-slate-700 mt-2" />
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-900/50 backdrop-blur-sm">
                    <Button variant="destructive" size="sm" onClick={() => { logout(); navigate('/'); }} className="gap-2">
                        <LogOut className="w-4 h-4" /> Logout
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 gap-2">
                        <Settings className="w-4 h-4" /> Save Profile
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Navbar;
