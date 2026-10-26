import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { DiagnosisResult } from '../types/diy';

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface ContractorChatbotProps {
  diagnosis: DiagnosisResult | null;
}

export const ContractorChatbot: React.FC<ContractorChatbotProps> = ({ diagnosis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'model',
      text: "Hey there! I'm your on-call Master Contractor. Ask me anything about tool handling, alternative materials, safety shutoffs, or drying times for your job.",
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/contractor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          jobContext: diagnosis
            ? {
                title: diagnosis.title,
                category: diagnosis.category,
                skillLevel: diagnosis.skillLevel,
                items: diagnosis.items.map((i) => i.name),
              }
            : null,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const modelMsg: ChatMessage = {
          id: `mod_${Date.now()}`,
          sender: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, modelMsg]);
      }
    } catch (err) {
      console.error('Error communicating with contractor AI:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `mod_err_${Date.now()}`,
          sender: 'model',
          text: "I'm having a connection hiccup with the job trailer, but as a rule of thumb: always double-check your shutoff valves and wear safety goggles!",
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    'Can I substitute standard spackle?',
    'What drill bit size do I use?',
    'How do I test if power is dead?',
    'Is a slip coupling permanent?',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
      {/* Positioned cleanly at the bottom of the page - never overlays the map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Collapsible Bar Header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="px-5 py-3.5 bg-slate-950 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Contractor AI On-Site Advisor
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isOpen ? 'Ask questions about tools, substitutions, or safety codes' : 'Click to expand instant DIY troubleshooting & advice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="hidden sm:inline text-slate-400">
              {isOpen ? 'Collapse Panel' : 'Ask Question'}
            </span>
            <div className="p-1 rounded bg-slate-800 text-slate-300">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Expandable Chat Body */}
        {isOpen && (
          <div className="border-t border-slate-800">
            {/* Messages Thread */}
            <div className="p-4 sm:p-5 max-h-[360px] overflow-y-auto space-y-3 text-xs bg-[#0b0f19]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-amber-400 text-slate-950 font-medium rounded-tr-sm'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        msg.sender === 'user' ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 items-center text-slate-400 text-xs py-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Contractor is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
              <span className="text-slate-400 font-semibold shrink-0">Common queries:</span>
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask contractor a question about your project..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
