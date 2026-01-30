import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { chatWithAI, translateToHindi } from '@/lib/openai';
import { mockChatWithAI } from '@/lib/mockAI';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  hindi?: string;
}

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'नमस्ते! मैं AgriSphere AI हूं। मैं आपकी खेती में कैसे मदद कर सकता हूं?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHindi, setShowHindi] = useState(true);

  // Speech handling state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'hi-IN'; // Hindi text listening

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);

        // Stop recognition to prevent continuous listening
        if (recognition.current) {
          recognition.current.stop();
        }
      };

      recognition.current.onerror = () => {
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    // Cleanup speech synthesis on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setIsPaused(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Stop logic if we are speaking
    handleStopSpeech();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Try OpenAI/Groq first, fallback to mock if it fails
      let aiResponse: string;
      let hindiTranslation = '';

      try {
        aiResponse = await chatWithAI(inputText, 'general');
        // Ensure no repetition in translation either
        hindiTranslation = showHindi ? await translateToHindi(aiResponse) : '';
      } catch (openaiError) {
        console.log('OpenAI failed, using mock AI:', openaiError);
        aiResponse = await mockChatWithAI(inputText);
        hindiTranslation = aiResponse; // Mock already includes Hindi
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        hindi: hindiTranslation || aiResponse, // Ensure hindi is populated if translation skipped or failed
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        hindi: 'माफ करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया पुनः प्रयास करें।',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (recognition.current && !isListening) {
      handleStopSpeech(); // Stop AI speaking when user starts speaking

      setIsListening(true);
      try {
        recognition.current.start();
      } catch (error) {
        console.error('Speech recognition start error:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      try {
        recognition.current.stop();
      } catch (error) {
        console.error('Speech recognition stop error:', error);
      }
      setIsListening(false);
    }
  };

  const handleSpeak = (text: string, messageId: string) => {
    if ('speechSynthesis' in window) {
      // If already speaking this message, pause/resume logic
      if (speakingMessageId === messageId) {
        if (isPaused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else {
          window.speechSynthesis.pause();
          setIsPaused(true);
        }
        return;
      }

      // New speech
      window.speechSynthesis.cancel();
      setIsPaused(false);
      setSpeakingMessageId(messageId);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN'; // Default to Hindi accent/voice
      utterance.rate = 1.0;

      utterance.onend = () => {
        setSpeakingMessageId(null);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setSpeakingMessageId(null);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-full bg-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] z-50"
          >
            <Card className="h-full flex flex-col bg-background/95 backdrop-blur-xl border-2 border-primary/30">
              {/* Header */}
              <div className="p-4 border-b border-border/50 bg-gradient-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h3 className="font-bold">AgriSphere AI</h3>
                      <p className="text-xs text-muted-foreground">कृषि सहायक</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowHindi(!showHindi)}
                      className="text-xs"
                    >
                      {showHindi ? 'EN' : 'हिं'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${message.isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                        }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {showHindi && message.hindi ? message.hindi : message.text}
                      </p>
                      {!message.isUser && (message.hindi || message.text) && (
                        <div className="flex gap-2 mt-2 border-t border-gray-200/20 pt-2 items-center">
                          {/* Play/Pause Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSpeak(message.hindi || message.text, message.id)}
                            className={`h-6 w-6 p-0 hover:bg-black/10 rounded-full ${speakingMessageId === message.id ? 'text-primary' : ''}`}
                            title={speakingMessageId === message.id && !isPaused ? "Pause" : "Listen in Hindi"}
                          >
                            {speakingMessageId === message.id && !isPaused ? (
                              <span className="text-xs font-bold">⏸️</span>
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>

                          {/* Stop Button (only visible when speaking this message) */}
                          {speakingMessageId === message.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleStopSpeech}
                              className="h-6 w-6 p-0 hover:bg-red-100 text-red-500 rounded-full"
                              title="Stop Speaking"
                            >
                              <span className="text-xs font-bold">⏹️</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={showHindi ? "अपना सवाल पूछें..." : "Ask your question..."}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isListening ? stopListening : startListening}
                    className={`transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse' : ''
                      }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {showHindi ? "हिंदी में बोलें या टाइप करें" : "Speak or type in Hindi/English"}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat;