import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, Map, TrendingUp, Leaf, Bug, Droplets,
  Activity, BarChart3, MapPin, Zap, Target,
  AlertTriangle, CheckCircle, ArrowLeft
} from "lucide-react";
import EnhancedImageAnalysis from "@/components/EnhancedImageAnalysis";
import { GISDigitalTwin } from "@/lib/gis-digital-twin";
import { yieldPredictor } from "@/lib/yield-prediction";
import { weatherIntegration } from "@/lib/advanced-weather-integration";
import PestPrediction from "./PestPrediction";
import Marketplace from "./Marketplace";

const ComprehensiveDashboard = () => {
  const [gisEngine] = useState(() => new GISDigitalTwin());
  const [farmData, setFarmData] = useState(null);
  const [yieldPredictions, setYieldPredictions] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setIsLoading(true);

    try {
      // Initialize demo farm
      const demoCoordinates = [
        { lat: 26.1440, lng: 91.7360 },
        { lat: 26.1440, lng: 91.7370 },
        { lat: 26.1450, lng: 91.7370 },
        { lat: 26.1450, lng: 91.7360 }
      ];

      const farm = await gisEngine.initializeFarm('AgriSphere Demo Farm', 'Demo User', demoCoordinates);
      setFarmData(farm);

      // Generate yield predictions for multiple crops
      const crops = ['rice', 'wheat', 'maize', 'sugarcane'];
      const predictions = await Promise.all(
        crops.map(crop => yieldPredictor.predictYield({
          crop,
          district: 'Patna',
          season: 'kharif',
          area_hectares: 5,
          year: 2025
        }))
      );

      setYieldPredictions(crops.map((crop, i) => ({ crop, ...predictions[i] })));

      // Load weather data
      const weather = await weatherIntegration.loadWeatherData('Patna');
      setWeatherData(weather.slice(0, 30)); // Last 30 days

    } catch (error) {
      console.error('Dashboard initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getYieldColor = (yield_value: number, crop: string) => {
    const thresholds = {
      rice: { good: 3000, fair: 2000 },
      wheat: { good: 3500, fair: 2500 },
      maize: { good: 4000, fair: 3000 },
      sugarcane: { good: 60000, fair: 45000 }
    };

    const threshold = thresholds[crop as keyof typeof thresholds] || { good: 3000, fair: 2000 };

    if (yield_value >= threshold.good) return 'text-green-600';
    if (yield_value >= threshold.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

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
            <span className="text-xl font-bold gradient-text">AgriSphere AI Dashboard</span>
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
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Comprehensive AI Agriculture Dashboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Advanced AI-powered agriculture management system combining disease detection,
              GIS digital twin, and yield prediction for precision farming.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary">
                <Brain className="mr-2 w-5 h-5" />
                AI Analysis
              </Button>
              <Button size="lg" variant="outline">
                <Map className="mr-2 w-5 h-5" />
                Digital Twin
              </Button>
              <Button size="lg" variant="outline">
                <TrendingUp className="mr-2 w-5 h-5" />
                Yield Prediction
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="overview">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="disease-detection">
                <Leaf className="w-4 h-4 mr-2" />
                AI Disease Detection
              </TabsTrigger>
              <TabsTrigger value="digital-twin">
                <Map className="w-4 h-4 mr-2" />
                GIS Digital Twin
              </TabsTrigger>
              <TabsTrigger value="yield-prediction">
                <TrendingUp className="w-4 h-4 mr-2" />
                Yield Prediction
              </TabsTrigger>
              <TabsTrigger value="pest-prediction">
                <Bug className="w-4 h-4 mr-2" />
                Pest Forecast
              </TabsTrigger>
              <TabsTrigger value="marketplace">
                <Sprout className="w-4 h-4 mr-2" />
                Marketplace
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Key Metrics */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 text-center">
                  <Brain className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="font-bold mb-2">AI Models</h3>
                  <div className="text-2xl font-bold text-blue-500">4</div>
                  <div className="text-sm text-muted-foreground">Active Models</div>
                </Card>

                <Card className="p-6 text-center">
                  <Map className="w-8 h-8 mx-auto mb-3 text-green-500" />
                  <h3 className="font-bold mb-2">Farm Area</h3>
                  <div className="text-2xl font-bold text-green-500">
                    {farmData ? farmData.totalArea.toFixed(1) : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Hectares</div>
                </Card>

                <Card className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                  <h3 className="font-bold mb-2">Detection Classes</h3>
                  <div className="text-2xl font-bold text-orange-500">25+</div>
                  <div className="text-sm text-muted-foreground">Disease/Pest Types</div>
                </Card>

                <Card className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                  <h3 className="font-bold mb-2">Accuracy</h3>
                  <div className="text-2xl font-bold text-purple-500">95%+</div>
                  <div className="text-sm text-muted-foreground">AI Precision</div>
                </Card>
              </div>

              {/* System Status */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-500" />
                    Disease Detection System
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Multi-class Models</span>
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Disease Classes</span>
                      <span className="font-medium">8 Types</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pest Classes</span>
                      <span className="font-medium">7 Types</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Nutrient Analysis</span>
                      <span className="font-medium">6 Types</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Map className="w-5 h-5 text-blue-500" />
                    GIS Digital Twin
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Spatial Analysis</span>
                      <Badge className="bg-blue-500 text-white">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Soil Zones</span>
                      <span className="font-medium">{farmData?.soilZones?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Irrigation Zones</span>
                      <span className="font-medium">{farmData?.irrigationZones?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Crop Zones</span>
                      <span className="font-medium">{farmData?.cropGrowthZones?.length || 0}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Yield Prediction
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>ML Models</span>
                      <Badge className="bg-purple-500 text-white">4 Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Supported Crops</span>
                      <span className="font-medium">5 Types</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Weather Integration</span>
                      <Badge className="bg-green-500 text-white">Live</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Prediction Accuracy</span>
                      <span className="font-medium">94%+</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Yield Overview */}
              {yieldPredictions.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Crop Yield Predictions (2025)</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {yieldPredictions.map((pred, idx) => (
                      <div key={idx} className="text-center p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium capitalize mb-2">{pred.crop}</h4>
                        <div className={`text-2xl font-bold ${getYieldColor(pred.predicted_yield, pred.crop)}`}>
                          {pred.crop === 'sugarcane'
                            ? (pred.predicted_yield / 1000).toFixed(1) + 't'
                            : (pred.predicted_yield / 1000).toFixed(2) + 't'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">per hectare</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Disease Detection Tab */}
            <TabsContent value="disease-detection">
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">AI-Powered Multi-Class Disease Detection</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Advanced AI system for detecting diseases, pests, nutrient deficiencies, and soil analysis
                    from leaf, stem, fruit, and soil images with 95%+ accuracy.
                  </p>
                </div>
                <EnhancedImageAnalysis analysisType="comprehensive" />
              </div>
            </TabsContent>

            {/* Digital Twin Tab */}
            <TabsContent value="digital-twin">
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">GIS-Based Smart Farm Digital Twin</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Comprehensive digital replica of your farm with advanced spatial analysis,
                    multi-layer GIS mapping, and precision agriculture insights.
                  </p>
                </div>

                {farmData && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-3 text-green-500" />
                      <h3 className="font-bold mb-2">Total Area</h3>
                      <div className="text-2xl font-bold text-green-500">
                        {farmData.totalArea.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Hectares</div>
                    </Card>

                    <Card className="p-6 text-center">
                      <Droplets className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                      <h3 className="font-bold mb-2">Irrigation Zones</h3>
                      <div className="text-2xl font-bold text-blue-500">
                        {farmData.irrigationZones?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Zones</div>
                    </Card>

                    <Card className="p-6 text-center">
                      <Bug className="w-8 h-8 mx-auto mb-3 text-red-500" />
                      <h3 className="font-bold mb-2">Pest Areas</h3>
                      <div className="text-2xl font-bold text-red-500">
                        {farmData.pestProneAreas?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Monitored</div>
                    </Card>

                    <Card className="p-6 text-center">
                      <Activity className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                      <h3 className="font-bold mb-2">Crop Health</h3>
                      <div className="text-2xl font-bold text-purple-500">
                        {farmData.cropGrowthZones?.length > 0
                          ? Math.round(farmData.cropGrowthZones.reduce((sum, zone) => sum + zone.health, 0) / farmData.cropGrowthZones.length)
                          : 0
                        }%
                      </div>
                      <div className="text-sm text-muted-foreground">Average</div>
                    </Card>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Map className="w-5 h-5 text-primary" />
                      Spatial Analysis Features
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Field boundary mapping with GPS precision</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Multi-layer soil zone classification</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Irrigation zone optimization</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Pest-prone area identification</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Crop growth stage monitoring</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Weather microclimate analysis</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Precision Agriculture Benefits
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/30 rounded">
                        <span>Water Savings</span>
                        <Badge className="bg-green-500 text-white">25%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded">
                        <span>Yield Increase</span>
                        <Badge className="bg-blue-500 text-white">35%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded">
                        <span>Pest Reduction</span>
                        <Badge className="bg-orange-500 text-white">40%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded">
                        <span>Cost Reduction</span>
                        <Badge className="bg-purple-500 text-white">30%</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Yield Prediction Tab */}
            <TabsContent value="yield-prediction">
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Advanced AI Yield Prediction</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Machine learning models using Random Forest, LSTM, and Gradient Boosting
                    for accurate crop yield predictions with weather and soil integration.
                  </p>
                </div>

                {yieldPredictions.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-8">
                    {yieldPredictions.map((pred, idx) => (
                      <Card key={idx} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold capitalize">{pred.crop}</h3>
                            <p className="text-muted-foreground">Kharif Season 2025</p>
                          </div>
                          <Badge className="bg-primary text-white">
                            {pred.crop === 'sugarcane'
                              ? (pred.predicted_yield / 1000).toFixed(1) + ' tons/ha'
                              : (pred.predicted_yield / 1000).toFixed(2) + ' tons/ha'
                            }
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between">
                            <span>Confidence Range:</span>
                            <span className="font-medium">
                              {(pred.confidence_interval.lower / 1000).toFixed(1)} - {(pred.confidence_interval.upper / 1000).toFixed(1)} tons/ha
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>5-Year Average:</span>
                            <span className="font-medium">
                              {(pred.historical_comparison.avg_yield_5yr / 1000).toFixed(1)} tons/ha
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Trend:</span>
                            <Badge className={`${pred.historical_comparison.trend === 'increasing' ? 'bg-green-500' :
                              pred.historical_comparison.trend === 'decreasing' ? 'bg-red-500' : 'bg-yellow-500'
                              } text-white capitalize`}>
                              {pred.historical_comparison.trend}
                            </Badge>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Key Factors</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span>Crop Suitability:</span>
                              <span>{pred.factors.crop_suitability}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Regional Performance:</span>
                              <span>{pred.factors.regional_performance}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Seasonal Factors:</span>
                              <span>{pred.factors.seasonal_factors}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Area Efficiency:</span>
                              <span>{pred.factors.area_efficiency}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">ML Model Performance</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <h4 className="font-medium mb-2">Random Forest</h4>
                      <div className="text-2xl font-bold text-blue-600">94%</div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <h4 className="font-medium mb-2">LSTM Networks</h4>
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <h4 className="font-medium mb-2">Gradient Boosting</h4>
                      <div className="text-2xl font-bold text-purple-600">96%</div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <h4 className="font-medium mb-2">XGBoost</h4>
                      <div className="text-2xl font-bold text-orange-600">95%</div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>


            {/* Pest Prediction Tab */}
            <TabsContent value="pest-prediction">
              <PestPrediction />
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace">
              <Marketplace />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default ComprehensiveDashboard;