import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/emails': 'http://localhost:5000',
      '/spam_emails': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/authenticate': 'http://localhost:5000',
      '/mark_spam': 'http://localhost:5000',
      '/mark_not_spam': 'http://localhost:5000',
      '/mark_read': 'http://localhost:5000',
      '/delete_email': 'http://localhost:5000',
      '/analyze_text': 'http://localhost:5000',
      '/send_email': 'http://localhost:5000',
      '/retrain': 'http://localhost:5000',
      '/add_to_dataset': 'http://localhost:5000',
      '/api/login': 'http://localhost:5000',
      '/api/logout': 'http://localhost:5000',
      '/api/register': 'http://localhost:5000',
      '/api/check-auth': 'http://localhost:5000'
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore eval warnings from lottie-web
        if (warning.code === 'EVAL' && warning.id?.includes('lottie-web')) {
          return
        }
        warn(warning)
      }
    },
    // Increase the chunk size warning limit to avoid unnecessary warnings
    chunkSizeWarningLimit: 1000
  }
})
