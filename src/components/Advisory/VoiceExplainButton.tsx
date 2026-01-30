import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, StopCircle } from "lucide-react";
import { simplifyTextForFarmer, speakText, stopSpeech } from "../../services/voiceService";
import { toast } from "sonner";

interface VoiceExplainButtonProps {
    textToExplain: string;
    context?: string; // e.g., "Scheme Details"
    language?: "Hindi" | "English";
}

export const VoiceExplainButton: React.FC<VoiceExplainButtonProps> = ({ textToExplain, context, language = "Hindi" }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Stop speech when component unmounts (navigating away)
    useEffect(() => {
        return () => {
            stopSpeech();
        };
    }, []);

    const handleExplain = async () => {
        if (isSpeaking) {
            stopSpeech();
            setIsSpeaking(false);
            return;
        }

        try {
            setIsLoading(true);
            toast.info(`AI is simplifying the explanation in ${language}...`);

            const simplifiedText = await simplifyTextForFarmer(textToExplain, language);

            setIsLoading(false);
            setIsSpeaking(true);
            toast.success(`Playing explanation in ${language}`);

            speakText(simplifiedText, language === "Hindi" ? "hi-IN" : "en-IN");

            // Reset state when speech ends (approximate or via event listener if we moved logic here)
            // Note: Since we can't easily attach onend to the exact utterance created in service without refactoring,
            // we'll rely on user manually stopping or just letting it finish.
            // For better UX, we could auto-reset after estimated time, but manual stop is fine.
            const utterance = new SpeechSynthesisUtterance(simplifiedText);
            utterance.onend = () => setIsSpeaking(false);

        } catch (error) {
            console.error("Voice Explain Error", error);
            setIsLoading(false);
            setIsSpeaking(false);
            toast.error("Failed to explain details.");
        }
    };

    return (
        <Button
            variant={isSpeaking ? "destructive" : "outline"}
            size="sm"
            onClick={handleExplain}
            disabled={isLoading}
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSpeaking ? (
                <StopCircle className="h-4 w-4" />
            ) : (
                <Volume2 className="h-4 w-4" />
            )}
            {isSpeaking ? "Stop" : "Explain (Voice)"}
        </Button>
    );
};
