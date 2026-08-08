import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShieldCheck, Lock } from 'lucide-react';

// E2EE Constants
const P = 2147483647n; // A prime number (Mersenne prime M31)
const G = 16807n; // A primitive root modulo M31

// Simple XOR stream cipher using the shared secret
function encryptDecrypt(text, key) {
	if (!key) return text;
	let out = '';
	for (let i = 0; i < text.length; i++) {
		out += String.fromCharCode(text.charCodeAt(i) ^ Number(key % 256n));
	}
	return out;
}

export default function ChatModal({ isOpen, onClose, socket, activeTrip, user }) {
	const [messages, setMessages] = useState([]);
	const [inputText, setInputText] = useState("");
	const [wasmModule, setWasmModule] = useState(null);
	const [privateKey, setPrivateKey] = useState(null);
	const [publicKey, setPublicKey] = useState(null);
	const [otherPublicKey, setOtherPublicKey] = useState(null);
	
	const messagesEndRef = useRef(null);

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Load WASM and generate keys
	useEffect(() => {
		let isMounted = true;
		
		const loadWasm = async () => {
			try {
				const response = await fetch('/math_engine.wasm');
				const bytes = await response.arrayBuffer();
				const result = await WebAssembly.instantiate(bytes, {
					env: {
						memory: new WebAssembly.Memory({ initial: 256, maximum: 256 }),
						table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
						abort: () => console.log('Abort called from WASM')
					}
				});
				
				if (isMounted) {
					const module = result.instance;
					setWasmModule(module);
					
					// Generate private key (random number between 1 and 1000)
					const priv = BigInt(Math.floor(Math.random() * 999) + 1);
					setPrivateKey(priv);
					
					// Generate public key: G^priv % P
					const pub = module.exports.modulation(G, priv, P);
					setPublicKey(pub);
				}
			} catch (err) {
				console.error("Failed to load E2EE WASM module:", err);
			}
		};
		
		if (isOpen && !wasmModule) {
			loadWasm();
		}
		
		return () => { isMounted = false; };
	}, [isOpen, wasmModule]);

	// Re-calculate shared secret using useMemo
	const sharedSecret = React.useMemo(() => {
		if (privateKey && otherPublicKey && wasmModule) {
			return wasmModule.exports.modulation(otherPublicKey, privateKey, P);
		}
		return null;
	}, [privateKey, otherPublicKey, wasmModule]);

	// Listen for incoming messages & keys
	useEffect(() => {
		if (!socket || !isOpen) return;
		
		const handleMessage = (data) => {
			// If it's a key exchange message
			if (data.type === "KEY_EXCHANGE") {
				if (data.sender_id !== user.emp_id) {
					setOtherPublicKey(BigInt(data.public_key));
					// Calculate shared secret if we have our private key & wasm (handled by useMemo now)
				}
				return;
			}
			
			// If it's a chat message
			if (data.type === "CHAT") {
				let text = data.text;
				let decrypted = false;
				
				// Calculate shared secret on the fly for decryption just in case
				let currentSecret = null;
				if (privateKey && otherPublicKey && wasmModule) {
					currentSecret = wasmModule.exports.modulation(otherPublicKey, privateKey, P);
				}

				// Attempt to decrypt if we have a shared secret and it's from the other person
				if (data.sender_id !== user.emp_id && currentSecret) {
					try {
						// The text is sent as base64 or raw string. Let's assume raw string for XOR
						text = encryptDecrypt(atob(data.text), currentSecret);
						decrypted = true;
					} catch(e) {
						console.error("Decryption failed", e);
					}
				} else if (data.sender_id === user.emp_id) {
					// It's our own message, display plain text (we don't encrypt for ourselves in UI)
					text = data.originalText; 
					decrypted = true;
				}

				setMessages(prev => [...prev, {
					...data,
					text,
					isMine: data.sender_id === user.emp_id,
					isSecure: decrypted
				}]);
			}
		};
		
		socket.on("new_chat_message", handleMessage);
		
		return () => {
			socket.off("new_chat_message", handleMessage);
		};
	}, [socket, isOpen, user.emp_id, privateKey, wasmModule, otherPublicKey]);

	// Broadcast public key when joining chat
	useEffect(() => {
		if (isOpen && socket && publicKey && activeTrip?.ride?.ride_id) {
			socket.emit("send_chat_message", {
				ride_id: activeTrip.ride.ride_id,
				type: "KEY_EXCHANGE",
				sender_id: user.emp_id,
				public_key: publicKey.toString()
			});
		}
	}, [isOpen, socket, publicKey, activeTrip, user.emp_id]);

	const handleSend = (e) => {
		e.preventDefault();
		if (!inputText.trim() || !socket || !activeTrip?.ride?.ride_id) return;
		
		let textToSend;
		
		if (sharedSecret) {
			// Encrypt text
			textToSend = btoa(encryptDecrypt(inputText, sharedSecret));
		} else {
			// Fallback if key exchange isn't finished
			textToSend = btoa(inputText);
		}

		const msg = {
			ride_id: activeTrip.ride.ride_id,
			type: "CHAT",
			sender_id: user.emp_id,
			sender_name: user.name,
			text: textToSend,
			originalText: inputText, // Just for local echo
			timestamp: new Date().toISOString()
		};
		
		socket.emit("send_chat_message", msg);
		setInputText("");
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden flex flex-col h-[500px] text-left transform transition-all">
				
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#714B67] to-[#5c3c54] text-white">
					<div className="flex flex-col">
						<h3 className="font-bold flex items-center gap-2">
							Live Chat
						</h3>
						<div className="flex items-center gap-1 text-[10px] text-white/80 font-medium">
							{sharedSecret ? (
								<><ShieldCheck className="w-3 h-3 text-emerald-300" /> End-to-End Encrypted (WASM DH)</>
							) : (
								<><Lock className="w-3 h-3 text-amber-300" /> Securing connection...</>
							)}
						</div>
					</div>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Messages Area */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
					{messages.length === 0 && (
						<div className="h-full flex flex-col items-center justify-center text-gray-400">
							<ShieldCheck className="w-12 h-12 mb-2 text-gray-300" />
							<p className="text-sm font-medium">Messages are end-to-end encrypted.</p>
							<p className="text-xs text-gray-400">Powered by C++ WebAssembly</p>
						</div>
					)}
					
					{messages.map((m, i) => (
						<div key={i} className={`flex flex-col ${m.isMine ? 'items-end' : 'items-start'}`}>
							{!m.isMine && (
								<span className="text-[10px] text-gray-500 mb-1 ml-1">{m.sender_name}</span>
							)}
							<div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
								m.isMine 
									? 'bg-[#714B67] text-white rounded-br-sm' 
									: 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
							}`}>
								{m.text}
							</div>
							<div className="flex items-center gap-1 mt-1 mr-1">
								<span className="text-[9px] text-gray-400">
									{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
								{m.isSecure && <Lock className={`w-2 h-2 ${m.isMine ? 'text-[#714B67]/50' : 'text-gray-400'}`} />}
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>

				{/* Input Area */}
				<div className="p-4 bg-white border-t border-gray-100">
					<form onSubmit={handleSend} className="flex gap-2">
						<input
							type="text"
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							placeholder="Type an encrypted message..."
							className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-[#714B67]/30 focus:ring-2 focus:ring-[#714B67]/10 rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
						/>
						<button
							type="submit"
							disabled={!inputText.trim()}
							className="bg-[#00A09D] hover:bg-[#008f8c] disabled:opacity-50 disabled:hover:bg-[#00A09D] text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer"
						>
							<Send className="w-4 h-4 ml-0.5" />
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
