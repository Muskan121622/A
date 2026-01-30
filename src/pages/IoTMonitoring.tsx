import { motion } from "framer-motion";
import { Wifi, Thermometer, Droplets, Activity, Battery, AlertTriangle, ArrowLeft, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IoTSoilMonitor } from "@/lib/iot-monitoring";
import { useState, useEffect } from "react";

const IoTMonitoring = () => {
  const [monitor] = useState(() => new IoTSoilMonitor());
  const [latestReadings, setLatestReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const updateData = async () => {
      const readings = await monitor.getLatestReadings();
      const activeAlerts = await monitor.getActiveAlerts();
      const irrigationRecs = await monitor.getIrrigationRecommendations();
      
      setLatestReadings(readings);
      setAlerts(activeAlerts);
      setRecommendations(irrigationRecs);
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [monitor]);

  const handleIrrigate = async (zoneId, duration) => {
    await monitor.simulateIrrigation(zoneId, duration);
    // Refresh data after irrigation
    setTimeout(async () => {
      const readings = await monitor.getLatestReadings();
      setLatestReadings(readings);
    }, 2000);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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
            <div className="text-6xl mb-6">📡</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              IoT Soil Monitoring System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Real-time soil monitoring with AI-powered irrigation recommendations. 
              Monitor moisture, pH, temperature, and nutrients across your entire farm.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary">
                <Wifi className="mr-2 w-5 h-5" />
                Live Monitoring
              </Button>
              <Button size="lg" variant="outline">
                <Activity className="mr-2 w-5 h-5" />
                View Analytics
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Sensor Data */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Live Sensor Data</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {latestReadings.map((reading, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {reading.location.zone}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reading.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    <span className={`text-sm ${reading.batteryLevel > 20 ? 'text-green-600' : 'text-red-600'}`}>
                      {reading.batteryLevel.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded">
                    <Droplets className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="font-bold text-blue-600">{reading.soilMoisture.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Moisture</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded">
                    <Activity className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="font-bold text-green-600">{reading.ph.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">pH</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded">
                    <Thermometer className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <div className="font-bold text-orange-600">{reading.temperature.toFixed(1)}°C</div>
                    <div className="text-xs text-muted-foreground">Temperature</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded">
                    <Zap className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <div className="font-bold text-purple-600">{reading.conductivity}</div>
                    <div className="text-xs text-muted-foreground">µS/cm</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">N:</span>
                      <span>{reading.nitrogen.toFixed(1)} ppm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P:</span>
                      <span>{reading.phosphorus.toFixed(1)} ppm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">K:</span>
                      <span>{reading.potassium.toFixed(1)} ppm</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Alerts and Recommendations */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Alerts & Recommendations</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Active Alerts */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Active Alerts ({alerts.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.length > 0 ? alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-background rounded border">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{alert.message}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active alerts</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Irrigation Recommendations */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                Irrigation Recommendations ({recommendations.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-4 rounded border ${getUrgencyColor(rec.urgency)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{rec.zoneId}</div>
                        <div className="text-sm opacity-80">{rec.reason}</div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {rec.urgency}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm">
                        <span className="font-medium capitalize">{rec.action}</span>
                        {rec.duration > 0 && <span> for {rec.duration} min</span>}
                      </div>
                      {rec.action === 'irrigate' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleIrrigate(rec.zoneId, rec.duration)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Start Irrigation
                        </Button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No irrigation recommendations</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* System Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">IoT System Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Real-time Monitoring",
                description: "24/7 continuous soil parameter monitoring",
                icon: "📊",
                features: ["Soil Moisture", "pH Levels", "Temperature", "Conductivity"]
              },
              {
                title: "Smart Alerts",
                description: "AI-powered alert system for critical conditions",
                icon: "🚨",
                features: ["Threshold Alerts", "Predictive Warnings", "Mobile Notifications", "Email Reports"]
              },
              {
                title: "Auto Irrigation",
                description: "Automated irrigation based on soil conditions",
                icon: "💧",
                features: ["Smart Scheduling", "Zone Control", "Water Optimization", "Remote Control"]
              },
              {
                title: "Data Analytics",
                description: "Historical data analysis and trend monitoring",
                icon: "📈",
                features: ["Trend Analysis", "Performance Reports", "Yield Correlation", "ROI Tracking"]
              }
            ].map((feature, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                <div className="space-y-1">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">IoT Monitoring Benefits</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { title: "40% Water Savings", desc: "Precision irrigation control", icon: "💧" },
              { title: "25% Yield Increase", desc: "Optimal growing conditions", icon: "📈" },
              { title: "60% Labor Reduction", desc: "Automated monitoring", icon: "🤖" },
              { title: "Real-time Insights", desc: "Instant decision making", icon: "⚡" }
            ].map((benefit, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h3 className="font-bold mb-2 text-primary">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IoTMonitoring;