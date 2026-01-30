
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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

                <nav className="hidden md:flex items-center gap-6">
                    {(() => {
                        const userRole = user?.role;
                        const isGov = userRole === 'government';
                        const isBuyer = userRole === 'buyer';

                        return [
                            { name: "Home", path: "/", public: true, buyer: true },
                            { name: "Buyer Dashboard", path: "/buyer/dashboard", public: false, gov: false, buyer: true },
                            { name: "Marketplace", path: "/marketplace", public: false, gov: false, buyer: false },
                            { name: "Community Forum", path: "/community", public: false, gov: false, buyer: false },
                            { name: "Advisory Hub", path: "/advisory-hub", public: false, gov: false, buyer: false },
                            { name: "Disease Detection", path: "/disease-detection", public: false, gov: false, buyer: false },
                            { name: "Digital Twin", path: "/digital-twin", public: false, gov: false, buyer: false },
                            { name: "Voice Assistant", path: "/voice-assistant", public: false, gov: false, buyer: false },
                            { name: "Sensors", path: "/iot-monitoring", public: false, gov: false, buyer: false },
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
                                className="text-foreground/80 hover:text-foreground transition-colors relative group"
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
                        <Button
                            variant="outline"
                            className="hidden md:inline-flex"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    )}
                </div>
            </div>
        </motion.header>
    );
};

export default Navbar;
