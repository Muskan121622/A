import { motion } from "framer-motion";
import { Map, Layers, Droplets, Bug, TrendingUp, ArrowLeft, MapPin, Activity, CheckCircle2, Volume2, Play, Pause, Square } from "lucide-react";
import { translateToHindi } from "@/lib/voice-translation";
import { toast } from "sonner";
import { INDIAN_LOCATIONS } from "@/lib/location-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { DigitalTwinEngine } from "@/lib/digital-twin";
import { GISDigitalTwin } from "@/lib/gis-digital-twin";
import { useState, lazy, Suspense } from "react";

// Lazy load the GIS Map component for better performance
const GISMap = lazy(() => import("@/components/GISMap").then(module => ({ default: module.GISMap })));

const DigitalTwin = () => {
  const [twinEngine] = useState(() => new DigitalTwinEngine());
  const [gisEngine] = useState(() => new GISDigitalTwin());
  const [farmData, setFarmData] = useState(null);
  const [gisData, setGisData] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [speechState, setSpeechState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'hi'>('hi'); // Default to Hindi as per request context or user preference if needed, but 'en' safe default. Let's use 'en' as default or 'hi' if we want to show off. User asked for both. Let's stick to 'en' default but toggleable. Actually I'll set 'en' default.


  // Form State
  const [formData, setFormData] = useState({
    farmName: "My Digital Farm",
    ownerName: "AgriSphere User",
    latitude: "",
    longitude: "",
    state: "",
    district: "",
    town: "",
    size: "10" // Acres
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info("Getting GPS location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          toast.success("Location found via GPS");
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Could not get your location. Please enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const generateFarmCoordinates = (lat: number, lng: number, acres: number) => {
    // Convert acres to square meters (1 acre = 4046.86 sq meters)
    const areaSqMeters = acres * 4046.86;
    const sideLength = Math.sqrt(areaSqMeters); // Assuming square shape for simplicity
    const radiusMeters = sideLength / 2;

    // Convert meters to degrees (approximate)
    const latDelta = radiusMeters / 111320;
    const lngDelta = radiusMeters / (40075000 * Math.cos(lat * Math.PI / 180) / 360);

    return [
      { lat: lat - latDelta, lng: lng - lngDelta },
      { lat: lat - latDelta, lng: lng + lngDelta },
      { lat: lat + latDelta, lng: lng + lngDelta },
      { lat: lat + latDelta, lng: lng - lngDelta }
    ];
  };

  const initializeFarm = async () => {
    setIsFormOpen(false);

    if (hasInitialized) {
      document.getElementById('gis-map-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsInitializing(true);
    console.log('⏳ Initializing farm data...', formData);

    try {
      let lat = parseFloat(formData.latitude);
      let lng = parseFloat(formData.longitude);
      const acres = parseFloat(formData.size);

      // If coordinates are missing but text location exists, proceeding to AI first
      const isLocationSearch = (isNaN(lat) || isNaN(lng)) && formData.state && formData.district;

      if (!isLocationSearch && (isNaN(lat) || isNaN(lng))) {
        // If neither Coords nor valid Text provided
        alert("Please provide either GPS Coordinates OR State/District details.");
        setIsInitializing(false);
        return;
      }

      toast.info(isLocationSearch ? `Locating ${formData.town}, ${formData.district}...` : "Generating Digital Twin...");

      // 2. Fetch AI Intelligence (Attributes) + Estimates Coordinates if needed
      let aiData = null;
      try {
        const response = await fetch('http://localhost:5000/generate-digital-twin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmName: formData.farmName,
            ownerName: formData.ownerName,
            latitude: formData.latitude || "0",
            longitude: formData.longitude || "0",
            state: formData.state,
            district: formData.district,
            town: formData.town,
            size: acres
          })
        });

        if (response.ok) {
          aiData = await response.json();
          console.log("🧠 Groq AI Data:", aiData);

          // IF we were doing search, USE the AI's estimated coordinates
          if (isLocationSearch && aiData.location) {
            lat = aiData.location.lat;
            lng = aiData.location.lng;

            // Update form data for display
            setFormData(prev => ({
              ...prev,
              latitude: lat.toString(),
              longitude: lng.toString()
            }));

            toast.success(`Location identified: Lat ${lat}, Lng ${lng}`);
          }

          toast.success(`AI Analysis Complete: ${aiData.visual_summary || "Localized data applied."}`);

        } else {
          console.warn("AI Generation failed");
          toast.error("AI Analysis Failed.");
        }
      } catch (err) {
        console.error("Failed to fetch AI data", err);
        toast.error("Network Error using AI.");
      }

      // Check if we have valid coordinates now (either from input or AI)
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Could not determine farm location coordinates.");
      }

      const coordinates = generateFarmCoordinates(lat, lng, acres);
      console.log('📍 Generated coordinates for acres:', acres, coordinates);

      // 1. Initialize Geometry locally (using Turf.js)
      let [traditionalData, gisData] = await Promise.all([
        twinEngine.initializeFarm(coordinates.map(c => [c.lng, c.lat])),
        gisEngine.initializeFarm(formData.farmName, formData.ownerName, coordinates)
      ]);

      // MERGE AI Data if available
      if (aiData) {
        // Update Farm Area strictly from AI or usage
        traditionalData.farmBoundary.area = aiData.farmBoundary.area;

        // Merge Soil Zones (Keep geometry, update attributes)
        traditionalData.soilZones = traditionalData.soilZones.map((zone, idx) => {
          const aiZone = aiData.soilZones[idx % aiData.soilZones.length];
          return { ...zone, ...aiZone, id: zone.id, coordinates: zone.coordinates };
        });

        // Merge Irrigation
        traditionalData.irrigationZones = traditionalData.irrigationZones.map((zone, idx) => {
          const aiZone = aiData.irrigationZones[idx % aiData.irrigationZones.length];
          return { ...zone, ...aiZone, id: zone.id, coordinates: zone.coordinates };
        });

        // Merge Pest Areas (If AI has fewer, loop them; if AI has more, we limit to geometry count)
        traditionalData.pestProneAreas = traditionalData.pestProneAreas.map((area, idx) => {
          const aiPest = aiData.pestProneAreas[idx % aiData.pestProneAreas.length];
          return { ...area, ...aiPest, id: area.id, coordinates: area.coordinates };
        });

        // Merge Crops
        traditionalData.cropGrowthStages = traditionalData.cropGrowthStages.map((stage, idx) => {
          const aiCrop = aiData.cropGrowthStages[idx % aiData.cropGrowthStages.length];
          return { ...stage, ...aiCrop, id: stage.id, coordinates: stage.coordinates };
        });

        // Update Weather
        if (aiData.weatherData) traditionalData.weatherData = aiData.weatherData;
      }

      console.log('✅ Farm data initialized:', { traditionalData, gisData });

      setFarmData(traditionalData);
      setGisData(gisData);
      setHasInitialized(true);

      const spatialAnalysis = await gisEngine.performSpatialAnalysis();
      console.log('📊 Spatial Analysis Results:', spatialAnalysis);

      setTimeout(() => {
        document.getElementById('gis-map-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (error) {
      console.error('❌ Failed to initialize farm:', error);
      alert("Failed to create Digital Twin. Please check location inputs.");
    } finally {
      setIsInitializing(false);
    }
  };

  const twinFeatures = [
    {
      title: "Field Boundary Mapping",
      description: "Precise GPS-based field boundary detection and polygon mapping",
      icon: "🗺️",
      accuracy: "99.5%",
      features: ["GPS Coordinates", "Area Calculation", "Boundary Alerts", "Shape Analysis"]
    },
    {
      title: "Soil Zone Classification",
      description: "Multi-layer soil analysis with texture, pH, and nutrient mapping",
      icon: "🌍",
      accuracy: "94%",
      features: ["Soil Texture", "pH Zones", "Nutrient Maps", "Fertility Index"]
    },
    {
      title: "Irrigation Zone Planning",
      description: "Smart irrigation zone design based on crop needs and soil conditions",
      icon: "💧",
      accuracy: "96%",
      features: ["Water Zones", "Drip Planning", "Sprinkler Layout", "Efficiency Maps"]
    },
    {
      title: "Pest-Prone Area Detection",
      description: "Historical pest data analysis to identify high-risk zones",
      icon: "🐛",
      accuracy: "91%",
      features: ["Risk Zones", "Pest History", "Prevention Areas", "Treatment Maps"]
    },
    {
      title: "Crop Growth Staging",
      description: "Real-time crop growth stage monitoring across different field zones",
      icon: "🌱",
      accuracy: "93%",
      features: ["Growth Stages", "Maturity Maps", "Harvest Zones", "Yield Prediction"]
    },
    {
      title: "Weather Microclimate",
      description: "Field-specific microclimate analysis and weather pattern mapping",
      icon: "🌤️",
      accuracy: "89%",
      features: ["Temperature Zones", "Humidity Maps", "Wind Patterns", "Frost Risk"]
    }
  ];

  const gisLayers = [
    { name: "Satellite Imagery", type: "Base Layer", update: "Daily" },
    { name: "Soil Health", type: "Analysis Layer", update: "Weekly" },
    { name: "Crop Health", type: "Monitoring Layer", update: "Real-time" },
    { name: "Weather Data", type: "Environmental Layer", update: "Hourly" },
    { name: "Pest Alerts", type: "Alert Layer", update: "As needed" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="text-xl font-bold gradient-text">AgriSphere AI</span>
          </div>
        </div>
      </header>

      {/* Header */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-6xl mb-6">🌐</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              GIS Smart Farm Digital Twin
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Create a complete digital replica of your farm with advanced GIS mapping,
              multi-layer visualization, and real-time monitoring for precision agriculture.
              <br />
              <span className="text-primary font-semibold mt-2 block">
                ✨ Featuring: Farm Boundaries • Soil Zones • Irrigation Planning • Pest Risk Maps • NDVI Crop Health • Weather Analysis
              </span>
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:scale-105 transition-transform cursor-pointer z-10 relative"
                    disabled={isInitializing}
                  >
                    {isInitializing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Map className="mr-2 w-5 h-5" />
                        {hasInitialized ? 'Update Digital Twin' : 'Create Digital Twin'}
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Setup Your Digital Farm</DialogTitle>
                    <DialogDescription>
                      Enter your farm details to generate a precise digital twin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="farmName">Farm Name</Label>
                      <Input
                        id="farmName"
                        name="farmName"
                        value={formData.farmName}
                        onChange={handleInputChange}
                        placeholder="e.g. Green Valley Farm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input
                        id="ownerName"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        placeholder="e.g. John Doe"
                      />
                    </div>



                    {/* Location Selection with Dropdowns */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              state: value,
                              district: ""
                            }));
                          }}
                        >
                          <SelectTrigger id="state" className="h-10 w-full">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto z-[100]">
                            {Object.keys(INDIAN_LOCATIONS).sort().map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="district">District</Label>
                        <Select
                          value={formData.district}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
                          disabled={!formData.state}
                        >
                          <SelectTrigger id="district" className="h-10 w-full">
                            <SelectValue placeholder="District" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto z-[100]">
                            {formData.state && INDIAN_LOCATIONS[formData.state]?.sort().map(district => (
                              <SelectItem key={district} value={district}>{district}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="town">Village/Town</Label>
                        <Input
                          id="town"
                          name="town"
                          value={formData.town}
                          onChange={handleInputChange}
                          placeholder="e.g. Domjur"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or Use Coordinates</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          placeholder="26.14"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          placeholder="91.73"
                        />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={useCurrentLocation} className="w-full">
                      <MapPin className="mr-2 w-4 h-4" />
                      Use Current Location
                    </Button>
                    <div className="grid gap-2">
                      <Label htmlFor="size">Farm Size (Acres)</Label>
                      <Input
                        id="size"
                        name="size"
                        type="number"
                        value={formData.size}
                        onChange={handleInputChange}
                        placeholder="e.g. 10"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={initializeFarm} disabled={isInitializing}>
                      {isInitializing ? 'Generating...' : 'Generate Digital Twin'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                size="lg"
                variant="outline"
                className="hover:scale-105 transition-transform cursor-pointer"
                onClick={() => {
                  setFormData({
                    farmName: "Demo Smart Farm",
                    ownerName: "Demo User",
                    latitude: "26.1440",
                    longitude: "91.7360",
                    size: "15",
                    state: "",
                    district: "",
                    town: ""
                  });
                  setTimeout(initializeFarm, 100);
                }}
                disabled={isInitializing}
              >
                <MapPin className="mr-2 w-5 h-5" />
                Quick Demo
              </Button>
            </div>

            {/* Loading Progress */}
            {isInitializing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 max-w-md mx-auto"
              >
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm font-medium text-primary">Creating your digital farm twin...</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Mapping field boundaries for <strong>{formData.farmName}</strong><br />
                    • Analyzing soil zones based on location<br />
                    • Planning irrigation systems for {formData.size} acres<br />
                    • Detecting pest-prone areas
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Digital Twin Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Digital Twin Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {twinFeatures.map((feature, i) => (
              <Card key={i} className="p-8 hover:shadow-lg transition-all duration-300 group">
                <div className="text-center">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <div className="bg-primary/20 px-2 py-1 rounded-full text-primary font-bold text-xs">
                      {feature.accuracy}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">{feature.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="text-xs bg-muted px-2 py-1 rounded text-center">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* GIS Layers */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Multi-Layer GIS Visualization</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {gisLayers.map((layer, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <Layers className="w-6 h-6 text-primary" />
                  <h3 className="font-bold">{layer.name}</h3>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">{layer.type}</span>
                  <div className="bg-accent/20 px-2 py-1 rounded-full text-accent text-xs">
                    {layer.update}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive GIS Map */}
      {gisData && (
        <section id="gis-map-section" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8">
              Interactive Farm Map: {gisData.farmName}
            </h2>
            <div className="flex justify-center items-center gap-4 mb-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Lat: {formData.latitude}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Lng: {formData.longitude}</span>
            </div>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Explore {gisData.owner}'s farm with multi-layer GIS visualization. Click on zones for detailed information.
            </p>
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
                  <p className="text-muted-foreground">Loading GIS Map...</p>
                </div>
              </div>
            }>
              <GISMap farmData={gisData} />
            </Suspense>
          </div>
        </section>
      )}

      {/* Live Farm Data */}
      {farmData && (
        <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-16 relative">
              <h2 className="text-4xl font-bold text-center">Live Digital Twin Data</h2>

              {/* Voice Controls */}
              <div className="flex items-center gap-2 bg-white/80 dark:bg-black/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-border/50">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setVoiceLanguage(prev => prev === 'en' ? 'hi' : 'en')}
                >
                  <span className="text-xs font-bold">{voiceLanguage === 'en' ? 'EN' : 'HI'}</span>
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 text-primary"
                  onClick={() => {
                    if (speechState === 'speaking') {
                      window.speechSynthesis.pause();
                      setSpeechState('paused');
                    } else if (speechState === 'paused') {
                      window.speechSynthesis.resume();
                      setSpeechState('speaking');
                    } else {
                      // Generate Text
                      let text = `Your farm area is ${farmData.farmBoundary.area.toFixed(2)} hectares, mapped into ${farmData.soilZones.length} soil zones. `;
                      text += `There are ${farmData.irrigationZones.length} active irrigation zones. `;
                      text += `Average crop health is ${Math.round(farmData.cropGrowthStages.reduce((sum: number, stage: any) => sum + stage.health, 0) / farmData.cropGrowthStages.length)}%. `;

                      // Pests
                      const highRisk = farmData.pestProneAreas.filter((p: any) => p.riskLevel === 'high');
                      if (highRisk.length > 0) {
                        text += `High pest risk detected for ${highRisk.map((p: any) => p.pestType).join(' and ')}. `;
                      } else {
                        text += "No high pest risks detected. ";
                      }

                      // Crops
                      farmData.cropGrowthStages.forEach((stage: any) => {
                        text += `${stage.cropType} is in ${stage.stage} stage. `;
                      });

                      if (voiceLanguage === 'hi') {
                        text = translateToHindi(text);
                      }

                      const speech = new SpeechSynthesisUtterance(text);
                      speech.lang = voiceLanguage === 'hi' ? 'hi-IN' : 'en-US';
                      speech.rate = 0.9;
                      speech.onend = () => setSpeechState('idle');
                      window.speechSynthesis.cancel();
                      window.speechSynthesis.speak(speech);
                      setSpeechState('speaking');
                    }
                  }}
                >
                  {speechState === 'speaking' ? <Pause className="w-4 h-4" /> : speechState === 'paused' ? <Play className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                {speechState !== 'idle' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setSpeechState('idle');
                    }}
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
              <Card className="p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-3 text-green-500" />
                <h3 className="font-bold mb-2">Farm Area</h3>
                <div className="text-2xl font-bold text-green-500">{farmData.farmBoundary.area.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Hectares</div>
              </Card>
              <Card className="p-6 text-center">
                <Layers className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                <h3 className="font-bold mb-2">Soil Zones</h3>
                <div className="text-2xl font-bold text-blue-500">{farmData.soilZones.length}</div>
                <div className="text-sm text-muted-foreground">Mapped zones</div>
              </Card>
              <Card className="p-6 text-center">
                <Droplets className="w-8 h-8 mx-auto mb-3 text-cyan-500" />
                <h3 className="font-bold mb-2">Irrigation Zones</h3>
                <div className="text-2xl font-bold text-cyan-500">{farmData.irrigationZones.length}</div>
                <div className="text-sm text-muted-foreground">Active zones</div>
              </Card>
              <Card className="p-6 text-center">
                <Activity className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                <h3 className="font-bold mb-2">Crop Health</h3>
                <div className="text-2xl font-bold text-orange-500">
                  {Math.round(farmData.cropGrowthStages.reduce((sum, stage) => sum + stage.health, 0) / farmData.cropGrowthStages.length)}
                </div>
                <div className="text-sm text-muted-foreground">Average %</div>
              </Card>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-500" />
                  Pest Risk Areas
                </h3>
                <div className="space-y-3">
                  {farmData.pestProneAreas.map((area, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium">{area.pestType}</div>
                        <div className="text-sm text-muted-foreground">{area.id}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${area.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        area.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {area.riskLevel} risk
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Crop Growth Stages
                </h3>
                <div className="space-y-3">
                  {farmData.cropGrowthStages.map((stage, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium">{stage.cropType}</div>
                        <div className="text-sm text-muted-foreground">{stage.stage}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{stage.health.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Health</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Digital Twin Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { title: "30% Better Planning", desc: "Optimize field operations", icon: "📊" },
              { title: "25% Water Savings", desc: "Precision irrigation zones", icon: "💧" },
              { title: "40% Pest Reduction", desc: "Targeted prevention", icon: "🛡️" },
              { title: "35% Yield Increase", desc: "Data-driven decisions", icon: "📈" }
            ].map((benefit, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h3 className="font-bold mb-2 text-primary">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Powered by Advanced GIS Technology</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Industry-leading mapping technologies combined with AI for next-generation precision agriculture
          </p>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Leaflet", desc: "Interactive GIS mapping", icon: "🗺️" },
              { name: "Turf.js", desc: "Spatial analysis", icon: "📐" },
              { name: "Satellite Imagery", desc: "Real-time field views", icon: "🛰️" },
              { name: "NDVI Analysis", desc: "Crop health monitoring", icon: "🌿" }
            ].map((tech, i) => (
              <div key={i} className="p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-3">{tech.icon}</div>
                <h3 className="font-bold mb-1 text-lg">{tech.name}</h3>
                <p className="text-sm text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};


export default DigitalTwin;