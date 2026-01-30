import { motion } from "framer-motion";
import { Brain, Camera, Upload, Zap, Target, Activity, ArrowLeft, Bug, Leaf, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EnhancedImageAnalysis from "@/components/EnhancedImageAnalysis";
import ImageAnalysis from "@/components/ImageAnalysis";
import { EnhancedDiseaseDetector } from "@/lib/enhanced-disease-detection";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';

const DiseaseDetection = () => {
  const [detector] = useState(() => new EnhancedDiseaseDetector());
  const [isLoading, setIsLoading] = useState(true);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeDetector = async () => {
      await detector.loadModels();
      setIsLoading(false);
    };
    initializeDetector();
  }, [detector]);

  const [showSaved, setShowSaved] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  useEffect(() => {
    if (showSaved) {
      const loaded = JSON.parse(localStorage.getItem('offlineDiseaseReports') || '[]');
      setSavedReports(loaded);
    }
  }, [showSaved]);

  const handleStartDetection = () => {
    analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUploadImages = () => {
    // This will be handled by the EnhancedImageAnalysis component
    analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectionTypes = [
    {
      title: "Leaf Disease Detection",
      description: "Analyze leaf images for fungal infections, bacterial diseases, and viral infections",
      accuracy: "95%",
      icon: "🍃",
      diseases: ["Blight", "Rust", "Mosaic Virus", "Bacterial Spot"]
    },
    {
      title: "Stem Analysis",
      description: "Detect stem borers, rot, and structural damage in crop stems",
      accuracy: "92%",
      icon: "🌿",
      diseases: ["Stem Borer", "Stem Rot", "Canker", "Wilt"]
    },
    {
      title: "Fruit Inspection",
      description: "Identify fruit diseases, pest damage, and quality issues",
      accuracy: "94%",
      icon: "🍅",
      diseases: ["Fruit Rot", "Pest Damage", "Cracking", "Discoloration"]
    },
    {
      title: "Soil Health Analysis",
      description: "AI-powered soil texture and nutrient deficiency detection",
      accuracy: "89%",
      icon: "🌱",
      diseases: ["Nutrient Deficiency", "pH Imbalance", "Salinity", "Compaction"]
    }
  ];

  const pestTypes = [
    { name: "Aphids", damage: "Sap sucking", treatment: "Neem oil spray" },
    { name: "Thrips", damage: "Leaf damage", treatment: "Blue sticky traps" },
    { name: "Whitefly", damage: "Virus transmission", treatment: "Yellow traps" },
    { name: "Caterpillars", damage: "Leaf eating", treatment: "Bt spray" }
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
            <div className="text-6xl mb-6">🔬</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              AI Multi-Class Disease Detection
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Revolutionary multi-class AI system detecting diseases, pests, nutrient deficiencies, and soil texture
              from leaf, stem, fruit, and soil images with 95%+ accuracy using ensemble CNN models.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary" onClick={handleStartDetection}>
                <Camera className="mr-2 w-5 h-5" />
                Start Detection
              </Button>
              <Button size="lg" variant="outline" onClick={handleUploadImages}>
                <Upload className="mr-2 w-5 h-5" />
                Upload Images
              </Button>
              <Button size="lg" variant="secondary" className="border-primary/20" onClick={() => setShowSaved(!showSaved)}>
                <span className="mr-2">💾</span>
                {showSaved ? "Hide Saved" : "Saved Reports"}
              </Button>
            </div>

            {showSaved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 text-left max-w-4xl mx-auto bg-card border border-border rounded-xl p-6 shadow-xl"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>📂</span> Offline Disease Reports
                </h3>
                {savedReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No saved reports found.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {savedReports.map((report: any) => (
                      <Card key={report.id} className="p-4 border-l-4 border-l-primary cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{new Date(report.timestamp).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(report.timestamp).toLocaleTimeString()}</p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${report.results.overallHealth.status === 'excellent' ? 'bg-green-100 text-green-700' :
                            report.results.overallHealth.status === 'good' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {report.results.overallHealth.status.toUpperCase()}
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <p><strong>Score:</strong> {report.results.overallHealth.score}/100</p>
                          <p><strong>Issues:</strong> {report.results.diseases.length} Diseases, {report.results.pests.length} Pests</p>
                        </div>
                        <Button variant="link" className="px-0 mt-2 text-primary" onClick={() => {
                          // Simple alert for now, effectively we could load this into the main view
                          alert(JSON.stringify(report.results.overallHealth.recommendations, null, 2));
                        }}>
                          View Quick Summary
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Detection Types */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Multi-Class Detection Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {detectionTypes.map((type, i) => (
              <Card key={i} className="p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{type.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold">{type.title}</h3>
                      <div className="bg-primary/20 px-3 py-1 rounded-full text-primary font-bold text-sm">
                        {type.accuracy}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{type.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {type.diseases.map((disease, idx) => (
                        <div key={idx} className="text-xs bg-muted px-2 py-1 rounded text-center">
                          {disease}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pest Detection */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Pest Detection & Treatment</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pestTypes.map((pest, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-3xl mb-3">🐛</div>
                <h3 className="font-bold mb-2">{pest.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{pest.damage}</p>
                <div className="text-xs bg-primary/20 px-2 py-1 rounded-full text-primary">
                  {pest.treatment}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Multi-Class Detection */}
      <section ref={analysisRef} className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Enhanced Multi-Class AI Detection</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
              <Leaf className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-bold mb-2">Disease Detection</h3>
              <p className="text-muted-foreground mb-4">8 disease classes including blight, rust, and viral infections</p>
              <div className="text-2xl font-bold text-green-500">95.2%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
              <Bug className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold mb-2">Pest Detection</h3>
              <p className="text-muted-foreground mb-4">6 pest classes with treatment recommendations</p>
              <div className="text-2xl font-bold text-red-500">92.8%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
              <Apple className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-bold mb-2">Soil Analysis</h3>
              <p className="text-muted-foreground mb-4">Texture analysis and nutrient deficiency detection</p>
              <div className="text-2xl font-bold text-orange-500">89.4%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
          </div>
          <div className="max-w-4xl mx-auto">
            <EnhancedImageAnalysis analysisType="comprehensive" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How AI Detection Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Image Capture", desc: "Take photo of affected plant part", icon: Camera },
              { step: "2", title: "AI Analysis", desc: "CNN models process image data", icon: Brain },
              { step: "3", title: "Classification", desc: "Multi-class detection results", icon: Target },
              { step: "4", title: "Treatment Plan", desc: "Actionable recommendations", icon: Zap }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DiseaseDetection;