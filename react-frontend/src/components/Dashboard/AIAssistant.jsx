import React, { useState } from "react";
import { Bot, X, Send } from "lucide-react";

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI assistant. Need help finding a ride or navigating the dashboard?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm a UI placeholder for now. Once connected to a backend, I'll be able to help you match rides efficiently!" }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#714B67] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#5c3c54] transition-all transform hover:scale-105 z-40 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Bot className="w-7 h-7" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#714B67] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-[#00A09D] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 w-8 h-8 flex items-center justify-center bg-[#714B67] text-white rounded-lg disabled:opacity-50 disabled:bg-gray-400 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default AIAssistant;
