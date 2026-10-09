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

    // Local Companies DB + Logo.dev Search Proxy
    const LOGODEV_SECRET_KEY = process.env.LOGODEV_SECRET_KEY || 'sk_faDDR_bVSw6MGP0i10Ck-g';
    const LOGODEV_PK = process.env.LOGODEV_PUBLISHABLE_KEY || 'pk_IYZJTyr_RxWrSqGDHj3wlw';

    const bundledCompaniesDbPath = path.join(webDir, 'data', 'companies_db.json');
    const userCompaniesDbPath = path.join(appDataDir, 'companies_db.json');
    const activeCompaniesDbPath = fs.existsSync(userCompaniesDbPath) ? userCompaniesDbPath : bundledCompaniesDbPath;

    const JUNK_COMPANY_TERMS = [
        'xvideos', 'xhamster', 'pornhub', 'redtube', 'youporn', 'brazzers', 'chaturbate',
        'stripchat', 'bongacams', 'livejasmin', 'onlyfans', 'camsoda', 'spankwire',
        'mundosex', 'sexyporn', 'beeg', 'xnxx', 'eporner', 'hqporner', 'motherless',
        '1337x', 'thepiratebay', 'piratebay', 'rarbg', 'torrent', 'yts',
        '404', 'not found', 'page not found', 'could not be satisfied', 'proxy error',
        'bad gateway', 'server error', 'access denied', 'just another wordpress site',
        'default web site', 'welcome to nginx', 'apache2', 'index of /', 'error 404'
    ];

    function isSafeCompany(name, logo) {
        if (!name || /^\d+$/.test(name.trim()) || name.trim().length <= 1) return false;
        const nLower = name.toLowerCase();
        const lLower = (logo || '').toLowerCase();
        for (const term of JUNK_COMPANY_TERMS) {
            if (nLower.includes(term) || lLower.includes(term)) return false;
        }
        if (/\b(porn|porno|xxx|sex|sexe|sexo|erotic|hentai)\b/i.test(nLower)) return false;
        if (/\b(porn|xxx|sex|hentai)\b/i.test(lLower)) return false;
        return true;
    }

    let companiesDatabase = [];
    try {
        if (fs.existsSync(activeCompaniesDbPath)) {
            const raw = JSON.parse(fs.readFileSync(activeCompaniesDbPath, 'utf8'));
            companiesDatabase = Array.isArray(raw) ? raw.filter(item => isSafeCompany(item.name, item.logo || item.logo_url)) : [];
        }
    } catch (e) {
        console.error('[CompaniesDB] Error loading database:', e.message);
        companiesDatabase = [];
    }

    const seenCompanyNames = new Set(companiesDatabase.map(c => (c.name || '').toLowerCase().trim()));

    function saveCompaniesDbAsync() {
        try {
            const targetPath = userCompaniesDbPath;
            fs.writeFile(targetPath, JSON.stringify(companiesDatabase, null, 2), (err) => {
                if (err) console.error('[CompaniesDB] Error saving to disk:', err.message);
            });
        } catch (e) {}
    }

    app.get('/api/logo-search', async (req, res) => {
        const query = (req.query.q || '').trim();
        if (!query || query.length < 2) {
            return res.json({ data: [] });
        }

        const qLower = query.toLowerCase();

        // 1. Search in local database
        const startsWithMatches = [];
        const containsMatches = [];

        for (const item of companiesDatabase) {
            const nameLower = (item.name || '').toLowerCase();
            if (nameLower.startsWith(qLower)) {
                startsWithMatches.push({ name: item.name, logo_url: item.logo || item.logo_url });
            } else if (nameLower.includes(qLower)) {
                containsMatches.push({ name: item.name, logo_url: item.logo || item.logo_url });
            }
        }

        // Sort by length (shorter / more concise names first)
        startsWithMatches.sort((a, b) => a.name.length - b.name.length);
        containsMatches.sort((a, b) => a.name.length - b.name.length);

        const localResults = [...startsWithMatches, ...containsMatches].slice(0, 6);

        // If we have enough good local results, return immediately (instant, 0ms latency)
        if (localResults.length >= 4) {
            return res.json({ data: localResults });
        }

        // 2. Query Logo.dev live to discover new companies and expand our DB
        try {
            const url = `https://api.logo.dev/search?q=${encodeURIComponent(query)}&limit=6`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${LOGODEV_SECRET_KEY}` }
            });

            if (response.ok) {
                const result = await response.json();
                const list = Array.isArray(result) ? result : (result && Array.isArray(result.data) ? result.data : []);

                let hasNew = false;
                for (const item of list) {
                    const rawName = (item.name || '').trim();
                    const domain = (item.domain || '').trim();
                    if (!rawName) continue;

                    const key = rawName.toLowerCase();
                    const logoUrl = item.logo_url || (domain ? `https://img.logo.dev/${domain}?token=${LOGODEV_PK}&size=64&format=png` : '');

                    if (!seenCompanyNames.has(key)) {
                        seenCompanyNames.add(key);
                        companiesDatabase.push({ name: rawName, logo: logoUrl });
                        hasNew = true;
                    }

                    // Add to results if not already present
                    if (!localResults.some(r => r.name.toLowerCase() === key)) {
                        localResults.push({ name: rawName, logo_url: logoUrl });
                    }
                }

                if (hasNew) {
                    saveCompaniesDbAsync();
                }
            }
        } catch (err) {
            console.error('[Logo.dev] Live search error:', err.message);
        }

        res.json({ data: localResults.slice(0, 6) });
    });

    // Job Posting Link Parser (LinkedIn, Indeed & general job boards)
    function htmlToPlainText(html) {
        if (!html) return '';
        return html
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<li>/gi, '• ')
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')
            .replace(/<strong>(.*?)<\/strong>/gi, '$1')
            .replace(/<b>(.*?)<\/b>/gi, '$1')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function extractJobDetailsFromHtml(html) {
        if (!html) return { company: '', logo: '', description: '' };

        let companyName = '';
        let logoUrl = '';
        let description = '';

        // 1. Logo extraction
        const compImg = html.match(/<img[^>]+(?:data-delayed-url|src)="([^"]+media\.licdn\.com\/dms\/image[^"]+)"[^>]*alt="([^"]*)"/i)
            || html.match(/<img[^>]+alt="([^"]*)"[^>]+(?:data-delayed-url|src)="([^"]+media\.licdn\.com\/dms\/image[^"]+)"/i)
            || html.match(/<img[^>]+(?:data-delayed-url|src)="([^"]+)"[^>]*alt="([^"]*)"[^>]+(?:sub-nav-cta__image|company-logo)/i)
            || html.match(/<img[^>]+class="[^"]*company-logo[^"]*"[^>]+src="([^"]+)"/i)
            || html.match(/<img[^>]+class="[^"]*companyLogo[^"]*"[^>]+src="([^"]+)"/i);

        if (compImg) {
            if (compImg[1] && compImg[1].startsWith('http')) {
                logoUrl = compImg[1].replace(/&amp;/g, '&');
                if (compImg[2] && !companyName) companyName = compImg[2];
            } else if (compImg[2] && compImg[2].startsWith('http')) {
                logoUrl = compImg[2].replace(/&amp;/g, '&');
                if (compImg[1] && !companyName) companyName = compImg[1];
            }
        }

        if (!logoUrl) {
            const jsonLdLogo = html.match(/"logo"\s*:\s*"([^"]+)"/i);
            if (jsonLdLogo) logoUrl = jsonLdLogo[1].replace(/\\u002F/g, '/').replace(/&amp;/g, '&');
        }

        // 2. Company Name extraction
        if (!companyName) {
            const ariaComp = html.match(/aria-label="(?:Empresa|Company)\s+([^".]+)(?:\.|\")/i)
                || html.match(/alt="Logo\s+da\s+empresa\s+([^".]+)(?:\.|\")/i)
                || html.match(/aria-label="Logo\s+da\s+empresa\s+([^".]+)(?:\.|\")/i);
            if (ariaComp) companyName = ariaComp[1].trim();
        }
        if (!companyName) {
            const linkComp = html.match(/<a[^>]+href="https:\/\/www\.linkedin\.com\/company\/[^"]*"[^>]*>([^<]+)<\/a>/i);
            if (linkComp) companyName = linkComp[1].trim();
        }
        if (!companyName) {
            const topcardMatch = html.match(/<a[^>]+class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
            if (topcardMatch) companyName = topcardMatch[1].trim();
        }
        if (!companyName) {
            const indeedComp = html.match(/class="[^"]*companyName[^"]*"[^>]*>([^<]+)</i)
                || html.match(/data-company-name="true"[^>]*>([^<]+)</i);
            if (indeedComp) companyName = indeedComp[1].trim();
        }
        if (!companyName) {
            const jsonLdOrg = html.match(/"hiringOrganization"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]+)"/i);
            if (jsonLdOrg) companyName = jsonLdOrg[1].trim();
        }
        if (!companyName) {
            const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch) {
                const m = titleMatch[1].match(/^(.*?)\s+(?:hiring|at|contratando)\s+/i);
                if (m) companyName = m[1].trim();
            }
        }

        if (companyName) {
            companyName = companyName
                .replace(/Logo\s+da\s+empresa\s+/i, '')
                .replace(/Logo\s+of\s+/i, '')
                .replace(/Empresa\s+/i, '')
                .replace(/^[•\s-]+|[•\s-]+$/g, '')
                .replace(/\.$/, '')
                .trim();
        }

        // 3. Description extraction
        const descMatch = html.match(/data-testid="expandable-text-box"[^>]*>([\s\S]*?)<\/span>/i)
            || html.match(/class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
            || html.match(/class="[^"]*(description__text|decoratedJobPosting)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
            || html.match(/id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i)
            || html.match(/class="[^"]*jobsearch-jobDescriptionText[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

        if (descMatch) {
            description = htmlToPlainText(descMatch[1]);
        } else {
            const jsonLdDesc = html.match(/"description"\s*:\s*"([\s\S]*?)"\s*,\s*"[^"]+"\s*:/i);
            if (jsonLdDesc) {
                description = htmlToPlainText(jsonLdDesc[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
            }
        }

        if (description) {
            description = description.replace(/(?:\.\.\.|…)\s*(?:mais|show\s+more|exibir\s+mais)\s*$/i, '').trim();
        }

        return {
            company: companyName,
            logo: logoUrl,
            description: description
        };
    }

    app.post('/api/job-parse-url', async (req, res) => {
        const { url, html: directHtml } = req.body;
        const input = (url || directHtml || '').trim();

        if (!input) {
            return res.status(400).json({ success: false, error: 'A URL or HTML content is required' });
        }

        try {
            let extracted = { company: '', logo: '', description: '' };

            // Check if input is raw HTML snippet directly
            const isRawHtml = input.startsWith('<') || /<[a-z][\s\S]*>/i.test(input);

            if (isRawHtml) {
                extracted = extractJobDetailsFromHtml(input);
            } else {
                // Input is a URL - normalize LinkedIn search/recommendation URLs
                let targetUrl = input;
                const currentJobMatch = targetUrl.match(/[?&]currentJobId=(\d+)/i);
                const viewJobMatch = targetUrl.match(/\/jobs\/view\/(\d+)/i);

                if (currentJobMatch) {
                    targetUrl = `https://www.linkedin.com/jobs/view/${currentJobMatch[1]}/`;
                } else if (viewJobMatch) {
                    targetUrl = `https://www.linkedin.com/jobs/view/${viewJobMatch[1]}/`;
                }

                const response = await fetch(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                });

                if (!response.ok) {
                    return res.status(response.status).json({ success: false, error: `Could not reach page (HTTP ${response.status})` });
                }

                const fetchedHtml = await response.text();
                extracted = extractJobDetailsFromHtml(fetchedHtml);
            }

            if (!extracted.company && !extracted.description) {
                return res.json({
                    success: false,
                    error: 'Could not extract job details automatically from this link or content.'
                });
            }

            // Dynamically register into companies database if logo and name exist
            if (extracted.company && extracted.logo && isSafeCompany(extracted.company, extracted.logo)) {
                const key = extracted.company.toLowerCase();
                if (!seenCompanyNames.has(key)) {
                    seenCompanyNames.add(key);
                    companiesDatabase.push({ name: extracted.company, logo: extracted.logo });
                    saveCompaniesDbAsync();
                }
            }

            return res.json({
                success: true,
                company: extracted.company,
                logo: extracted.logo,
                description: extracted.description
            });
        } catch (err) {
            console.error('[JobParse] Error parsing URL or HTML:', err.message);
            return res.status(500).json({ success: false, error: err.message });
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
