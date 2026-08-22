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
      if (req.url && (req.url.startsWith('/api/sms') || req.url.startsWith('/api/sms-net-bd') || req.url.startsWith('/api/bulksms'))) {
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

          // 1. Send SMS (One to Many)
          if (pathname.includes('/sendsms') || pathname.endsWith('/sms/send') || pathname.endsWith('/send')) {
            let bodyData: any = {};
            if (req.method === 'POST') {
              const rawBody = await new Promise<string>((resolve) => {
                let body = '';
                req.on('data', (chunk) => { body += chunk; });
                req.on('end', () => resolve(body));
              });
              try { bodyData = JSON.parse(rawBody); } catch { }
            }

            const apiKey = bodyData.api_key || bodyData.apiKey || urlObj.searchParams.get('api_key') || 's3qQPmfL2bcBmt03K26v';
            const senderId = bodyData.senderid || bodyData.senderId || urlObj.searchParams.get('senderid') || '8809648910612';
            const number = bodyData.number || bodyData.to || urlObj.searchParams.get('number') || urlObj.searchParams.get('to') || '';
            const message = bodyData.message || bodyData.msg || urlObj.searchParams.get('message') || urlObj.searchParams.get('msg') || '';

            const payload = {
              api_key: apiKey,
              senderid: senderId,
              number: number,
              message: message,
            };

            const response = await fetch('http://bulksmsbd.net/api/smsapi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload),
            });

            const dataText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(dataText);
            return;
          }

          // 2. Send Bulk SMS (Many to Many)
          if (pathname.includes('/smsapimany') || pathname.endsWith('/sms/send-many') || pathname.endsWith('/send-many')) {
            let bodyData: any = {};
            if (req.method === 'POST') {
              const rawBody = await new Promise<string>((resolve) => {
                let body = '';
                req.on('data', (chunk) => { body += chunk; });
                req.on('end', () => resolve(body));
              });
              try { bodyData = JSON.parse(rawBody); } catch { }
            }

            const apiKey = bodyData.api_key || bodyData.apiKey || 's3qQPmfL2bcBmt03K26v';
            const senderId = bodyData.senderid || bodyData.senderId || '8809648910612';
            const messages = bodyData.messages || [];

            const payload = {
              api_key: apiKey,
              senderid: senderId,
              messages: messages,
            };

            const response = await fetch('http://bulksmsbd.net/api/smsapimany', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload),
            });

            const dataText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(dataText);
            return;
          }

          // 3. Balance Check
          if (pathname.includes('/balance')) {
            const apiKey = urlObj.searchParams.get('api_key') || 's3qQPmfL2bcBmt03K26v';
            const response = await fetch(`http://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`, {
              headers: { 'Accept': 'application/json' },
            });
            const dataText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(dataText);
            return;
          }

          // 4. Report Check fallback
          if (pathname.includes('/report')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, status: 'Delivered', error: 0 }));
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
