import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI travel assistant powered by Norimono. How can I help you with your ride or travel plans today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: data.error || data.message || "Sorry, I couldn't reach the AI brain right now. Make sure you are logged in and Ollama is running." 
          }
        ]);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: "Network error: Could not connect to the backend server." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-black text-yellow-400 rounded-full shadow-[0_12px_28px_rgba(0,0,0,0.35)] flex items-center justify-center hover:bg-zinc-900 transition-all transform hover:scale-110 z-[500] cursor-pointer border-2 border-yellow-400/80 active:scale-95 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="Open Norimono AI Copilot"
      >
        <Bot className="w-7 h-7 text-yellow-400 drop-shadow-sm" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center shadow-sm">
          <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></span>
        </span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[520px] bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] border border-black/10 flex flex-col z-[500] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 overflow-hidden">
          {/* Top Yellow Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500" />

          {/* Header */}
          <div className="bg-black text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  Norimono AI Copilot
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">Llama 3</span>
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">Smart route & commute assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/80">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-black text-white font-medium rounded-2xl rounded-br-xs border border-zinc-800' 
                    : 'bg-white border border-zinc-200/90 text-zinc-800 rounded-2xl rounded-bl-xs font-normal'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-200/90 rounded-2xl rounded-bl-xs px-4 py-2.5 text-sm text-zinc-500 flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                  <span className="font-medium text-xs text-zinc-600">Analyzing routes & traffic...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-zinc-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about rides, stops, or tech parks..."
                disabled={loading}
                className="w-full pl-3.5 pr-12 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-yellow-400 text-black font-bold rounded-lg shadow-[0_2px_0_#CA8A04] hover:bg-yellow-300 disabled:opacity-40 disabled:shadow-none disabled:bg-zinc-200 disabled:text-zinc-400 transition-all cursor-pointer active:translate-y-0.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default AIAssistant;
