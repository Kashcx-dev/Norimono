import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		allowedHosts: true,
		proxy: {
			"/auth": "http://localhost:3000",
			"/chat": "http://localhost:3000",
			"/profile": "http://localhost:3000",
			"/feedback": "http://localhost:3000",
			"/uploads": "http://localhost:3000",
			"/socket.io": {
				target: "http://localhost:3000",
				ws: true,
			},
		},
	},
});
