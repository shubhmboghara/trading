import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { StrategySettings } from '../types';

interface GlobalChatbotProps {
  currentSettings: StrategySettings;
}

export const GlobalChatbot: React.FC<GlobalChatbotProps> = ({ currentSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your Smart Money Trading Assistant. I can help you understand the strategy parameters, explain how to choose the right settings depending on the market conditions, or guide you if you're a beginner. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
      
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a helpful teaching assistant for a "Smart Money Delivery Spike" Swing Trading application.
Your goal is to help beginners understand the options and parameters.
Be concise, friendly, and explain trading jargon in simple terms.
Never invent parameters that don't exist in the app.

Current User Settings Context:
${JSON.stringify(currentSettings, null, 2)}

User asks: "${userMessage}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error answering your question. Make sure your API key is configured.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-transform hover:scale-105 z-50 ${isOpen ? 'hidden' : 'block'}`}
        title="Ask Trading Assistant"
      >
        <Bot size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-[#0D0D0D] border border-[#333] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[#333]">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-blue-500" />
              <h2 className="font-bold uppercase tracking-wider text-sm">Trading Assistant</h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-white/40 uppercase mb-1 px-1">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <div className={`p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-[#222] text-[#E4E4E4] rounded-tl-none border border-[#333]'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-white/40 uppercase mb-1 px-1">Assistant</span>
                <div className="p-3 rounded-lg bg-[#222] text-[#E4E4E4] rounded-tl-none border border-[#333]">
                  <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-[#111] border-t border-[#333] flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about settings, strategies..."
              className="flex-1 bg-transparent text-sm px-3 py-2 outline-none text-white placeholder:text-white/30"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-500 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
