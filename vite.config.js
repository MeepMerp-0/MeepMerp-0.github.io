import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fills the Aki CSP placeholders in index.html; both are emptied when VITE_AKI_API_URL is unset.
function akiCsp(apiUrl) {
  const connect = apiUrl ? new URL(apiUrl).origin : '';
  // ponytail: plain http(s) host[:port] only, IPv6 literals are rejected
  if (connect && !/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(connect)) {
    throw new Error(`VITE_AKI_API_URL has an unusable origin: ${connect}`);
  }
  const turnstile = connect ? 'https://challenges.cloudflare.com' : '';
  return {
    name: 'aki-csp',
    transformIndexHtml: (html) =>
      html.replaceAll('__AKI_CONNECT__', connect).replaceAll('__AKI_TURNSTILE__', turnstile),
  };
}

export default defineConfig(({ mode }) => {
  const { VITE_AKI_API_URL } = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), akiCsp(VITE_AKI_API_URL)],
    server: {
      port: 8888,
      strictPort: true,
      host: '0.0.0.0',
      // The 'smtp' contact backend posts to /api/contact unless VITE_FORM_API_URL is set; in dev, a local API on 3001.
      proxy: {
        '/api/contact': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
