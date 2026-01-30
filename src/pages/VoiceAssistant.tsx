import { motion } from "framer-motion";
import { Mic, Volume2, MessageCircle, Languages, Play, Pause, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import VoiceRecognition from "@/components/VoiceRecognition";

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const voiceFeatures = [
    {
      title: "Hindi Voice Recognition",
      description: "Speak naturally in Hindi and get instant responses",
      icon: "🎤",
      example: "\"Gehun mein rog a gaya hai, kya karein?\"",
      response: "Wheat disease detected. Apply fungicide spray."
    },
    {
      title: "Local Language Support",
      description: "Support for regional languages across India",
      icon: "🗣️",
      languages: ["Hindi", "English (India)"],
      coverage: "2 languages"
    },
    {
      title: "Audio Responses",
      description: "Get detailed audio responses in your preferred language",
      icon: "🔊",
      features: ["Clear pronunciation", "Slow/Fast speed", "Repeat option", "Save audio"]
    },
    {
      title: "Offline Voice Commands",
      description: "Basic voice commands work even without internet",
      icon: "📱",
      commands: ["Weather check", "Crop calendar", "Basic diagnosis", "Emergency help"]
    }
  ];

  const conversationExamples = [
    {
      farmer: "Tomato mein patte peelay ho rahe hain",
      translation: "Tomato leaves are turning yellow",
      ai: "यह नाइट्रोजन की कमी हो सकती है। यूरिया का छिड़काव करें।",
      aiTranslation: "This could be nitrogen deficiency. Apply urea spray.",
      solution: "Apply 2kg urea per acre with water spray"
    },
    {
      farmer: "Kya aaj pani dena chahiye?",
      translation: "Should I water today?",
      ai: "मिट्टी में नमी 40% है। 2 दिन बाद पानी दें।",
      aiTranslation: "Soil moisture is 40%. Water after 2 days.",
      solution: "Wait 2 days, then apply 25mm irrigation"
    },
    {
      farmer: "Fasal kab kaatni chahiye?",
      translation: "When should I harvest the crop?",
      ai: "आपकी गेहूं 15 दिन में तैयार होगी। दाने सुनहरे होने का इंतज़ार करें।",
      aiTranslation: "Your wheat will be ready in 15 days. Wait for golden grains.",
      solution: "Harvest when moisture content is 12-14%"
    }
  ];

  const supportedLanguages = [
    { name: "Hindi", speakers: "600M+", status: "Full Support", flag: "🇮🇳" },
    { name: "English (India)", speakers: "125M+", status: "Full Support", flag: "🇮🇳" }
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
            <div className="text-6xl mb-6">🎙️</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Voice Assistant for Farmers
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Speak naturally in Hindi or your local language. Get instant AI-powered
              agricultural advice with voice responses designed for rural farmers.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className={`bg-gradient-primary transition-all duration-300 ${isListening ? 'animate-pulse' : ''}`}
                onClick={() => {
                  document.getElementById('voice-demo')?.scrollIntoView({ behavior: 'smooth' });
                  // Optional: Trigger a focus or highlight
                }}
              >
                <Mic className="mr-2 w-5 h-5" />
                Start Speaking
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('voice-demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Languages className="mr-2 w-5 h-5" />
                Choose Language
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Voice Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Voice Assistant Features</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {voiceFeatures.map((feature, i) => (
              <Card key={i} className="p-8 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    {feature.example && (
                      <div className="bg-primary/10 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-primary">"{feature.example}"</p>
                        <p className="text-xs text-muted-foreground mt-1">{feature.response}</p>
                      </div>
                    )}
                    {feature.languages && (
                      <div className="grid grid-cols-3 gap-2">
                        {feature.languages.map((lang, idx) => (
                          <div key={idx} className="text-xs bg-muted px-2 py-1 rounded text-center">
                            {lang}
                          </div>
                        ))}
                      </div>
                    )}
                    {feature.features && (
                      <div className="grid grid-cols-2 gap-2">
                        {feature.features.map((item, idx) => (
                          <div key={idx} className="text-xs bg-muted px-2 py-1 rounded text-center">
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                    {feature.commands && (
                      <div className="grid grid-cols-2 gap-2">
                        {feature.commands.map((cmd, idx) => (
                          <div key={idx} className="text-xs bg-muted px-2 py-1 rounded text-center">
                            {cmd}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Conversation Examples */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Real Conversation Examples</h2>
          <div className="space-y-8 max-w-4xl mx-auto">
            {conversationExamples.map((conv, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="space-y-4">
                  {/* Farmer Question */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg">👨‍🌾</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <p className="font-medium text-primary">"{conv.farmer}"</p>
                        <p className="text-xs text-muted-foreground mt-1">{conv.translation}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-accent/10 p-3 rounded-lg">
                        <p className="font-medium text-accent">{conv.ai}</p>
                        <p className="text-xs text-muted-foreground mt-1">{conv.aiTranslation}</p>
                        <div className="mt-2 text-xs bg-secondary/20 px-2 py-1 rounded text-secondary">
                          Solution: {conv.solution}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Voice Demo */}
      <section id="voice-demo" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Try Voice Assistant Live</h2>
          <div className="max-w-4xl mx-auto">
            <VoiceRecognition />
          </div>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Supported Languages</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {supportedLanguages.map((lang, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-3xl mb-3">{lang.flag}</div>
                <h3 className="font-bold mb-2">{lang.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{lang.speakers}</p>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${lang.status === 'Full Support' ? 'bg-primary/20 text-primary' :
                  lang.status === 'Beta' ? 'bg-accent/20 text-accent' :
                    'bg-muted text-muted-foreground'
                  }`}>
                  {lang.status}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How Voice Assistant Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Speak Question", desc: "Ask in Hindi or local language", icon: Mic },
              { step: "2", title: "AI Processing", desc: "Voice recognition & understanding", icon: MessageCircle },
              { step: "3", title: "Generate Response", desc: "AI creates personalized answer", icon: Languages },
              { step: "4", title: "Audio Reply", desc: "Hear response in your language", icon: Volume2 }
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

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">Voice Assistant Benefits</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { title: "Easy to Use", desc: "No typing required, just speak", icon: "👄" },
              { title: "Rural Friendly", desc: "Works for illiterate farmers", icon: "🏘️" },
              { title: "Instant Help", desc: "Get answers in seconds", icon: "⚡" },
              { title: "Local Language", desc: "Understand & respond in Hindi", icon: "🇮🇳" }
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

export default VoiceAssistant;