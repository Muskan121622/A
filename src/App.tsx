import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useAuthStore } from "@/store/authStore";

// Lazy load pages for faster navigation
const Index = lazy(() => import("./pages/Index"));
const DiseaseDetection = lazy(() => import("./pages/DiseaseDetection"));
const DigitalTwin = lazy(() => import("./pages/DigitalTwin"));
const Community = lazy(() => import("./pages/Community"));
const IoTMonitoring = lazy(() => import("./pages/IoTMonitoring"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const GovDashboard = lazy(() => import('./pages/GovDashboard'));
const OfflineIndicator = lazy(() => import('./components/OfflineIndicator'));
const ComprehensiveDashboard = lazy(() => import("./pages/ComprehensiveDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const FertilizerRecommendation = lazy(() => import("./pages/FertilizerRecommendation"));

const PestPrediction = lazy(() => import("./pages/PestPrediction"));
const AdvisoryHub = lazy(() => import("./pages/AdvisoryHub"));
const BuyerDashboard = lazy(() => import("./pages/BuyerDashboard"));
const CropLossForm = lazy(() => import("./pages/CropLossForm"));

const queryClient = new QueryClient();

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">🌱</div>
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground animate-pulse font-medium">Loading AgriSphere AI...</p>
        <div className="flex gap-1 justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<LoadingScreen />}>
            <OfflineIndicator />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* Public routes for demo */}
              <Route path="/digital-twin" element={<DigitalTwin />} />
              <Route path="/disease-detection" element={<DiseaseDetection />} />
              <Route path="/advisory-hub" element={<AdvisoryHub />} />
              {/* Protected routes */}
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/iot-monitoring" element={<ProtectedRoute><IoTMonitoring /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/voice-assistant" element={<ProtectedRoute><VoiceAssistant /></ProtectedRoute>} />
              <Route path="/fertilizer-recommendation" element={<ProtectedRoute><FertilizerRecommendation /></ProtectedRoute>} />
              <Route path="/pest-prediction" element={<ProtectedRoute><PestPrediction /></ProtectedRoute>} />
              <Route path="/gov/dashboard" element={<ProtectedRoute><GovDashboard /></ProtectedRoute>} />
              <Route path="/buyer/dashboard" element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>} />
              <Route path="/compensation-form" element={<ProtectedRoute><CropLossForm /></ProtectedRoute>} />
              <Route path="/comprehensive-dashboard" element={<ProtectedRoute><ComprehensiveDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
