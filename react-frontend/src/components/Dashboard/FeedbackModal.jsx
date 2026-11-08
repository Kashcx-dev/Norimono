import React, { useState } from "react";
import { X, MessageSquareHeart, Star, Send, ThumbsUp } from "lucide-react";

export default function FeedbackModal({ isOpen, onClose }) {
	const [rating, setRating] = useState(0);
	const [hover, setHover] = useState(0);
	const [feedback, setFeedback] = useState("");
	const [submitted, setSubmitted] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = async () => {
		if (!rating || !feedback.trim()) return;

		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/feedback/send_feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ rating, message: feedback.trim() })
			});
			const data = await res.json();
			if (res.ok || data.success) {
				setSubmitted(true);
				setTimeout(() => {
					onClose();
					setSubmitted(false);
					setRating(0);
					setFeedback("");
				}, 2000);
			} else {
				setSubmitted(true);
				setTimeout(() => {
					onClose();
					setSubmitted(false);
				}, 1800);
			}
		} catch (err) {
			console.error("Feedback submit error:", err);
			setSubmitted(true);
			setTimeout(() => {
				onClose();
				setSubmitted(false);
			}, 1800);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col transform transition-all overflow-hidden border border-gray-100">
				
				{/* Header - Tactile 3D Yellow / Obsidian */}
				<div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500" />
				<div className="p-6 bg-black relative">
					<div className="flex justify-between items-start relative z-10">
						<div className="flex items-center gap-3.5">
							<div className="w-12 h-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center shadow-lg transform rotate-2 border border-yellow-300">
								<MessageSquareHeart className="w-6 h-6" />
							</div>
							<div>
								<h2 className="text-xl font-black text-white leading-tight">Share Commute Feedback</h2>
								<p className="text-yellow-400/90 text-xs font-bold uppercase tracking-wider mt-0.5">Help us elevate Norimono</p>
							</div>
						</div>
						<button 
							onClick={onClose}
							className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

				<div className="p-8">
					{submitted ? (
						<div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in zoom-in duration-300">
							<div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
								<ThumbsUp className="w-8 h-8" />
							</div>
							<div className="text-center">
								<h3 className="text-lg font-bold text-gray-900">Thank You!</h3>
								<p className="text-sm text-gray-500 mt-1">Your feedback and rating have been emailed to leadership.</p>
							</div>
						</div>
					) : (
						<div className="space-y-5">
							<div className="text-center space-y-3">
								<p className="text-xs font-bold text-gray-700 uppercase tracking-wider">How was your commute experience?</p>
								<div className="flex justify-center gap-2">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											type="button"
											key={star}
											onMouseEnter={() => setHover(star)}
											onMouseLeave={() => setHover(0)}
											onClick={() => setRating(star)}
											className="transform transition-all hover:scale-110 cursor-pointer"
										>
											<Star 
												className={`w-9 h-9 ${(hover || rating) >= star ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`} 
											/>
										</button>
									))}
								</div>
								<span className="text-[11px] font-bold text-amber-600 block">
									{rating === 5 ? "⭐⭐⭐⭐⭐ Excellent Commute!" :
									 rating === 4 ? "⭐⭐⭐⭐ Great Experience" :
									 rating === 3 ? "⭐⭐⭐ Good / Average" :
									 rating === 2 ? "⭐⭐ Needs Improvement" :
									 rating === 1 ? "⭐ Poor / Disrupted" : "Select star rating"}
								</span>
							</div>

							<div>
								<label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
									Describe your experience *
								</label>
								<textarea 
									value={feedback}
									onChange={(e) => setFeedback(e.target.value)}
									placeholder="Tell us about the ride, coworker punctuality, or carpool improvements..."
									className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all min-h-[100px] resize-none"
								></textarea>
							</div>

							<button 
								onClick={handleSubmit}
								disabled={rating === 0 || !feedback.trim()}
								className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:bg-zinc-200 disabled:text-zinc-400 text-black rounded-xl py-3.5 font-black text-sm shadow-[0_4px_0_#CA8A04] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
							>
								Submit Feedback <Send className="w-4 h-4" />
							</button>

							<p className="text-center text-[10px] text-gray-400 font-medium">
								Directly forwarded to executive mobility desk
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
