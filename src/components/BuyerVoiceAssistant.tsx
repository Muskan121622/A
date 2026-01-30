import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, StopCircle, Pause, Play, Globe } from "lucide-react";
import { simplifyTextForFarmer, stopSpeech } from "@/services/voiceService";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BuyerVoiceAssistantProps {
    insight: any; // Using any for flexibility with the complex insight object
    crop: string;
    state: string;
}

export const BuyerVoiceAssistant: React.FC<BuyerVoiceAssistantProps> = ({ insight, crop, state }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [language, setLanguage] = useState<"Hindi" | "English">("English");
    const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    // Stop speech on unmount
    useEffect(() => {
        return () => {
            stopSpeech();
        };
    }, []);

    const constructScript = () => {
        if (!insight) return "";
        let script = `Market analysis for ${crop} in ${state}. `;
        script += `Price forecast is ${insight.price_forecast}. `;
        script += `${insight.analysis_brief} `;
        script += `Key insights: `;
        insight.insights.forEach((item: any) => {
            script += `${item.text} `;
        });
        return script;
    };

    const handlePlay = async () => {
        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsSpeaking(true);
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            setIsSpeaking(false); // UI state update
            return;
        }

        try {
            setIsLoading(true);
            const rawScript = constructScript();

            let finalScript = rawScript;
            if (language === "Hindi") {
                toast({ description: "Translating to Hindi..." });
                // Use the existing service which essentially prompts AI to explain/translate
                finalScript = await simplifyTextForFarmer(rawScript, "Hindi");
            }

            setIsLoading(false);
            setIsSpeaking(true);

            // Speak
            stopSpeech(); // Clear any previous
            const utterance = new SpeechSynthesisUtterance(finalScript);
            utterance.lang = language === "Hindi" ? "hi-IN" : "en-IN";
            utterance.rate = 0.9;

            utterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
                setCurrentUtterance(null);
            };

            setCurrentUtterance(utterance);
            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error("Voice Error", error);
            setIsLoading(false);
            setIsSpeaking(false);
            toast({ variant: "destructive", title: "Voice Error", description: "Could not generate speech." });
        }
    };

    const handleStop = () => {
        stopSpeech();
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentUtterance(null);
    };

    return (
        <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800 w-full sm:w-auto">
            <Select value={language} onValueChange={(v: "Hindi" | "English") => {
                handleStop();
                setLanguage(v);
            }}>
                <SelectTrigger className="w-[100px] h-8 bg-black/40 border-slate-700 text-xs">
                    <Globe className="w-3 h-3 mr-2 hidden sm:inline" />
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                </SelectContent>
            </Select>

            <Button
                variant={isSpeaking ? "secondary" : "default"} // Orange normally, White when playing
                size="sm"
                onClick={handlePlay}
                disabled={isLoading}
                className={`h-8 gap-2 ${isSpeaking ? "bg-white text-black hover:bg-slate-200" : "bg-orange-600 hover:bg-orange-700 text-white"}`}
            >
                {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : isPaused ? (
                    <Play className="h-3 w-3" /> // Resume icon
                ) : isSpeaking ? (
                    <Pause className="h-3 w-3" /> // Pause icon
                ) : (
                    <Volume2 className="h-3 w-3" />
                )}
                {isLoading ? "Loading..." : isPaused ? "Resume" : isSpeaking ? "Pause" : "Listen"}
            </Button>

            {(isSpeaking || isPaused) && (
                <Button variant="ghost" size="icon" onClick={handleStop} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                    <StopCircle className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};
