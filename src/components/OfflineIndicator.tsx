import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            setTimeout(() => setShowBackOnline(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-red-600/90 backdrop-blur-sm text-white py-1 px-4 shadow-sm flex items-center justify-center gap-2 h-8"
                >
                    <WifiOff size={14} />
                    <span className="text-xs font-medium">You are currently offline. Using cached data.</span>
                </motion.div>
            )}

            {showBackOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-green-600/90 backdrop-blur-sm text-white py-1 px-4 shadow-sm flex items-center justify-center gap-2 h-8"
                >
                    <Wifi size={14} />
                    <span className="text-xs font-medium">Back online! Syncing data...</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineIndicator;
