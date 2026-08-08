import React, { useState } from "react";
import { X, Star, Send, Loader2, MessageSquareHeart } from "lucide-react";

export default function FeedbackModal({ isOpen, onClose }) {
	const [rating, setRating] = useState(0);
	const [hoverRating, setHoverRating] = useState(0);
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

	if (!isOpen) return null;

	const handleSubmit = async () => {
		if (rating === 0) {
			alert("Please select a star rating!");
			return;
		}
		if (!message.trim()) {
			alert("Please tell us your thoughts in the feedback box!");
			return;
		}

		setIsSubmitting(true);
		setSubmitStatus(null);
		const token = localStorage.getItem("token");

		try {
			const res = await fetch("/feedback/send_feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ rating, message })
			});
			
			const data = await res.json();
			if (res.ok && data.message) {
				setSubmitStatus("success");
				setTimeout(() => {
					onClose();
					setRating(0);
					setMessage("");
					setSubmitStatus(null);
				}, 2000);
			} else {
				setSubmitStatus("error");
			}
		} catch (error) {
			console.error("Error sending feedback:", error);
			setSubmitStatus("error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
			<div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 flex flex-col transform transition-all relative overflow-hidden">
				
				{/* Header */}
				<div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#00A09D]/20 to-[#714B67]/20">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A09D] to-[#714B67] flex items-center justify-center text-white shadow-lg">
							<MessageSquareHeart className="w-5 h-5" />
						</div>
						<div>
							<h2 className="text-lg font-bold text-white leading-tight">Send Feedback</h2>
							<p className="text-xs text-white/60">Help us improve MakeLyft</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Star Rating */}
					<div className="flex flex-col items-center space-y-2">
						<span className="text-sm font-semibold text-white/80">How was your experience?</span>
						<div className="flex gap-2">
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									onMouseEnter={() => setHoverRating(star)}
									onMouseLeave={() => setHoverRating(0)}
									onClick={() => setRating(star)}
									className="transition-transform hover:scale-110 cursor-pointer p-1"
								>
									<Star 
										className={`w-10 h-10 transition-colors duration-200 ${
											(hoverRating || rating) >= star 
												? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
												: "fill-transparent text-white/20"
										}`} 
									/>
								</button>
							))}
						</div>
						<div className="h-4">
							<span className="text-xs font-bold text-amber-400">
								{rating === 1 && "Poor"}
								{rating === 2 && "Fair"}
								{rating === 3 && "Good"}
								{rating === 4 && "Great"}
								{rating === 5 && "Excellent!"}
							</span>
						</div>
					</div>

					{/* Feedback Message */}
					<div className="space-y-2">
						<label className="text-sm font-semibold text-white/80">Your thoughts</label>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Tell us what you loved or what we can improve..."
							className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00A09D] transition-colors resize-none h-32"
						></textarea>
					</div>
				</div>

				{/* Footer / Submit */}
				<div className="p-5 border-t border-white/10 bg-white/5">
					<button
						onClick={handleSubmit}
						disabled={isSubmitting || submitStatus === 'success'}
						className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg
							${submitStatus === 'success' ? 'bg-emerald-500 text-white' : 
							  submitStatus === 'error' ? 'bg-rose-500 text-white' :
							  'bg-gradient-to-r from-[#00A09D] to-[#714B67] text-white hover:opacity-90'}`}
					>
						{isSubmitting ? (
							<><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
						) : submitStatus === 'success' ? (
							"Feedback Sent! Thank you 💖"
						) : submitStatus === 'error' ? (
							"Failed to send. Try again?"
						) : (
							<><Send className="w-5 h-5" /> Submit Feedback</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
