const fs = require('fs');
const path = require('path');

const LOGODEV_SECRET_KEY = process.env.LOGODEV_SECRET_KEY || 'sk_faDDR_bVSw6MGP0i10Ck-g';
const LOGODEV_PK = process.env.LOGODEV_PUBLISHABLE_KEY || 'pk_IYZJTyr_RxWrSqGDHj3wlw';

const companiesDir = path.resolve(__dirname, '../web/data/companies');
if (!fs.existsSync(companiesDir)) {
    fs.mkdirSync(companiesDir, { recursive: true });
}

const masterDbPath = path.resolve(__dirname, '../web/data/companies_db.json');

const JUNK_TERMS = [
    'xvideos', 'xhamster', 'pornhub', 'redtube', 'youporn', 'brazzers', 'chaturbate',
    'stripchat', 'bongacams', 'livejasmin', 'onlyfans', 'camsoda', 'spankwire',
    'mundosex', 'sexyporn', 'beeg', 'xnxx', 'eporner', 'hqporner', 'motherless',
    '1337x', 'thepiratebay', 'piratebay', 'rarbg', 'torrent', 'yts',
    '404', 'not found', 'page not found', 'could not be satisfied', 'proxy error',
    'bad gateway', 'server error', 'access denied', 'just another wordpress site',
    'default web site', 'welcome to nginx', 'apache2', 'index of /', 'error 404',
    'domain for sale', 'buy this domain', 'site not found'
];

function isSafe(name, logo) {
    if (!name || /^\d+$/.test(name.trim()) || name.trim().length <= 1) return false;
    const n = name.toLowerCase();
    const l = (logo || '').toLowerCase();
    for (const kw of JUNK_TERMS) {
        if (n.includes(kw) || l.includes(kw)) return false;
    }
    if (/\b(porn|porno|xxx|sex|sexe|sexo|erotic|hentai)\b/i.test(n)) return false;
    if (/\b(porn|xxx|sex|hentai)\b/i.test(l)) return false;
    return true;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLogoDev(q) {
    const url = `https://api.logo.dev/search?q=${encodeURIComponent(q)}&limit=25`;
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${LOGODEV_SECRET_KEY}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data || []);
    } catch (e) {
        return [];
    }
}

async function run() {
    console.log('=== Deep Starter Crawler: Generating [a-z]-starter.json ===\n');

    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let totalAll = 0;
    const masterList = [];

    for (let i = 0; i < alphabet.length; i++) {
        const letter = alphabet[i];
        const filePath = path.join(companiesDir, `${letter}-starter.json`);
        
        let existing = [];
        if (fs.existsSync(filePath)) {
            try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) {}
        }
        
        const map = new Map();
        existing.forEach(item => {
            if (isSafe(item.name, item.logo)) {
                map.set(item.name.toLowerCase().trim(), item);
            }
        });

        // 2-letter combos: 'a', 'aa', 'ab', 'ac' ... 'az'
        const combos = [letter, ...alphabet.map(sub => letter + sub)];
        process.stdout.write(`[${i + 1}/26] Letter "${letter.toUpperCase()}": crawling ${combos.length} queries... `);

        for (const query of combos) {
            const results = await fetchLogoDev(query);
            for (const item of results) {
                const rawName = (item.name || '').trim();
                const domain = (item.domain || '').trim();
                const logo = item.logo_url || (domain ? `https://img.logo.dev/${domain}?token=${LOGODEV_PK}&size=64&format=png` : '');

                if (!isSafe(rawName, logo)) continue;

                const key = rawName.toLowerCase();
                // Ensure it belongs in this starter file (or begins with this letter)
                if (key.startsWith(letter) && !map.has(key)) {
                    map.set(key, { name: rawName, logo });
                }
            }
            await sleep(100);
        }

        const letterList = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        fs.writeFileSync(filePath, JSON.stringify(letterList, null, 2), 'utf8');
        console.log(`Saved ${letterList.length} companies to ${letter}-starter.json`);

        totalAll += letterList.length;
        masterList.push(...letterList);
    }

    // Also update master db
    masterList.sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(masterDbPath, JSON.stringify(masterList, null, 2), 'utf8');

    console.log(`\nCOMPLETED ALL LETTERS! Total: ${totalAll} companies across 26 starter files!`);
}

run();
