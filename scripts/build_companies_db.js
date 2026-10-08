const fs = require('fs');
const path = require('path');

const LOGODEV_SECRET_KEY = process.env.LOGODEV_SECRET_KEY || 'sk_faDDR_bVSw6MGP0i10Ck-g';
const LOGODEV_PK = process.env.LOGODEV_PUBLISHABLE_KEY || 'pk_IYZJTyr_RxWrSqGDHj3wlw';

// Target file in web/data/companies_db.json
const outputDir = path.resolve(__dirname, '../web/data');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, 'companies_db.json');

// Load existing DB if present to merge
let db = [];
if (fs.existsSync(outputPath)) {
    try {
        db = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        console.log(`Loaded ${db.length} existing companies from DB.`);
    } catch (e) {
        db = [];
    }
}

const seen = new Set(db.map(c => (c.name || '').toLowerCase().trim()));

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchForQuery(q) {
    const url = `https://api.logo.dev/search?q=${encodeURIComponent(q)}&limit=25`;
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${LOGODEV_SECRET_KEY}` }
        });
        if (!res.ok) {
            console.warn(`[Logo.dev] Status ${res.status} for query: ${q}`);
            return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data || []);
    } catch (err) {
        console.error(`[Logo.dev] Error for query ${q}:`, err.message);
        return [];
    }
}

async function buildDatabase() {
    console.log('--- Starting Logo.dev crawler ---');

    // Single letters a-z
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    
    // Suffixes, industry terms, prefixes and popular sectors
    const expandedQueries = [
        // Common company suffixes & keywords
        'bank', 'tech', 'pay', 'cloud', 'labs', 'health', 'data', 'soft', 'media',
        'group', 'corp', 'global', 'capital', 'ventures', 'solutions', 'hub', 'app',
        'link', 'net', 'pro', 'security', 'cyber', 'energy', 'finance', 'logistics',
        'games', 'auto', 'pharma', 'consulting', 'digital', 'systems', 'networks',
        'analytics', 'retail', 'insurance', 'aerospace', 'robotics', 'medical', 'space',
        // Prefixes
        'meta', 'micro', 'alpha', 'nano', 'hyper', 'super', 'bio', 'eco', 'fin',
        'gov', 'open', 'deep', 'smart', 'inter', 'multi', 'omni', 'poly', 'tele',
        // Modern tech keywords
        'dev', 'code', 'stack', 'flow', 'stream', 'chain', 'scale', 'sync', 'craft',
        'wave', 'forge', 'nexus', 'prism', 'pulse', 'spark', 'vector', 'vertex',
        'orbit', 'zen', 'core', 'prime', 'shield', 'vault', 'byte', 'pixel',
        // Global tech and business giants
        'openai', 'anthropic', 'nvidia', 'intel', 'amd', 'cisco', 'oracle', 'salesforce',
        'adobe', 'stripe', 'figma', 'notion', 'slack', 'zoom', 'datadog', 'snowflake',
        'palantir', 'mongodb', 'cloudflare', 'atlassian', 'github', 'gitlab', 'shopify',
        // Brazilian & Latam leaders
        'itau', 'bradesco', 'santander', 'nubank', 'picpay', 'c6 bank', 'stone',
        'pagseguro', 'totvs', 'embraer', 'ambev', 'vale', 'petrobras', 'ifood',
        'quintoandar', 'loft', 'hotmart', 'gympass', 'wellhub', 'vtex', 'mercado livre'
    ];

    const allQueries = expandedQueries;
    let newCount = 0;

    for (let i = 0; i < allQueries.length; i++) {
        const q = allQueries[i];
        process.stdout.write(`[${i + 1}/${allQueries.length}] Crawling "${q}"... `);
        
        const results = await fetchForQuery(q);
        let addedThisQuery = 0;

        for (const item of results) {
            const rawName = (item.name || '').trim();
            const domain = (item.domain || '').trim();
            if (!rawName) continue;

            const key = rawName.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                
                // Construct clean logo url using publishable key
                const logoUrl = item.logo_url || (domain ? `https://img.logo.dev/${domain}?token=${LOGODEV_PK}&size=64&format=png` : '');
                
                db.push({
                    name: rawName,
                    logo: logoUrl
                });
                addedThisQuery++;
                newCount++;
            }
        }

        console.log(`+${addedThisQuery} new (total: ${db.length})`);
        
        // Save incrementally every 10 queries
        if (i % 10 === 0) {
            fs.writeFileSync(outputPath, JSON.stringify(db, null, 2), 'utf8');
        }

        await sleep(150); // Be respectful of rate limits
    }

    // Sort alphabetically by name
    db.sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(outputPath, JSON.stringify(db, null, 2), 'utf8');
    console.log(`\nDONE! Saved ${db.length} unique companies (+${newCount} newly found) to ${outputPath}`);
}

buildDatabase();
