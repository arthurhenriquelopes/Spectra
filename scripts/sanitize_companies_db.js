const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../web/data/companies_db.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const initialCount = db.length;

const adultKeywords = [
    'xvideos', 'xhamster', 'pornhub', 'redtube', 'youporn', 'brazzers', 'chaturbate',
    'stripchat', 'bongacams', 'livejasmin', 'onlyfans', 'camsoda', 'spankwire',
    'mundosex', 'sexyporn', 'beeg', 'xnxx', 'eporner', 'hqporner', 'motherless',
    'heavy-r', 'fap', 'erotic', 'hentai', 'camster', 'myfreecams', 'streamate'
];

const pirateKeywords = [
    '1337x', 'thepiratebay', 'piratebay', 'rarbg', 'torrent', 'yts', 'fitgirl'
];

const errorKeywords = [
    '404', 'not found', 'page not found', 'could not be satisfied', 'proxy error',
    'bad gateway', 'server error', 'access denied', 'just another wordpress site',
    'default web site', 'welcome to nginx', 'apache2', 'index of /', 'error 404',
    'site not found', 'under construction', 'domain for sale', 'buy this domain'
];

function isJunk(item) {
    let name = (item.name || '').trim();
    const logo = (item.logo || '').toLowerCase().trim();
    const nameLower = name.toLowerCase();

    // Preserve X / Twitter
    if (name === 'X' && logo.includes('x.com')) {
        item.name = 'X (Twitter)';
        return false;
    }

    // Pure numbers or single character
    if (/^\d+$/.test(name) || name.length <= 1) return true;

    // Adult terms (in name or in domain/logo)
    for (const kw of adultKeywords) {
        if (nameLower.includes(kw) || logo.includes(kw)) return true;
    }
    if (/\b(porn|porno|xxx|sex|sexe|sexo|erotic|hentai)\b/i.test(nameLower)) return true;
    if (/\b(porn|xxx|sex|hentai)\b/i.test(logo)) return true;

    // Pirate / torrent terms
    for (const kw of pirateKeywords) {
        if (nameLower.includes(kw) || logo.includes(kw)) return true;
    }

    // Error / junk page terms
    for (const kw of errorKeywords) {
        if (nameLower.includes(kw) || logo.includes(kw)) return true;
    }

    return false;
}

const cleaned = db.filter(item => !isJunk(item));
const removedCount = initialCount - cleaned.length;

// Sort alphabetically
cleaned.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(dbPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log(`Cleaned database: removed ${removedCount} entries. Total now: ${cleaned.length}`);
