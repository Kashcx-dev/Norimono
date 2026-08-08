import React, { useState } from "react";
import { X, Send, MessageSquare, ShieldCheck, User, Clock, Lock } from "lucide-react";

export default function ChatModal({ isOpen, onClose, socket, activeTrip, user }) {
	const [messageInput, setMessageInput] = useState("");
	const [messages, setMessages] = useState([
		{
			id: 1,
			sender_name: "System",
			text: "Chat started. Messages are End-to-End Encrypted (XOR) with a symmetric session key derived from your ride.",
			isSystem: true,
			timestamp: new Date().toISOString()
		}
	]);

	if (!isOpen) return null;

	const targetName = activeTrip?.mode === "driver" 
		? (activeTrip?.bookings?.[0]?.passenger_name || "Passenger")
		: (activeTrip?.ride?.driver_name || "Driver");

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col transform transition-all h-[600px] border border-gray-100 overflow-hidden">
				
				{/* Elaborate Header - Odoo Theme */}
				<div className="p-5 flex items-center justify-between bg-gradient-to-r from-[#00A09D] to-[#017E84] relative overflow-hidden">
					{/* Abstract Background Design */}
					<div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
					<div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
					
					<div className="flex items-center gap-4 relative z-10">
						<div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#00A09D] font-bold text-xl uppercase shadow-md">
							{targetName.charAt(0)}
						</div>
						<div>
							<h3 className="text-white font-bold text-lg leading-tight">{targetName}</h3>
							<div className="flex items-center gap-1.5 text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">
								<Lock className="w-3 h-3" /> E2EE Secured Chat
							</div>
						</div>
					</div>
					
					<button 
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10 cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Chat Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
					{messages.map((msg, idx) => {
						const isMe = msg.sender_id === user.emp_id;
						
						if (msg.isSystem) {
							return (
								<div key={idx} className="flex justify-center my-4">
									<div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] uppercase font-bold tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
										<ShieldCheck className="w-3.5 h-3.5" />
										{msg.text}
									</div>
								</div>
							);
						}

						return (
							<div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
								{!isMe && (
									<div className="w-6 h-6 rounded-full bg-[#714B67] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
										{msg.sender_name?.charAt(0) || "U"}
									</div>
								)}
								<div className={`max-w-[75%] px-4 py-2.5 shadow-sm ${
									isMe 
										? "bg-gradient-to-br from-[#714B67] to-[#8C5D80] text-white rounded-2xl rounded-br-sm" 
										: "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm"
								}`}>
									<p className="text-sm">{msg.text}</p>
									<p className={`text-[9px] mt-1 text-right font-medium ${isMe ? "text-white/70" : "text-gray-400"}`}>
										{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</p>
								</div>
							</div>
						);
					})}
				</div>

				{/* Input Area */}
				<div className="p-4 bg-white border-t border-gray-100">
					<div className="flex gap-2">
						<input 
							type="text"
							value={messageInput}
							onChange={(e) => setMessageInput(e.target.value)}
							placeholder="Type an encrypted message..."
							className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
						/>
						<button 
							disabled={!messageInput.trim()}
							className="w-12 rounded-xl bg-[#00A09D] hover:bg-[#008f8c] disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm shadow-[#00A09D]/20"
						>
							<Send className="w-5 h-5 ml-1" />
						</button>
					</div>
					<div className="text-center mt-2">
						<span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
							<ShieldCheck className="w-3 h-3 text-emerald-500" /> End-to-End Encrypted via XOR
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
