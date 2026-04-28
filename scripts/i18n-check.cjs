const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'public', 'locales');
const srcDir = process.cwd();
const reportPath = path.join(process.cwd(), 'logs', 'i18n_report.txt');

let reportOutput = "I18N TRANSLATION REPORT\n";
reportOutput += "=".repeat(30) + "\n\n";

/**
 * Flattens a nested object into a flat object with dot-notation keys.
 */
function flattenObj(obj, parent = '', res = {}) {
    for (let key in obj) {
        let propName = parent ? parent + '.' + key : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            flattenObj(obj[key], propName, res);
        } else {
            res[propName] = obj[key];
        }
    }
    return res;
}

/**
 * Recursively walks a directory and calls a callback for each source file.
 */
function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            // Ignore common build and environment folders
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== '.next' && f !== '.agents' && f !== '.firebase' && f !== '.vscode' && f !== '.github' && f !== 'types') {
                walkDir(dirPath, callback);
            }
        } else {
            // Support .ts, .tsx, .js, .jsx but exclude .d.ts declaration files
            if (/\.(ts|tsx|js|jsx)$/.test(f) && !f.endsWith('.d.ts')) {
                callback(dirPath);
            }
        }
    });
}

// Improved Regex: Handles t("key"), t('key'), t(`key`), and whitespace t( "key" )
const tRegex = /\bt\(\s*(['"`])([^'"`]+)\1/g;
const dynamicRegex = /\bt\(\s*`([^`]+)`/g;

const foundKeysInCode = new Set();
const keyLocations = {};
const dynamicPatterns = [];
const allSourceContent = [];

console.log('🚀 Scanning source files...');
walkDir(srcDir, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    allSourceContent.push(content);
    const relativePath = path.relative(srcDir, filePath);
    
    let match;
    // Static keys
    while ((match = tRegex.exec(content)) !== null) {
        const key = match[2];
        // Only treat it as static if it doesn't have ${} interpolation
        if (!key.includes('${')) {
            foundKeysInCode.add(key);
            if (!keyLocations[key]) keyLocations[key] = new Set();
            keyLocations[key].add(relativePath);
        }
    }

    // Dynamic pattern logging
    while ((match = dynamicRegex.exec(content)) !== null) {
        const pattern = match[1];
        if (pattern.includes('${')) {
            dynamicPatterns.push(pattern);
        }
    }
});

const combinedContent = allSourceContent.join('\n');
const languages = fs.readdirSync(localesDir).filter(f => fs.statSync(path.join(localesDir, f)).isDirectory());

// Extract precise dynamic prefixes (anything before the first ${)
const dynamicPrefixes = Array.from(new Set(dynamicPatterns.map(p => p.split('${')[0])));

// Section 1: Missing in any file
reportOutput += "SECTION 1: USED IN CODE BUT MISSING IN JSON\n";
reportOutput += "-".repeat(45) + "\n";
let missingTotal = 0;

foundKeysInCode.forEach(key => {
    const missingIn = [];
    languages.forEach(lang => {
        const langPath = path.join(localesDir, lang, 'translation.json');
        if (!fs.existsSync(langPath)) return;
        
        let content;
        try {
            content = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        } catch (e) {
            if (!reportOutput.includes(`❌ Invalid JSON: ${langPath}`)) {
                reportOutput += `❌ Invalid JSON: ${langPath}\n`;
            }
            return;
        }

        const flattened = flattenObj(content);
        if (!(key in flattened)) {
            missingIn.push(lang);
        }
    });

    if (missingIn.length > 0) {
        missingTotal++;
        reportOutput += `❌ KEY: "${key}"\n`;
        reportOutput += `   Missing in: [${missingIn.join(', ')}]\n`;
        reportOutput += `   Used in: ${Array.from(keyLocations[key] || []).join(', ')}\n\n`;
    }
});

if (missingTotal === 0) {
    reportOutput += "✅ No missing keys found!\n\n";
} else {
    reportOutput += `Found ${missingTotal} keys missing in at least one locale.\n\n`;
}

// Section 2: Unused in code
reportOutput += "\nSECTION 2: IN JSON BUT NOT USED IN CODE\n";
reportOutput += "-".repeat(45) + "\n";
let unusedTotal = 0;
let maybeUnusedTotal = 0;

// We check against EN as the source of truth for all possible keys
const enPath = path.join(localesDir, 'en', 'translation.json');
if (fs.existsSync(enPath)) {
    let enContent;
    try {
        enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    } catch (e) {
        reportOutput += `❌ Invalid JSON: ${enPath}\n`;
        enContent = {};
    }

    const enKeys = Object.keys(flattenObj(enContent));

    enKeys.forEach(key => {
        // If it's already found via t(), skip
        if (foundKeysInCode.has(key)) return;

        // Check if the key appears anywhere as a string literal
        const escapedKey = key.replace(/\./g, '\\.');
        const stringRegex = new RegExp(`(['"\`])${escapedKey}\\1`);
        
        if (stringRegex.test(combinedContent)) {
            return; // Key is used as a string literal somewhere
        }

        // Check against precise dynamic prefixes
        const matchedPrefix = dynamicPrefixes.find(prefix => key.startsWith(prefix));
        const isLikelyDynamic = !!matchedPrefix;

        if (isLikelyDynamic) {
            maybeUnusedTotal++;
            reportOutput += `⚠️  MAYBE UNUSED (dynamic prefix "${matchedPrefix}"): "${key}"\n`;
        } else {
            unusedTotal++;
            reportOutput += `🗑️  UNUSED: "${key}"\n`;
        }
    });
}

if (unusedTotal === 0 && maybeUnusedTotal === 0) {
    reportOutput += "✅ No unused keys found!\n";
} else {
    reportOutput += `\nFound ${unusedTotal} definitely unused keys, and ${maybeUnusedTotal} potentially dynamic unused keys.\n`;
}

// Summary
reportOutput += "\nSUMMARY\n";
reportOutput += "-".repeat(20) + "\n";
reportOutput += `Missing Keys: ${missingTotal}\n`;
reportOutput += `Unused Keys: ${unusedTotal}\n`;
reportOutput += `Maybe Unused (Dynamic): ${maybeUnusedTotal}\n`;
reportOutput += `Dynamic Patterns Found: ${new Set(dynamicPatterns).size}\n`;

if (dynamicPrefixes.length > 0) {
    reportOutput += "\nDYNAMIC PREFIXES DETECTED (These protect keys from deletion):\n";
    dynamicPrefixes.forEach(p => {
        reportOutput += ` - "${p}"\n`;
    });
}

fs.writeFileSync(reportPath, reportOutput);
console.log(`✅ Report saved to: ${reportPath}`);
