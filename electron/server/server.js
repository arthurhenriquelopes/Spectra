const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const dotenv = require('dotenv');
const { InterviewSession } = require('./session');
const { verifyDeepgramKey } = require('./stt');
const { LLMService } = require('./llm');

dotenv.config();

function createServer(options = {}) {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    const rootDir = path.resolve(__dirname, '../../');
    const webDir = path.join(rootDir, 'web');

    // Storage path: Use %APPDATA%/Spectra for persistent, writable user data in packaged app
    const appDataDir = process.env.APPDATA ? path.join(process.env.APPDATA, 'Spectra') : rootDir;
    if (!fs.existsSync(appDataDir)) {
        try { fs.mkdirSync(appDataDir, { recursive: true }); } catch (e) {}
    }
    const userProvidersPath = path.join(appDataDir, 'ai_providers.json');
    const rootProvidersPath = path.join(rootDir, 'ai_providers.json');
    const exampleProvidersPath = path.join(rootDir, 'ai_providers.example.json');
    const providersPath = userProvidersPath;

    const envPath = path.join(appDataDir, '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
    }

    // Serve static frontend files
    app.use(express.static(webDir));
    app.use('/css', express.static(path.join(webDir, 'css')));
    app.use('/js', express.static(path.join(webDir, 'js')));
    app.use('/assets', express.static(path.join(rootDir, 'assets')));
    app.use('/static', express.static(webDir));

    function getProvidersData() {
        if (!fs.existsSync(providersPath)) {
            if (fs.existsSync(rootProvidersPath)) {
                try { fs.copyFileSync(rootProvidersPath, providersPath); } catch (e) {}
            } else if (fs.existsSync(exampleProvidersPath)) {
                try { fs.copyFileSync(exampleProvidersPath, providersPath); } catch (e) {}
            } else {
                return [];
            }
        }
        try {
            return JSON.parse(fs.readFileSync(providersPath, 'utf8'));
        } catch (e) {
            console.error('Error reading ai_providers.json:', e);
            return [];
        }
    }

    // Config route
    app.get('/api/config', (req, res) => {
        res.json({
            DEV_MODE: false,
            LOG_LEVEL: 'INFO',
            CAPTURE_PROTECTION_ENABLED: true
        });
    });

    // AI Providers - Sanitized for general client view
    app.get('/api/ai-providers', (req, res) => {
        const providers = getProvidersData();
        const safe = providers.map(p => ({
            name: p.name,
            models: p.models || [],
            visionModels: p.visionModels || [],
            supportsVision: p.supportsVision || false,
            maxImages: p.maxImages || 2,
            defaultPrimary: p.defaultPrimary || false,
            defaultSecondary: p.defaultSecondary || false,
            defaultVisionPrimary: p.defaultVisionPrimary || false,
            defaultVisionSecondary: p.defaultVisionSecondary || false,
            defaultModel: p.defaultModel,
            defaultVisionModel: p.defaultVisionModel
        }));
        res.json(safe);
    });

    // AI Providers - Full (with keys for settings modal)
    app.get('/api/ai-providers/full', (req, res) => {
        const providers = getProvidersData();
        res.json(providers);
    });

    // Deepgram Key
    app.get('/api/deepgram-key', (req, res) => {
        const key = process.env.DEEPGRAM_API_KEY || '';
        res.json({ key });
    });

    // Save Deepgram Key
    app.post('/api/save-deepgram-key', (req, res) => {
        const { key } = req.body;
        if (key !== undefined) {
            process.env.DEEPGRAM_API_KEY = key;
            let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
            if (envContent.includes('DEEPGRAM_API_KEY=')) {
                envContent = envContent.replace(/DEEPGRAM_API_KEY=.*/, `DEEPGRAM_API_KEY=${key}`);
            } else {
                envContent += `\nDEEPGRAM_API_KEY=${key}\n`;
            }
            fs.writeFileSync(envPath, envContent);
            return res.json({ success: true, message: 'Deepgram key saved.' });
        }
        res.status(400).json({ error: 'No key provided' });
    });

    // Save AI Providers
    app.post('/api/save-ai-providers', (req, res) => {
        const { providers } = req.body;
        if (Array.isArray(providers)) {
            fs.writeFileSync(providersPath, JSON.stringify(providers, null, 4));
            return res.json({ success: true, message: 'Providers updated.' });
        }
        res.status(400).json({ error: 'Invalid providers payload' });
    });

    // Verify Provider
    app.post('/api/verify-provider', async (req, res) => {
        const { name, model } = req.body;
        const providers = getProvidersData();
        const prov = providers.find(p => p.name === name);
        if (!prov) {
            return res.status(404).json({ valid: false, message: 'Provider not found' });
        }
        const service = new LLMService(prov);
        const valid = await service.verifyConnection(model);
        res.json({ valid });
    });

    // Verify Vision Provider
    app.post('/api/verify-vision-provider', async (req, res) => {
        const { name, model } = req.body;
        const providers = getProvidersData();
        const prov = providers.find(p => p.name === name);
        if (!prov) {
            return res.status(404).json({ valid: false, message: 'Vision provider not found' });
        }
        const service = new LLMService(prov);
        const valid = await service.verifyConnection(model);
        res.json({ valid });
    });

    // Native Silent Screenshot endpoint
    app.post('/api/screenshot/native', async (req, res) => {
        if (options.captureNativeScreenshot) {
            try {
                const result = await options.captureNativeScreenshot();
                return res.json(result);
            } catch (err) {
                console.error('[Screenshot] Error:', err);
                return res.status(500).json({ success: false, detail: err.message });
            }
        }
        res.status(501).json({ success: false, detail: 'Native screenshot handler not bound.' });
    });

    // Transparency endpoints
    app.post('/api/transparency', (req, res) => {
        const { transparency } = req.body;
        if (typeof transparency === 'number' && options.setOpacity) {
            options.setOpacity(Math.max(0.1, Math.min(1.0, transparency)));
            return res.json({ success: true, opacity: transparency });
        }
        res.json({ success: true });
    });

    app.post('/api/transparency/percent', (req, res) => {
        const { percent } = req.body;
        if (typeof percent === 'number' && options.setOpacity) {
            options.setOpacity(Math.max(0.1, Math.min(1.0, percent / 100)));
            return res.json({ success: true, percent });
        }
        res.json({ success: true });
    });

    app.post('/api/window/always-on-top', (req, res) => {
        const { always_on_top } = req.body;
        if (options.setAlwaysOnTop) {
            options.setAlwaysOnTop(Boolean(always_on_top));
        }
        res.json({ success: true });
    });

    // Logo.dev Search API proxy — keeps secret key server-side
    const LOGODEV_SECRET_KEY = process.env.LOGODEV_SECRET_KEY || 'sk_faDDR_bVSw6MGP0i10Ck-g';
    const LOGODEV_PK = process.env.LOGODEV_PUBLISHABLE_KEY || 'pk_IYZJTyr_RxWrSqGDHj3wlw';

    app.get('/api/logo-search', async (req, res) => {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.json({ data: [] });
        }
        try {
            const url = `https://api.logo.dev/search?q=${encodeURIComponent(query)}&limit=6`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${LOGODEV_SECRET_KEY}` }
            });
            if (!response.ok) {
                console.error('[Logo.dev] API error:', response.status);
                return res.json({ data: [] });
            }
            const result = await response.json();
            // Attach publishable key to logo URLs for frontend <img> usage
            const data = (result || []).map(item => ({
                name: item.name || '',
                domain: item.domain || '',
                logo_url: item.domain ? `https://img.logo.dev/${item.domain}?token=${LOGODEV_PK}&size=64&format=png` : ''
            }));
            res.json({ data });
        } catch (err) {
            console.error('[Logo.dev] Search error:', err.message);
            res.json({ data: [] });
        }
    });

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server, path: '/ws' });

    const activeSessions = new Map();

    wss.on('connection', (ws) => {
        const sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
        const sendJson = (type, payload) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type, payload }));
            }
        };

        const session = new InterviewSession(sessionId, sendJson);
        activeSessions.set(sessionId, session);

        sendJson('session_created', { session_id: sessionId });

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                const type = message.type;
                const payload = message.payload || {};

                switch (type) {
                    case 'verify_deepgram':
                        await session.handleVerifyDeepgram(payload);
                        break;
                    case 'start_interview':
                        await session.handleStartInterview(payload);
                        break;
                    case 'audio_chunk':
                        session.handleAudioChunk(payload);
                        break;
                    case 'analyze_vision':
                        await session.handleAnalyzeVision(payload);
                        break;
                    case 'switch_preset':
                        session.handleSwitchPreset(payload);
                        break;
                    case 'reset_session':
                        session.handleResetSession();
                        break;
                    default:
                        console.warn(`[WS] Unknown message type: ${type}`);
                }
            } catch (err) {
                console.error('[WS] Message handling error:', err);
            }
        });

        ws.on('close', () => {
            session.destroy();
            activeSessions.delete(sessionId);
        });
    });

    return { server, app };
}

module.exports = { createServer };
