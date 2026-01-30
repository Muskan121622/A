import { motion } from "framer-motion";
import { Brain, MapPin, TrendingUp, Users, Shield, ArrowRight, Cloud, Zap, Activity, ShoppingBag, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import AIChat from "@/components/AIChat";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const features = [
    {
      icon: Brain,
      title: "AI Multi-Class Disease Detection",
      description: "Advanced ML models analyze leaf, stem, fruit & soil images to detect diseases, pests, nutrient deficiency, and fungal infections with 95% accuracy",
      gradient: "from-primary to-primary-glow",
      details: ["Pest Detection", "Nutrient Deficiency", "Fungal Infections", "Soil Texture Analysis"]
    },
    {
      icon: MapPin,
      title: "GIS Smart Farm Digital Twin",
      description: "Complete digital twin with field boundaries, soil zones, irrigation mapping, pest-prone areas, and crop growth stage tracking",
      gradient: "from-accent to-accent-glow",
      details: ["Field Boundaries", "Soil Zones", "Irrigation Zones", "Growth Stages"]
    },
    {
      icon: TrendingUp,
      title: "AI Yield Prediction Engine",
      description: "Predict crop yields using weather, rainfall, soil type, and historical data with Random Forest, LSTM & Gradient Boosting models",
      gradient: "from-secondary to-secondary-glow",
      details: ["Weather Analysis", "Soil Type Mapping", "Historical Data", "ML Forecasting"]
    },
    {
      icon: Cloud,
      title: "Weather Risk Engine",
      description: "Real-time risk detection for floods, drought, heatwaves with SMS & WhatsApp alerts for proactive farm management",
      gradient: "from-accent to-secondary",
      details: ["Flood Alerts", "Drought Warning", "Heatwave Detection", "SMS Alerts"]
    },
    {
      icon: Zap,
      title: "Fertilizer & Irrigation AI",
      description: "ML-powered NPK requirement calculation, water prediction, and smart irrigation scheduling for optimal crop nutrition",
      gradient: "from-secondary to-primary",
      details: ["NPK Analysis", "Water Prediction", "Smart Scheduling", "Nutrition Optimization"]
    },
  ];

  const stats = [
    { value: "500K+", label: "Active Farmers" },
    { value: "98%", label: "Accuracy Rate" },
    { value: "2M+", label: "Fields Mapped" },
    { value: "40%", label: "Yield Increase" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Video Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{
            filter: 'brightness(0.8) saturate(1.1)',
            opacity: 0.7
          }}
        >
          <source src="/videos/hero-farm.mp4" type="video/mp4" />
          {/* Fallback pattern if video not found */}
        </video>
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-40 animate-glow-pulse" />
      </div>

      {/* Floating Orbs (now with reduced opacity for video) */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-float" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
      <div className="fixed top-1/2 left-1/2 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "4s" }} />

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img
              src="/Screenshot 2025-11-21 114200.png"
              alt="AgriSphere AI Logo"
              className="w-10 h-10 rounded-full object-cover shadow-glow-primary border-2 border-primary/30"
            />
            <span className="text-2xl font-bold gradient-text">AgriSphere AI</span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { name: "Home", path: "/", public: true },
              { name: "Features", path: "#features", public: true },
              { name: "How It Works", path: "#how-it-works", public: true },
              { name: "Advisory Hub", path: "/advisory-hub", public: false },
              { name: "Disease Detection", path: "/disease-detection", public: false },
              { name: "Digital Twin", path: "/digital-twin", public: false },
              { name: "Community Forum", path: "/community", public: false },
              { name: "Marketplace", path: "/marketplace", public: false },
              { name: "Voice Assistant", path: "/voice-assistant", public: false },
              { name: "Fertilizer AI", path: "/fertilizer-recommendation", public: false },
              { name: "Pest Forecast", path: "/pest-prediction", public: false }
            ].filter(item => (item.public && !isAuthenticated) || (!item.public && isAuthenticated)).map((item, i) => (
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
            ))}
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

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary"
            >
              <span className="animate-pulse mr-2">●</span>
              AI-Powered Smart Agriculture
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <motion.span
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="block"
              >
                India's First
              </motion.span>
              <motion.span
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="block gradient-text drop-shadow-glow"
              >
                AI + GIS Smart Farming
              </motion.span>
              <motion.span
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="block"
              >
                Intelligence Platform
              </motion.span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              pests, nutrient deficiency, and fungal infections.
              Increase yields by 30%, reduce costs by 40%.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 group h-14 px-8 text-lg rounded-xl">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="border-2 hover:shadow-glow-accent transition-all duration-300 h-14 px-8 text-lg rounded-xl glass">
                    Watch Demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-slate-800">
                  <div className="relative w-full pb-[56.25%] h-0">
                    <iframe
                      src="https://drive.google.com/file/d/1VdNsdIxKx5EU5CS9kqfx7FldNteBv1NV/preview"
                      className="absolute top-0 left-0 w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    ></iframe>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full aspect-square">
              {/* Central Core */}
              <motion.div
                className="absolute inset-0 m-auto w-48 h-48 bg-gradient-primary rounded-full shadow-glow-primary flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <span className="text-6xl">🌱</span>
              </motion.div>

              {/* Orbiting Icons */}
              {[Brain, MapPin, TrendingUp, Cloud, Zap].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 m-auto w-full h-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 30 + (i * 5), // Varying speeds for depth
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.5,
                  }}
                >
                  <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 glass-morphism rounded-2xl flex items-center justify-center shadow-glow-primary group cursor-pointer"
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    animate={{
                      y: [0, -15, 0],
                      boxShadow: ["0 0 20px rgba(74, 222, 128, 0.2)", "0 0 40px rgba(74, 222, 128, 0.6)", "0 0 20px rgba(74, 222, 128, 0.2)"]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                    style={{
                      transformOrigin: '50% 250px',
                    }}
                  >
                    <Icon className="w-8 h-8 text-primary drop-shadow-glow" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Intelligent Features for
            <span className="block gradient-text">Modern Farming</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Cutting-edge technology designed to revolutionize every aspect of your agricultural operations
          </p>
          <div className="max-w-4xl mx-auto text-left space-y-4 mt-8 p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50">
            <p className="text-muted-foreground">
              AgriSphere AI is India's first comprehensive AI + GIS Smart Farming Intelligence Platform. We combine multi-class disease detection, digital twin technology, yield prediction, and end-to-end agricultural advisory to transform farming from seed to market.
            </p>
            <p className="text-muted-foreground">
              Our platform supports offline mode for villages, Hindi voice commands, government scheme recommendations, farmer-buyer marketplace, and blockchain traceability. From small family farms to large commercial operations, we provide rural-accessible technology that increases yields by 30% while reducing costs by 40%.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-glow-primary">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {feature.details && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {feature.details.map((detail, idx) => (
                        <div key={idx} className="text-xs bg-primary/10 px-2 py-1 rounded-full text-primary font-medium">
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.a
                  href={`/${feature.title.toLowerCase().replace(/\s+/g, '-').replace('ai-', '').replace('gis-', 'digital-').replace('multi-class-', '')}`}
                  className="mt-4 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  Learn more <ArrowRight className="ml-2 w-4 h-4" />
                </motion.a>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Sign Up", desc: "Create your account with Google or phone", icon: Users },
              { step: "2", title: "Map Your Field", desc: "Draw your field boundaries on our interactive map", icon: Map },
              { step: "3", title: "Get AI Insights", desc: "Upload crop images for instant disease diagnosis", icon: Brain },
              { step: "4", title: "Take Action", desc: "Follow recommendations to maximize yields", icon: TrendingUp }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="group relative card-gradient p-6 rounded-2xl text-center border-2 border-primary/30 transition-all duration-500 hover:scale-[1.02] overflow-hidden">
                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary opacity-50 animate-spin" style={{ animationDuration: '3.5s' }}></div>
                  <div className="absolute inset-[2px] rounded-2xl bg-card"></div>

                  {/* Bloom Effect on Hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"></div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors">{item.desc}</p>
                  </div>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-accent opacity-60" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced AI Features Section */}
      <section id="ai-features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Advanced AI Intelligence</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge features that set AgriSphere AI apart
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                title: "Pest Attack Prediction",
                desc: "AI forecasts pest attack probability (0-100%) using climate, humidity & historical patterns for next 7 days",
                icon: "🐛",
                features: ["Climate Analysis", "7-Day Risk Forecast", "Prevention Alerts", "Treatment Recommendations"]
              },
              {
                title: "Seed-to-Market Advisory",
                desc: "Complete guidance from seed selection to market pricing with harvest time prediction & mandi recommendations",
                icon: "🌾",
                features: ["Seed Selection", "Sowing Time", "Harvest Prediction", "Market Pricing"]
              },
              {
                title: "Voice Assistant (Hindi)",
                desc: "Farmers speak: 'Gehun mein rog a gaya hai' - AI responds with disease type, action & cost in local language",
                icon: "🎤",
                features: ["Hindi Support", "Voice Recognition", "Local Languages", "Audio Responses"]
              },
              {
                title: "Government Schemes AI",
                desc: "Auto-identifies subsidies, loans, crop insurance & PM-KISAN benefits based on farmer profile & location",
                icon: "🏛️",
                features: ["Subsidy Matching", "Loan Eligibility", "Insurance Plans", "PM-KISAN"]
              },
              {
                title: "Farmer-Buyer Marketplace",
                desc: "Direct selling platform with AI pricing, logistics suggestions to increase rural income & eliminate middlemen",
                icon: "🛒",
                features: ["Direct Selling", "AI Pricing", "Logistics", "Income Boost"]
              },
              {
                title: "Blockchain Traceability",
                desc: "Track crop origin, supply chain & authenticity using blockchain for premium quality assurance",
                icon: "⛓️",
                features: ["Origin Tracking", "Supply Chain", "Authenticity", "Quality Assurance"]
              }
            ].map((feature, i) => (
              <div key={i} className="group relative card-gradient p-8 rounded-2xl border-2 border-primary/30 transition-all duration-500 hover:scale-[1.02] overflow-hidden">
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary opacity-50 animate-spin" style={{ animationDuration: `${3 + i * 0.5}s` }}></div>
                <div className="absolute inset-[2px] rounded-2xl bg-card"></div>

                {/* Bloom Effect on Hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"></div>

                <div className="relative z-10">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4 group-hover:text-foreground/80 transition-colors">{feature.desc}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="text-xs bg-primary/10 px-2 py-1 rounded-full text-primary font-medium">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rural Accessibility Section */}
      <section id="rural-features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for Rural India</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Accessible technology designed for village farmers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Offline Mode",
                desc: "Works without internet with local caching for critical farming information",
                icon: "📱"
              },
              {
                title: "Hindi + Local Languages",
                desc: "Full support for Hindi and regional languages with voice commands",
                icon: "🗣️"
              },
              {
                title: "SMS Fallback Alerts",
                desc: "Critical alerts sent via SMS when internet is unavailable",
                icon: "📨"
              },
              {
                title: "Community Forums",
                desc: "Farmers discuss pests, diseases, schemes with AI moderation",
                icon: "👥"
              }
            ].map((feature, i) => (
              <div key={i} className="group relative text-center p-6 card-gradient rounded-xl border-2 border-primary/30 transition-all duration-300 hover:scale-105 overflow-hidden">
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-accent to-secondary opacity-50 animate-spin" style={{ animationDuration: '2.5s' }}></div>
                <div className="absolute inset-[2px] rounded-xl bg-card"></div>

                {/* Bloom Effect on Hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 blur-lg transition-all duration-700"></div>

                <div className="relative z-10">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Women Empowerment Section */}
      <section id="women-empowerment" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Rural Women Agri-Entrepreneur</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empowering women-led microbusinesses in agriculture
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Microbusiness Support",
                desc: "Training and support for honey, spices, pickles, and handicraft businesses",
                icon: "🍯"
              },
              {
                title: "Training Modules",
                desc: "Comprehensive training programs for women entrepreneurs in rural areas",
                icon: "📚"
              },
              {
                title: "Marketplace Access",
                desc: "Direct marketplace listings for women-led agricultural products",
                icon: "🛍️"
              }
            ].map((feature, i) => (
              <div key={i} className="group relative card-gradient p-8 rounded-2xl border-2 border-primary/30 transition-all duration-500 hover:scale-[1.02] overflow-hidden">
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary opacity-50 animate-spin" style={{ animationDuration: '3.5s' }}></div>
                <div className="absolute inset-[2px] rounded-2xl bg-card"></div>

                {/* Bloom Effect on Hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"></div>

                <div className="relative z-10">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Farmers Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real stories from farmers transforming their operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Rajesh Kumar",
                location: "Punjab, India",
                text: "AgriSphere's multi-class AI detected stem borer in my wheat early. The pest prediction saved my entire 10-acre crop and increased yield by 35%!",
                rating: 5,
                crop: "Wheat",
                benefit: "35% yield increase"
              },
              {
                name: "Anita Sharma",
                location: "Maharashtra, India",
                text: "The GIS digital twin mapped my field perfectly. AI-powered management cut water usage by 45%. Marketplace got me ₹2000/quintal extra!",
                rating: 5,
                crop: "Cotton",
                benefit: "45% water savings"
              },
              {
                name: "Vikram Patel",
                location: "Gujarat, India",
                text: "Voice assistant in Hindi is amazing! 'Tamatar mein rog hai' - instantly got disease type, treatment cost. Offline mode works perfectly in my village.",
                rating: 5,
                crop: "Tomato",
                benefit: "Hindi voice support"
              },
              {
                name: "Priya Devi",
                location: "Bihar, India",
                text: "Women entrepreneur module helped me start honey business. Training + marketplace access increased my income by ₹15,000/month!",
                rating: 5,
                crop: "Honey",
                benefit: "₹15k extra income"
              },
              {
                name: "Suresh Reddy",
                location: "Telangana, India",
                text: "Yield prediction was 98% accurate! Government scheme AI found ₹50,000 subsidy I didn't know about. Blockchain traceability got premium prices.",
                rating: 5,
                crop: "Rice",
                benefit: "₹50k subsidy found"
              },
              {
                name: "Kavita Singh",
                location: "Uttar Pradesh, India",
                text: "Pest attack prediction warned me 5 days early about aphid attack. Weather risk alerts saved my crop from unexpected hailstorm damage.",
                rating: 5,
                crop: "Mustard",
                benefit: "Early pest warning"
              }
            ].map((testimonial, i) => (
              <div key={i} className="group relative card-gradient p-8 rounded-2xl border-2 border-primary/30 transition-all duration-500 hover:scale-[1.02] overflow-hidden">
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary opacity-50 animate-spin" style={{ animationDuration: '4s' }}></div>
                <div className="absolute inset-[2px] rounded-2xl bg-card"></div>

                {/* Bloom Effect on Hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-500 text-xl group-hover:scale-110 transition-transform duration-300">★</span>
                      ))}
                    </div>
                    <div className="text-right">
                      <div className="text-xs bg-primary/20 px-2 py-1 rounded-full text-primary font-medium mb-1">{testimonial.crop}</div>
                      <div className="text-xs bg-accent/20 px-2 py-1 rounded-full text-accent font-medium">{testimonial.benefit}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 italic group-hover:text-foreground/80 transition-colors">"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold group-hover:text-primary transition-colors">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Built on Cutting-Edge Technology</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade tech stack powering your farm
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Random Forest ML", desc: "Yield prediction" },
              { name: "LSTM Networks", desc: "Time series analysis" },
              { name: "Gradient Boosting", desc: "Advanced regression" },
              { name: "Mapbox GIS", desc: "Digital twin mapping" },
              { name: "Multi-class CNN", desc: "Disease detection" },
              { name: "Blockchain", desc: "Supply traceability" },
              { name: "Voice Recognition", desc: "Hindi commands" },
              { name: "Offline Caching", desc: "Village accessibility" },
              { name: "SMS Gateway", desc: "Alert fallback" },
              { name: "WhatsApp API", desc: "Instant notifications" },
              { name: "End-to-End Encryption", desc: "Data security" }
            ].map((tech, i) => (
              <div key={i} className="group relative text-center p-6 card-gradient rounded-xl border-2 border-primary/30 transition-all duration-300 hover:scale-105 overflow-hidden">
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-accent to-secondary opacity-50 animate-spin" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-[2px] rounded-xl bg-card"></div>

                {/* Bloom Effect on Hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 blur-lg transition-all duration-700"></div>

                <div className="relative z-10">
                  <p className="font-bold mb-2 group-hover:text-primary transition-colors">{tech.name}</p>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 backdrop-blur-sm p-12 md:p-16 text-center shadow-glow-primary">
            <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

            <motion.div
              className="relative z-10"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your
                <span className="block gradient-text">Agricultural Business?</span>
              </h2>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of farmers who are already using AgriSphere AI to increase yields and reduce costs
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-lg px-8">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 text-lg px-8">
                  Schedule a Demo
                </Button>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card/30 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌱</span>
                </div>
                <span className="text-xl font-bold gradient-text">AgriSphere AI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Empowering farmers with AI and GIS technology for sustainable, profitable agriculture.
              </p>
            </div>

            {[
              {
                title: "Features",
                links: [
                  { name: "Disease Detection", path: "/disease-detection" },
                  { name: "Digital Twin", path: "/digital-twin" },
                  { name: "Yield Prediction", path: "/yield-prediction" },
                  { name: "Voice Assistant", path: "/voice-assistant" }
                ]
              },
              {
                title: "Platform",
                links: [
                  { name: "Marketplace", path: "/marketplace" },
                  { name: "IoT Monitoring", path: "/iot-monitoring" },
                  { name: "Weather Alerts", path: "#" },
                  { name: "Community", path: "#" }
                ]
              },
              {
                title: "Support",
                links: [
                  { name: "Help Center", path: "#" },
                  { name: "Documentation", path: "#" },
                  { name: "API Guide", path: "#" },
                  { name: "Contact", path: "#" }
                ]
              },
            ].map((column) => (
              <div key={column.title}>
                <h4 className="font-bold mb-4">{column.title}</h4>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <a href={link.path} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2025 AgriSphere AI. All rights reserved.
            </p>
            <div className="flex gap-4">
              {[Users, Shield, Brain].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-full bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <AIChat />
    </div>
  );
};

export default Index;