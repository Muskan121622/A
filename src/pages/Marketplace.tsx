
import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Minus, IndianRupee, Clock, Sprout, Search, ChevronDown, Volume2, Phone, MapPin, User, AlertTriangle, Pause, Play, Square } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Marketplace = () => {
  const [date, setDate] = useState<Date>();
  const [crop, setCrop] = useState<string>("");
  const [acres, setAcres] = useState<string>("1");
  const [state, setState] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState("advisory");

  // Listings State
  const [listings, setListings] = useState<any[]>([]);
  const [contactVisible, setContactVisible] = useState<{ [key: string]: boolean }>({});
  const [filters, setFilters] = useState({ search: "", state: "" });
  const [newListing, setNewListing] = useState({
    farmerName: "",
    contactNumber: "",
    cropName: "",
    quantity: "",
    price: "",
    location: "" // State/City
  });

  // Demands State
  const [demands, setDemands] = useState<any[]>([]);

  useEffect(() => {
    fetchListings();
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      const res = await axios.get("http://localhost:5000/demands");
      setDemands(res.data);
    } catch (err) {
      console.error("Failed to fetch demands", err);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/listings");
      setListings(res.data);
    } catch (err) {
      console.error("Failed to fetch listings", err);
    }
  };

  const handlePostListing = async () => {
    if (!newListing.farmerName || !newListing.contactNumber || !newListing.cropName || !newListing.quantity || !newListing.price || !newListing.location) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      await axios.post("http://localhost:5000/listings", newListing);
      toast({ title: "Success", description: "Listing posted successfully!" });
      setNewListing({ farmerName: "", contactNumber: "", cropName: "", quantity: "", price: "", location: "" });
      fetchListings(); // Refresh
    } catch (err) {
      toast({ title: "Error", description: "Failed to post listing", variant: "destructive" });
    }
  };

  const toggleContact = (id: string) => {
    setContactVisible(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.cropName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesState = filters.state ? l.location.toLowerCase().includes(filters.state.toLowerCase()) : true;
    return matchesSearch && matchesState;
  });

  // Market Prices State
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  const [priceFilters, setPriceFilters] = useState({
    state: "",
    district: "",
    market: "",
    category: "All"
  });
  const [pricesLoading, setPricesLoading] = useState(false);

  const fetchMarketPrices = async () => {
    if (!priceFilters.state || !priceFilters.district) {
      toast({ title: "Details Missing", description: "Please enter State and District", variant: "destructive" });
      return;
    }
    setPricesLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/market-prices", priceFilters);
      setMarketPrices(res.data);
      toast({ title: "Prices Updated", description: "Real-time market rates fetched." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch prices", variant: "destructive" });
    } finally {
      setPricesLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!crop || !date || !state) {
      toast({
        title: "Missing Information",
        description: "Please select a crop, state, and sowing date.",
        variant: "destructive",
      });
      return;
    }
    // ... existing code ...


    setLoading(true);
    try {
      // Format date as YYYY-MM-DD for backend
      const formattedDate = format(date, "yyyy-MM-dd");

      const response = await axios.post("http://localhost:5000/market-advisory", {
        crop,
        sowing_date: formattedDate,
        acres: parseFloat(acres) || 1,
        state: state
      });

      setResult(response.data);
      toast({
        title: "Analysis Complete",
        description: `Market intelligence report generated for ${state}.`,
      });
    } catch (error) {
      console.error("Market analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not fetch market data. Ensure server is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Audio State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const handleAudioControl = (id: string, text: string, lang: 'en-US' | 'hi-IN') => {
    if (!text) return;

    // If clicking same ID
    if (playingId === id) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    // New audio
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = () => {
      setPlayingId(null);
      setIsPaused(false);
      setCurrentUtterance(null);
    };

    setPlayingId(id);
    setIsPaused(false);
    setCurrentUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setPlayingId(null);
    setIsPaused(false);
    setCurrentUtterance(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Agrisphere Marketplace</h1>
          <p className="text-muted-foreground">
            Seed-to-Market intelligence and direct farmer-buyer connection.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[650px] bg-primary/10">
          <TabsTrigger value="advisory" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            🌱 Smart Advisory
          </TabsTrigger>
          <TabsTrigger value="listings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            🛒 Marketplace Listings
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            📈 Market Trends
          </TabsTrigger>
          <TabsTrigger value="demands" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            📢 Buyer Requests
          </TabsTrigger>
        </TabsList>

        {/* TAB 4: BUYER DEMANDS */}
        <TabsContent value="demands" className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demands.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">No active buyer requirements at the moment.</p>
              </div>
            ) : (
              demands.map((demand: any) => (
                <Card key={demand.id} className="border-orange-200 overflow-hidden relative group hover:shadow-lg transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                        BUYING
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{demand.timestamp?.split(' ')[0]}</span>
                    </div>
                    <CardTitle className="text-xl text-slate-800">{demand.crop}</CardTitle>
                    <CardDescription>Required by {demand.buyerName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-xs text-slate-500 block">Quantity Needed</span>
                        <span className="font-bold text-slate-900">{demand.quantity} Q</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-xs text-slate-500 block">Target Price</span>
                        <span className="font-bold text-green-600">₹{demand.price}/Q</span>
                      </div>
                    </div>
                    {demand.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" /> Location Preference: {demand.location}
                      </div>
                    )}
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
                      <Phone className="w-4 h-4" /> Contact Buyer
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 1: SMART ADVISORY */}
        <TabsContent value="advisory" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid gap-6 md:grid-cols-12">
            {/* Input Section */}
            <Card className="md:col-span-4 h-fit border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  Crop Details
                </CardTitle>
                <CardDescription>Enter your farming details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Crop</label>
                  <Select onValueChange={setCrop} value={crop}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a crop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rice">Rice (Paddy)</SelectItem>
                      <SelectItem value="wheat">Wheat</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="maize">Maize (Corn)</SelectItem>
                      <SelectItem value="tomato">Tomato</SelectItem>
                      <SelectItem value="potato">Potato</SelectItem>
                      <SelectItem value="sugarcane">Sugarcane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Select onValueChange={setState} value={state}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="andhra_pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="bihar">Bihar</SelectItem>
                      <SelectItem value="gujarat">Gujarat</SelectItem>
                      <SelectItem value="haryana">Haryana</SelectItem>
                      <SelectItem value="karnataka">Karnataka</SelectItem>
                      <SelectItem value="madhya_pradesh">Madhya Pradesh</SelectItem>
                      <SelectItem value="maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="punjab">Punjab</SelectItem>
                      <SelectItem value="rajasthan">Rajasthan</SelectItem>
                      <SelectItem value="tamil_nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="telangana">Telangana</SelectItem>
                      <SelectItem value="uttar_pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="west_bengal">West Bengal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sowing Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Field Size (Acres)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    value={acres}
                    onChange={(e) => setAcres(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Get Market Insights"}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section - NOW WITH ACCORDION */}
            <div className="md:col-span-8 space-y-6">
              {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <Card className="border-l-4 border-l-primary shadow-lg bg-slate-900 text-white border-slate-800">
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span>Analysis for {result.crop} in {result.state}</span>
                        <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">Generated at {result.generated_at}</span>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {result.seasonality_check && result.seasonality_check.is_valid === false && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Seasonality Warning</AlertTitle>
                      <AlertDescription>
                        {result.seasonality_check.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">

                    {/* Stage 1: Seed & Sowing */}
                    <AccordionItem value="item-1" className="border rounded-lg bg-card px-4 shadow-sm border-l-4 border-l-green-500">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left w-full">
                          <span className="text-2xl bg-green-50 p-2 rounded-full">🌱</span>
                          <div>
                            <h3 className="font-semibold text-lg">Step 1: Seed Selection & Sowing</h3>
                            <p className="text-sm text-muted-foreground font-normal">Foundation for a good harvest</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2 border-t mt-2">
                        <div className="flex gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage1-en', result.stage_1?.voice_summary_en, 'en-US')}
                            className={cn("text-xs transition-colors", playingId === 'stage1-en' && "bg-green-100 border-green-300")}
                          >
                            {playingId === 'stage1-en' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            English
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage1-hi', result.stage_1?.voice_summary_hi, 'hi-IN')}
                            className={cn("text-xs transition-colors", playingId === 'stage1-hi' && "bg-green-100 border-green-300")}
                          >
                            {playingId === 'stage1-hi' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            हिंदी
                          </Button>
                          {(playingId === 'stage1-en' || playingId === 'stage1-hi') && (
                            <Button variant="ghost" size="sm" onClick={stopAudio} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Square className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 mt-2">
                          <div>
                            <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                              <Sprout className="w-4 h-4" /> Recommended Varieties
                            </h4>
                            <ul className="list-disc ml-5 text-sm space-y-1 text-gray-700">
                              {result.stage_1?.seed_varieties?.map((v: string, i: number) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-700 mb-2">Sowing Technique</h4>
                            <p className="text-sm leading-relaxed text-gray-700">{result.stage_1?.recommended_technique}</p>
                            <div className="mt-4 text-xs bg-green-50 p-3 rounded-lg text-green-800 border border-green-200">
                              <strong>💡 Pro Tip:</strong> {result.stage_1?.seed_treatment}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Stage 2: Growth */}
                    <AccordionItem value="item-2" className="border rounded-lg bg-card px-4 shadow-sm border-l-4 border-l-blue-500">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left w-full">
                          <span className="text-2xl bg-blue-50 p-2 rounded-full">💧</span>
                          <div>
                            <h3 className="font-semibold text-lg">Step 2: Growth & Nutrition</h3>
                            <p className="text-sm text-muted-foreground font-normal">Optimizing crop development</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2 border-t mt-2">
                        <div className="flex gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage2-en', result.stage_2?.voice_summary_en, 'en-US')}
                            className={cn("text-xs transition-colors", playingId === 'stage2-en' && "bg-blue-100 border-blue-300")}
                          >
                            {playingId === 'stage2-en' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            English
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage2-hi', result.stage_2?.voice_summary_hi, 'hi-IN')}
                            className={cn("text-xs transition-colors", playingId === 'stage2-hi' && "bg-blue-100 border-blue-300")}
                          >
                            {playingId === 'stage2-hi' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            हिंदी
                          </Button>
                          {(playingId === 'stage2-en' || playingId === 'stage2-hi') && (
                            <Button variant="ghost" size="sm" onClick={stopAudio} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Square className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 mt-2">
                          <div>
                            <h4 className="font-semibold text-blue-700 mb-2">Fertilizer Schedule</h4>
                            <p className="text-sm leading-relaxed text-gray-700">{result.stage_2?.fertilizer_plan}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-700 mb-2">Irrigation Plan</h4>
                            <p className="text-sm leading-relaxed text-gray-700">{result.stage_2?.irrigation_schedule}</p>
                            <div className="mt-4 text-xs bg-red-50 p-3 rounded-lg text-red-800 border-l-4 border-red-500">
                              <strong>⚠️ Pest Alert:</strong> {result.stage_2?.pest_protection}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Stage 3: Harvest */}
                    <AccordionItem value="item-3" className="border rounded-lg bg-card px-4 shadow-sm border-l-4 border-l-yellow-500">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left w-full">
                          <span className="text-2xl bg-yellow-50 p-2 rounded-full">🌾</span>
                          <div>
                            <h3 className="font-semibold text-lg">Step 3: Harvest Planning</h3>
                            <p className="text-sm text-muted-foreground font-normal">Timing your harvest perfectly</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2 border-t mt-2">
                        <div className="flex gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage3-en', result.stage_3?.voice_summary_en, 'en-US')}
                            className={cn("text-xs transition-colors", playingId === 'stage3-en' && "bg-yellow-100 border-yellow-300")}
                          >
                            {playingId === 'stage3-en' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            English
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage3-hi', result.stage_3?.voice_summary_hi, 'hi-IN')}
                            className={cn("text-xs transition-colors", playingId === 'stage3-hi' && "bg-yellow-100 border-yellow-300")}
                          >
                            {playingId === 'stage3-hi' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            हिंदी
                          </Button>
                          {(playingId === 'stage3-en' || playingId === 'stage3-hi') && (
                            <Button variant="ghost" size="sm" onClick={stopAudio} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Square className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 mt-2">
                          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                              <Clock className="w-6 h-6 text-yellow-400" />
                              <span className="font-bold text-2xl text-yellow-50">{result.stage_3?.days_remaining} Days Left</span>
                            </div>
                            <div className="text-sm text-slate-300">
                              <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Harvest Window</span>
                              <span className="text-lg font-medium text-white">{result.stage_3?.harvest_window}</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-yellow-700 mb-2">Maturity Signs</h4>
                            <p className="text-sm leading-relaxed text-gray-700">{result.stage_3?.harvest_signs}</p>
                            <div className="mt-4 text-xs bg-yellow-50 p-3 rounded-lg text-yellow-800 border border-yellow-200">
                              <strong>🚜 Post-Harvest:</strong> {result.stage_3?.post_harvest_care}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Stage 4: Market */}
                    <AccordionItem value="item-4" className="border rounded-lg bg-card px-4 shadow-sm border-l-4 border-l-purple-500">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left w-full">
                          <span className="text-2xl bg-purple-50 p-2 rounded-full">💰</span>
                          <div>
                            <h3 className="font-semibold text-lg">Step 4: Market Intelligence</h3>
                            <p className="text-sm text-muted-foreground font-normal">Maximize your profits</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2 border-t mt-2">
                        <div className="flex gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage4-en', result.stage_4?.voice_summary_en, 'en-US')}
                            className={cn("text-xs transition-colors", playingId === 'stage4-en' && "bg-purple-100 border-purple-300")}
                          >
                            {playingId === 'stage4-en' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            English
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioControl('stage4-hi', result.stage_4?.voice_summary_hi, 'hi-IN')}
                            className={cn("text-xs transition-colors", playingId === 'stage4-hi' && "bg-purple-100 border-purple-300")}
                          >
                            {playingId === 'stage4-hi' && !isPaused ? <Pause className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                            हिंदी
                          </Button>
                          {(playingId === 'stage4-en' || playingId === 'stage4-hi') && (
                            <Button variant="ghost" size="sm" onClick={stopAudio} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Square className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 mb-6 mt-4">
                          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="text-sm text-purple-600 font-medium mb-1">Current Price</div>
                            <div className="text-2xl font-bold text-purple-900">₹{result.stage_4?.current_price}/Q</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="text-sm text-purple-600 font-medium mb-1">Est. Revenue</div>
                            <div className="text-2xl font-bold text-purple-900">{result.stage_4?.estimated_revenue}</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="text-sm text-purple-600 font-medium mb-1">Trend</div>
                            <div className="text-2xl font-bold flex items-center justify-center gap-2">
                              {result.stage_4?.trend}
                              {result.stage_4?.trend === 'Bullish' ? <TrendingUp className="text-green-600 w-6 h-6" /> : <TrendingDown className="text-red-500 w-6 h-6" />}
                            </div>
                          </div>
                        </div>

                        <div className="h-[250px] w-full mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                              { week: 'Now', price: result.stage_4?.current_price },
                              ...(result.stage_4?.forecast || [])
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis domain={['auto', 'auto']} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                              <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#6b21a8', fontWeight: 'bold' }}
                              />
                              <Line type="monotone" dataKey="price" stroke="#9333ea" strokeWidth={3} dot={{ r: 4, fill: '#9333ea', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                          <div className="flex-1">
                            <div className="text-sm text-green-700 font-semibold mb-1 uppercase tracking-wide">Recommended Mandi</div>
                            <div className="text-xl font-bold text-green-900 flex items-center gap-2">
                              📍 {result.stage_4?.best_mandi}
                            </div>
                            <p className="text-xs text-green-600 mt-1">Best real value in {state}</p>
                          </div>
                          <Button
                            className="bg-green-700 hover:bg-green-800 whitespace-nowrap w-full md:w-auto shadow-md"
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.stage_4?.best_mandi + ' Mandi ' + state)}`, '_blank')}
                          >
                            Sell Here
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg bg-muted/20">
                  <div className="bg-primary/10 p-4 rounded-full mb-4 animate-pulse">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Enter your crop and date details, including your <strong>State</strong>, to generate a customized Seed-to-Market report.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: MARKETPLACE LISTINGS */}
        <TabsContent value="listings" className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar / Filters */}
            <div className="w-full md:w-1/4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Search crops..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <Select onValueChange={(val) => setFilters(prev => ({ ...prev, state: val === 'all' ? '' : val }))}>
                    <SelectTrigger><SelectValue placeholder="Filter by State" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      <SelectItem value="bihar">Bihar</SelectItem>
                      <SelectItem value="uttar pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="punjab">Punjab</SelectItem>
                      <SelectItem value="haryana">Haryana</SelectItem>
                      <SelectItem value="madhya pradesh">Madhya Pradesh</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-green-400" /> Sell Your Produce
                  </CardTitle>
                  <CardDescription className="text-slate-400">Reach 10,000+ verified buyers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Your Name"
                    value={newListing.farmerName}
                    onChange={(e) => setNewListing({ ...newListing, farmerName: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Input
                    placeholder="Contact Number (10 digits)"
                    type="tel"
                    maxLength={10}
                    value={newListing.contactNumber}
                    onChange={(e) => setNewListing({ ...newListing, contactNumber: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Input
                    placeholder="Crop Name (e.g. Wheat)"
                    value={newListing.cropName}
                    onChange={(e) => setNewListing({ ...newListing, cropName: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Qty (Q)"
                      type="number"
                      value={newListing.quantity}
                      onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    <Input
                      placeholder="Price/Q"
                      type="number"
                      value={newListing.price}
                      onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Select onValueChange={(val) => setNewListing({ ...newListing, location: val })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bihar">Bihar</SelectItem>
                      <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="Punjab">Punjab</SelectItem>
                      <SelectItem value="Haryana">Haryana</SelectItem>
                      <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold mt-2" onClick={handlePostListing}>
                    Post Listing Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Listings Grid */}
            <div className="w-full md:w-3/4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.length > 0 ? (
                  filteredListings.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-all duration-300 border-green-100 group">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span> VERIFIED FARMER
                          </div>
                          <span className="text-[10px] text-muted-foreground">{item.timestamp?.split(' ')[0]}</span>
                        </div>
                        <CardTitle className="mt-2 text-lg font-extrabold text-green-800 capitalize tracking-tight">{item.cropName}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3" /> {item.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-end mb-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Quantity</div>
                            <div className="font-bold text-white">{item.quantity} Q</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Price</div>
                            <div className="font-bold text-green-400 text-lg">₹{item.price}/Q</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs text-slate-500 font-medium">Sold by: {item.farmerName}</div>

                          {contactVisible[item.id] ? (
                            <div className="w-full bg-green-50 border border-green-200 text-green-800 font-bold text-center py-2 rounded-md animate-in fade-in zoom-in duration-300 flex items-center justify-center gap-2">
                              <Phone className="w-4 h-4" /> {item.contactNumber}
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                              onClick={() => toggleContact(item.id)}
                            >
                              <Phone className="w-4 h-4 mr-2" /> Contact Farmer
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                    <Sprout className="w-12 h-12 mb-2 text-slate-300" />
                    <p>No listings found. Be the first to sell!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: REAL-TIME MARKET PRICES */}
        <TabsContent value="trends" className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filter Sidebar */}
            <div className="w-full md:w-1/4 space-y-4">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Market Location</CardTitle>
                  <CardDescription className="text-slate-400">Find today's mandi rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">State</label>
                    <Select
                      value={priceFilters.state}
                      onValueChange={(val) => setPriceFilters({ ...priceFilters, state: val, district: '' })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {["Andhra Pradesh", "Bihar", "Gujarat", "Haryana", "Himachal Pradesh", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">District</label>
                    <Select
                      value={priceFilters.district}
                      onValueChange={(val) => setPriceFilters({ ...priceFilters, district: val })}
                      disabled={!priceFilters.state}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {priceFilters.state === 'Bihar' && ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Punjab' && ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Hoshiarpur", "Mohali"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Maharashtra' && ["Pune", "Nashik", "Nagpur", "Mumbai", "Aurangabad", "Solapur", "Amravati"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Uttar Pradesh' && ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Prayagraj", "Bareilly"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Haryana' && ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Madhya Pradesh' && ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Rajasthan' && ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Gujarat' && ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'West Bengal' && ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Karnataka' && ["Bengaluru", "Mysuru", "Hubballi", "Belagavi", "Mangaluru"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {priceFilters.state === 'Tamil Nadu' && ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        {!['Bihar', 'Punjab', 'Maharashtra', 'Uttar Pradesh', 'Haryana', 'Madhya Pradesh', 'Rajasthan', 'Gujarat', 'West Bengal', 'Karnataka', 'Tamil Nadu'].includes(priceFilters.state) && (
                          <SelectItem value="Other">Other</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Market (Mandi) input removed */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Category</label>
                    <Select onValueChange={(val) => setPriceFilters({ ...priceFilters, category: val })} defaultValue="All">
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Commodities</SelectItem>
                        <SelectItem value="Vegetables">Vegetables</SelectItem>
                        <SelectItem value="Fruits">Fruits</SelectItem>
                        <SelectItem value="Cereals">Cereals</SelectItem>
                        <SelectItem value="Pulses">Pulses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-900/20" onClick={fetchMarketPrices} disabled={pricesLoading}>
                    {pricesLoading ? "Fetching..." : "Check Live Rates"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Area */}
            <div className="w-full md:w-3/4">
              <Card className="h-full border-none shadow-none bg-transparent">
                <CardHeader className="pl-0 pt-0">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-green-600" /> Live Market Rates <span className="text-sm font-normal text-muted-foreground ml-2">(Agmarknet Source)</span>
                  </CardTitle>
                  <CardDescription>Real-time prices for {priceFilters.district || 'Selected District'}, {priceFilters.state || 'India'}</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                  {pricesLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : marketPrices.length > 0 ? (
                    <div className="grid gap-3">
                      {marketPrices.map((price, idx) => (
                        <div key={idx} className="bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-800 flex flex-col md:flex-row justify-between items-center hover:bg-slate-800/80 transition-all group">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">{price.commodity}</h3>
                              <span className="text-xs bg-green-900/30 text-green-400 border border-green-800/50 px-2 py-1 rounded">{price.variety}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Updated: {price.date}</p>
                          </div>

                          <div className="flex gap-6 mt-2 md:mt-0">
                            <div className="text-center">
                              <div className="text-xs text-slate-400 uppercase">Min Price</div>
                              <div className="font-semibold text-slate-200">₹{price.min_price}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-slate-400 uppercase">Max Price</div>
                              <div className="font-semibold text-slate-200">₹{price.max_price}</div>
                            </div>
                            <div className="text-center bg-green-950/30 px-5 py-2 rounded border border-green-900">
                              <div className="text-[10px] text-green-500 uppercase font-bold tracking-wider">Modal Price</div>
                              <div className="font-bold text-green-400 text-xl">₹{price.modal_price}/kg</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                      <Search className="w-12 h-12 mb-2 text-slate-300" />
                      <p>Enter location specifics to see live market rates.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Marketplace;