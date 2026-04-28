const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'public', 'locales');
const reportPath = path.join(process.cwd(), 'i18n_report.txt');

if (!fs.existsSync(reportPath)) {
    console.error('Report not found! Please run "npm run i18n:check" first.');
    process.exit(1);
}

const reportContent = fs.readFileSync(reportPath, 'utf8');
const unusedKeys = [];
const regex = /🗑️\s+UNUSED:\s+"([^"]+)"/g;
let match;
while ((match = regex.exec(reportContent)) !== null) {
    unusedKeys.push(match[1]);
}

if (unusedKeys.length === 0) {
    console.log('✅ No unused keys found in the report. Nothing to clean.');
    process.exit(0);
}

console.log(`🧹 Found ${unusedKeys.length} keys to remove.`);

/**
 * Removes a dot-notation key from a nested object.
 */
function removeKey(obj, keyPath) {
    const keys = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) return;
        current = current[keys[i]];
    }
    delete current[keys[keys.length - 1]];

    // Clean up empty parent objects
    for (let i = keys.length - 2; i >= 0; i--) {
        const parentPath = keys.slice(0, i + 1);
        let parent = obj;
        for (const k of parentPath) {
            parent = parent[k];
        }
        if (Object.keys(parent).length === 0) {
            const grandParentPath = keys.slice(0, i);
            let grandParent = obj;
            for (const k of grandParentPath) {
                grandParent = grandParent[k];
            }
            if (i === 0) {
                delete obj[keys[0]];
            } else {
                delete grandParent[keys[i]];
            }
        }
    }
}

const languages = fs.readdirSync(localesDir).filter(f => fs.statSync(path.join(localesDir, f)).isDirectory());

languages.forEach(lang => {
    const langPath = path.join(localesDir, lang, 'translation.json');
    if (!fs.existsSync(langPath)) return;

    console.log(`Cleaning [${lang}]...`);
    const content = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    
    unusedKeys.forEach(key => {
        removeKey(content, key);
    });

    fs.writeFileSync(langPath, JSON.stringify(content, null, 2));
});

console.log('✅ Cleanup complete!');
