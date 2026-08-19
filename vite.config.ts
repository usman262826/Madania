import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

const tipsoiProxyPlugin = (): Plugin => ({
  name: 'tipsoi-proxy-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/tipsoi-proxy')) {
        try {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const targetUrl = urlObj.searchParams.get('url');
          const token = urlObj.searchParams.get('api_token') || req.headers['api_token'] || req.headers['authorization'];

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Missing target url parameter' }));
            return;
          }

          const fetchHeaders: Record<string, string> = {
            'Accept': 'application/json, text/plain, */*',
          };

          if (token) {
            const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();
            fetchHeaders['api_token'] = cleanToken;
            fetchHeaders['api-token'] = cleanToken;
            fetchHeaders['X-API-TOKEN'] = cleanToken;
            fetchHeaders['Authorization'] = `Bearer ${cleanToken}`;
          }

          const response = await fetch(targetUrl, {
            method: req.method || 'GET',
            headers: fetchHeaders,
          });

          const contentType = response.headers.get('content-type') || 'application/json';
          res.statusCode = response.status;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api_token, Authorization');

          const bodyText = await response.text();
          res.end(bodyText);
        } catch (err: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ success: false, error: err?.message || 'Proxy fetch failed' }));
        }
        return;
      }
      next();
    });
  }
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), tipsoiProxyPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/tipsoi': {
          target: env.VITE_TIPSOI_BASE_URL || 'https://api-inovace360.com/api/v1',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/tipsoi/, ''),
          headers: {
            'Authorization': `Bearer ${env.VITE_TIPSOI_API_TOKEN || '6973-da50-6873-252b-6226-ff72-f48e-7790-4212-a803-fd39-6af0-fb95-e663-b3bf-d9f4'}`,
            'api_token': env.VITE_TIPSOI_API_TOKEN || '6973-da50-6873-252b-6226-ff72-f48e-7790-4212-a803-fd39-6af0-fb95-e663-b3bf-d9f4',
            'api-token': env.VITE_TIPSOI_API_TOKEN || '6973-da50-6873-252b-6226-ff72-f48e-7790-4212-a803-fd39-6af0-fb95-e663-b3bf-d9f4',
            'X-API-TOKEN': env.VITE_TIPSOI_API_TOKEN || '6973-da50-6873-252b-6226-ff72-f48e-7790-4212-a803-fd39-6af0-fb95-e663-b3bf-d9f4'
          }
        }
      }
    },
  };
});
