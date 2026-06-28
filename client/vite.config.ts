import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		chunkSizeWarningLimit: 600,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes('node_modules')) {
						return;
					}

					if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
						return 'vendor-react';
					}

					if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
						return 'vendor-router';
					}

					if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
						return 'vendor-firebase';
					}

					if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
						return 'vendor-socket';
					}

					return 'vendor';
				},
			},
		},
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:5000',
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
