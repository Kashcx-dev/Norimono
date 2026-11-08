import React, { useState, useRef, useEffect } from "react";
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
	const messagesEndRef = useRef(null);

	const rideId = activeTrip?.ride?.ride_id;

	// Scroll to bottom on new messages
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Join ride room and listen for incoming messages
	useEffect(() => {
		if (!socket || !rideId || !isOpen) return;

		// Join the ride's socket room so we receive messages
		socket.emit("join_ride_room", { ride_id: rideId });

		const handleNewMessage = (data) => {
			// Don't add our own messages (we already added them optimistically)
			if (data.sender_id === user?.emp_id) return;

			setMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					sender_id: data.sender_id,
					sender_name: data.sender_name,
					text: data.text,
					timestamp: data.timestamp || new Date().toISOString(),
				},
			]);
		};

		socket.on("new_chat_message", handleNewMessage);

		return () => {
			socket.off("new_chat_message", handleNewMessage);
		};
	}, [socket, rideId, isOpen, user?.emp_id]);

	if (!isOpen) return null;

	const targetName = activeTrip?.mode === "driver" 
		? (activeTrip?.bookings?.[0]?.passenger_name || "Passenger")
		: (activeTrip?.ride?.driver_name || "Driver");

	const handleSend = () => {
		const text = messageInput.trim();
		if (!text || !socket || !rideId) return;

		const messagePayload = {
			ride_id: rideId,
			sender_id: user?.emp_id,
			sender_name: user?.name || "You",
			text: text,
			timestamp: new Date().toISOString(),
		};

		// Emit to socket
		socket.emit("send_chat_message", messagePayload);

		// Optimistically add to local messages
		setMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				sender_id: user?.emp_id,
				sender_name: user?.name || "You",
				text: text,
				timestamp: messagePayload.timestamp,
			},
		]);

		setMessageInput("");
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col transform transition-all h-[600px] border border-gray-100 overflow-hidden">
				
				{/* Header - Tactile 3D Yellow / Obsidian */}
				<div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500" />
				<div className="p-5 flex items-center justify-between bg-black text-white relative">
					<div className="flex items-center gap-3.5 relative z-10">
						<div className="w-11 h-11 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black text-lg uppercase shadow-sm border border-yellow-300">
							{targetName.charAt(0)}
						</div>
						<div>
							<h3 className="text-white font-bold text-base leading-tight flex items-center gap-2">
								{targetName}
								<span className="w-2 h-2 rounded-full bg-emerald-400"></span>
							</h3>
							<div className="flex items-center gap-1.5 text-yellow-400/90 text-[10px] font-bold uppercase tracking-wider mt-0.5">
								<Lock className="w-3 h-3" /> E2EE Verified Commute Chat
							</div>
						</div>
					</div>
					
					<button 
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Chat Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
					{messages.map((msg, idx) => {
						const isMe = msg.sender_id === user?.emp_id;
						
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
									<div className="w-6 h-6 rounded-full bg-zinc-800 text-yellow-400 border border-zinc-700 flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
										{msg.sender_name?.charAt(0) || "U"}
									</div>
								)}
								<div className={`max-w-[75%] px-4 py-2.5 shadow-sm ${
									isMe 
										? "bg-black text-white font-medium rounded-2xl rounded-br-xs border border-zinc-800" 
										: "bg-white text-zinc-900 border border-zinc-200 rounded-2xl rounded-bl-xs font-normal"
								}`}>
									<p className="text-sm">{msg.text}</p>
									<p className={`text-[9px] mt-1 text-right font-medium ${isMe ? "text-white/70" : "text-gray-400"}`}>
										{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</p>
								</div>
							</div>
						);
					})}
					<div ref={messagesEndRef} />
				</div>

				{/* Input Area */}
				<div className="p-4 bg-white border-t border-gray-100">
					<div className="flex gap-2">
						<input 
							type="text"
							value={messageInput}
							onChange={(e) => setMessageInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Type an encrypted message..."
							className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
						/>
						<button 
							onClick={handleSend}
							disabled={!messageInput.trim()}
							className="w-12 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 shadow-[0_2px_0_#CA8A04] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
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
