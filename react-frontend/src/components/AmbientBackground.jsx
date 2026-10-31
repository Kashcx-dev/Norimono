import React from "react";

export default function AmbientBackground() {
	return (
		<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
			{/* Subtle dark modern tech grid */}
			<div 
				className="absolute inset-0 opacity-[0.035]"
				style={{
					backgroundImage: `radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)`,
					backgroundSize: "28px 28px"
				}}
			/>

			{/* Minimalist floating ambient glow orbs */}
			<div 
				className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[120px] opacity-[0.07] bg-gradient-to-br from-cyan-400 via-teal-500 to-indigo-600 animate-pulse"
				style={{ animationDuration: "12s" }}
			/>
			
			<div 
				className="absolute -bottom-[20%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.06] bg-gradient-to-tl from-emerald-400 via-sky-500 to-violet-600 animate-pulse"
				style={{ animationDuration: "16s", animationDelay: "3s" }}
			/>

			{/* Soft accent center glow */}
			<div 
				className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] rounded-full blur-[160px] opacity-[0.04] bg-teal-400"
			/>
		</div>
	);
}
