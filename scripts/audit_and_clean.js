const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../web/data/companies');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const badTerms = [
    '404', 'not found', 'error 404', 'page not found', 'xvideo', 'xhamster',
    'pornhub', 'redtube', 'youporn', 'brazzers', 'chaturbate', 'stripchat',
    'bongacam', 'livejasmin', 'onlyfans', 'camsoda', 'spankwire', 'mundosex',
    'sexyporn', 'beeg', 'xnxx', 'eporner', 'hqporner', 'motherless', 'heavy-r',
    'fap', 'hentai', '1337x', 'thepiratebay', 'rarbg', 'torrent', 'proxy error',
    'could not be satisfied', 'under construction', 'buy this domain', 'domain for sale'
];

let totalCleaned = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const initialLen = content.length;

    const filtered = content.filter(item => {
        const name = (item.name || '').toLowerCase().trim();
        const logo = (item.logo || '').toLowerCase().trim();

        if (/^\d+$/.test(name) || name.length <= 1) return false;

        for (const term of badTerms) {
            if (name.includes(term) || logo.includes(term)) {
                console.log(`[${file}] Removed: "${item.name}" (matched "${term}")`);
                return false;
            }
        }
        if (/\b(porn|porno|xxx|sex|sexe|sexo|erotic|hentai)\b/i.test(name)) return false;
        if (/\b(porn|xxx|sex|hentai)\b/i.test(logo)) return false;

        return true;
    });

    if (filtered.length !== initialLen) {
        totalCleaned += (initialLen - filtered.length);
        fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
    }
}

console.log(`\nAudit completed! Total items removed: ${totalCleaned}`);
