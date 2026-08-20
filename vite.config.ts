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

const smsNetBdProxyPlugin = (): Plugin => ({
  name: 'sms-net-bd-proxy-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/sms-net-bd')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const pathname = urlObj.pathname;

          // 1. Send SMS
          if (pathname.includes('/sendsms')) {
            let bodyData = '';
            if (req.method === 'POST') {
              bodyData = await new Promise((resolve) => {
                let body = '';
                req.on('data', (chunk) => { body += chunk; });
                req.on('end', () => resolve(body));
              });
            }

            const fetchUrl = req.method === 'GET' 
              ? `https://api.sms.net.bd/sendsms${urlObj.search}`
              : 'https://api.sms.net.bd/sendsms';

            const response = await fetch(fetchUrl, {
              method: req.method || 'POST',
              headers: {
                'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
              },
              body: req.method === 'POST' ? bodyData : undefined,
            });

            const dataText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(dataText);
            return;
          }

          // 2. Balance Check
          if (pathname.includes('/balance')) {
            const apiKey = urlObj.searchParams.get('api_key') || 'a23Hnfiv06596m0p8r06RU8Tcs6eI49JQDL9T3Ug';
            const response = await fetch(`https://api.sms.net.bd/user/balance/?api_key=${encodeURIComponent(apiKey)}`, {
              headers: { 'Accept': 'application/json' },
            });
            const dataText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(dataText);
            return;
          }

          // 3. Report Check
          if (pathname.includes('/report')) {
            const id = urlObj.searchParams.get('id') || '';
            const apiKey = urlObj.searchParams.get('api_key') || 'a23Hnfiv06596m0p8r06RU8Tcs6eI49JQDL9T3Ug';
            const response = await fetch(`https://api.sms.net.bd/report/request/${encodeURIComponent(id)}/?api_key=${encodeURIComponent(apiKey)}`, {
              headers: { 'Accept': 'application/json' },
            });
            const dataText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(dataText);
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 404, msg: 'Endpoint not found' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 500, msg: err?.message || 'Internal proxy error' }));
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
    plugins: [react(), tailwindcss(), tipsoiProxyPlugin(), smsNetBdProxyPlugin()],
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
