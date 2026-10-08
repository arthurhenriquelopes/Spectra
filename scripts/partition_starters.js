const fs = require('fs');
const path = require('path');

const companiesDir = path.resolve(__dirname, '../web/data/companies');
if (!fs.existsSync(companiesDir)) {
    fs.mkdirSync(companiesDir, { recursive: true });
}

const mainDbPath = path.resolve(__dirname, '../web/data/companies_db.json');
let all = [];
if (fs.existsSync(mainDbPath)) {
    all = JSON.parse(fs.readFileSync(mainDbPath, 'utf8'));
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const groups = {};

alphabet.forEach(letter => {
    groups[letter] = [];
});
groups['other'] = [];

all.forEach(item => {
    const name = (item.name || '').trim();
    if (!name) return;
    const firstChar = name[0].toLowerCase();
    if (groups[firstChar]) {
        groups[firstChar].push(item);
    } else {
        groups['other'].push(item);
    }
});

alphabet.forEach(letter => {
    const filePath = path.join(companiesDir, `${letter}-starter.json`);
    groups[letter].sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(filePath, JSON.stringify(groups[letter], null, 2), 'utf8');
    console.log(`Saved ${letter}-starter.json: ${groups[letter].length} companies`);
});

const otherPath = path.join(companiesDir, `other-starter.json`);
fs.writeFileSync(otherPath, JSON.stringify(groups['other'], null, 2), 'utf8');
console.log(`Saved other-starter.json: ${groups['other'].length} companies`);
