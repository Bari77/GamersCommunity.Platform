var FILE_ENCODING = "utf-8";
var fs = require("fs");
var path = require("path");
var DELAY_BETWEEN_CONCAT_MS = 100;
var REFERENCE_LANGUAGE = "en-US";
var ANSI_RESET = "\u001b[0m";
var ANSI_GRAY = "\u001b[90m";
var ANSI_INFO = "\u001b[96m";
var ANSI_YELLOW = "\u001b[33m";
var ANSI_RED = "\u001b[31m";
var ANSI_APPLE_GREEN = "\u001b[92m";
var hasActiveInfoLine = false;
var dest = "./src/locale/";

async function run() {
    if (process.argv.indexOf("absorb") !== -1) {
        absorbExtractedCatalog();
    }

    logTranslation("Concatenation of files...");

    var languages = getLanguageFolders();
    var total = languages.length;
    var parseResult = parseLanguageFiles(languages);

    if (parseResult.hasErrors) {
        logError("Concatenation stopped due to JSON format errors", "Translation");
        process.exit(1);
    }

    for (var i = 0; i < total; i++) {
        var language = languages[i];
        logInfo("[" + (i + 1) + "/" + total + "] Concatenation of file: " + language.dst + ".json");
        writeConcatenatedLanguageFile(language.dst, parseResult.outputsByLanguage[language.dst]);

        if (i < total - 1) {
            await sleep(DELAY_BETWEEN_CONCAT_MS);
        }
    }

    validateLanguageKeys(parseResult.outputsByLanguage);

    logSuccess("Concatenation finished successfully (" + total + " languages concatenated)");
    process.exit(0);
}

if (require.main === module) {
    run().catch(function (error) {
        logError("Unexpected error: " + error.message);
        process.exit(1);
    });
}

function getLanguageFolders() {
    return fs
        .readdirSync(dest, { withFileTypes: true })
        .filter(function (entry) {
            return entry.isDirectory();
        })
        .map(function (entry) {
            return {
                src: path.join(dest, entry.name),
                dst: entry.name,
            };
        })
        .sort(function (a, b) {
            return a.dst.localeCompare(b.dst);
        });
}

function parseLanguageFiles(languages) {
    var outputsByLanguage = {};
    var hasErrors = false;

    languages.forEach(function (language) {
        var files = fs.readdirSync(language.src).filter(function (filePath) {
            return path.extname(filePath).toLowerCase() === ".json";
        });
        var mergedLanguageContent = {};

        files.forEach(function (filePath) {
            var fullPath = path.join(language.src, filePath);
            var temp = fs.readFileSync(fullPath, FILE_ENCODING).trim();

            try {
                var jsonContent = JSON.parse(temp);
                mergeContent(mergedLanguageContent, jsonContent);
            } catch (e) {
                logError(fullPath + "\n\t--> " + e.message, "Error");
                hasErrors = true;
            }
        });

        outputsByLanguage[language.dst] = mergedLanguageContent;
    });

    return {
        outputsByLanguage: outputsByLanguage,
        hasErrors: hasErrors,
    };
}

/**
 * Kert assigns each file onto the root because every file owns a distinct top-level key.
 * Game catalogs repeat `lol` / `wow` across files, so objects merge and a repeated leaf fails.
 */
function mergeContent(target, source, prefix) {
    prefix = prefix || "";
    Object.keys(source).forEach(function (key) {
        var incoming = source[key];
        var fullKey = prefix ? prefix + "." + key : key;
        if (!Object.prototype.hasOwnProperty.call(target, key)) {
            target[key] = incoming;
            return;
        }

        var existing = target[key];
        if (isPlainObject(existing) && isPlainObject(incoming)) {
            mergeContent(existing, incoming, fullKey);
            return;
        }

        throw new Error('duplicate key "' + fullKey + '"');
    });
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Angular compiles `{ locale, translations }` with flat dotted ids.
 */
function writeConcatenatedLanguageFile(languageCode, content) {
    var leaves = {};
    getAllKeyPaths(content).forEach(function (keyPath) {
        leaves[keyPath] = getValueAtPath(content, keyPath);
    });
    var translations = {};
    Object.keys(leaves)
        .sort()
        .forEach(function (key) {
            translations[key] = leaves[key];
        });
    var catalog = {
        locale: languageCode,
        translations: translations,
    };
    var distPath = path.resolve(dest + languageCode + ".json");
    fs.writeFileSync(distPath, JSON.stringify(catalog, null, 2) + "\n", FILE_ENCODING);
}

/**
 * Folds an extracted Angular catalog back into the per-area files Babelary reads.
 * French keeps existing values. A new English id is copied until it is translated.
 */
function absorbExtractedCatalog() {
    var extractedPath = path.resolve(dest + REFERENCE_LANGUAGE + ".json");
    var extracted = JSON.parse(fs.readFileSync(extractedPath, FILE_ENCODING));
    if (
        !extracted.translations ||
        typeof extracted.translations !== "object" ||
        Array.isArray(extracted.translations)
    ) {
        throw new Error(extractedPath + " is not an Angular catalog");
    }

    var english = extracted.translations;
    writeLanguageFolder(REFERENCE_LANGUAGE, english);

    getLanguageFolders().forEach(function (language) {
        if (language.dst === REFERENCE_LANGUAGE) {
            return;
        }

        var catalogPath = path.resolve(dest + language.dst + ".json");
        var previous = {};
        if (fs.existsSync(catalogPath)) {
            var catalog = JSON.parse(fs.readFileSync(catalogPath, FILE_ENCODING));
            previous = catalog.translations || {};
        }

        var next = {};
        Object.keys(english).forEach(function (key) {
            next[key] = Object.prototype.hasOwnProperty.call(previous, key) ? previous[key] : english[key];
        });
        writeLanguageFolder(language.dst, next);
    });
}

function writeLanguageFolder(languageCode, flat) {
    var folder = path.resolve(dest, languageCode);
    fs.mkdirSync(folder, { recursive: true });
    fs.readdirSync(folder).forEach(function (name) {
        if (path.extname(name).toLowerCase() === ".json") {
            fs.unlinkSync(path.join(folder, name));
        }
    });

    var groups = {};
    Object.keys(flat)
        .sort()
        .forEach(function (key) {
            var fileName = fileNameForKey(key);
            if (!groups[fileName]) {
                groups[fileName] = {};
            }
            groups[fileName][key] = flat[key];
        });

    Object.keys(groups)
        .sort()
        .forEach(function (fileName) {
            fs.writeFileSync(
                path.join(folder, fileName),
                JSON.stringify(nest(groups[fileName]), null, 4) + "\n",
                FILE_ENCODING,
            );
        });
}

function fileNameForKey(key) {
    var parts = key.split(".");
    if (parts[0] === "lol" || parts[0] === "wow") {
        return (parts[1] || parts[0]) + ".json";
    }

    return parts[0] + ".json";
}

function nest(flat) {
    var root = {};
    Object.keys(flat).forEach(function (key) {
        var parts = key.split(".");
        var node = root;
        for (var i = 0; i < parts.length - 1; i++) {
            if (typeof node[parts[i]] === "string") {
                throw new Error("key is both a text and a group: " + key);
            }
            if (!isPlainObject(node[parts[i]])) {
                node[parts[i]] = {};
            }
            node = node[parts[i]];
        }

        var leaf = parts[parts.length - 1];
        if (isPlainObject(node[leaf])) {
            throw new Error("key is both a text and a group: " + key);
        }
        node[leaf] = flat[key];
    });
    return root;
}

/**
 * Returns all key paths (e.g. ["ERROR.ERR_PET", "PETS.TITLE"]) in obj.
 * Only descends into plain objects; leaf values are represented by their path.
 */
function getAllKeyPaths(obj, prefix) {
    prefix = prefix || "";
    var paths = [];
    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var keyPath = prefix ? prefix + "." + key : key;
        var value = obj[key];

        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            paths.push.apply(paths, getAllKeyPaths(value, keyPath));
        } else {
            paths.push(keyPath);
        }
    }

    return paths;
}

/**
 * Gets the value at a dot-separated path in obj (e.g. "ERROR.ERR_PET").
 */
function getValueAtPath(obj, keyPath) {
    var parts = keyPath.split(".");
    var current = obj;
    for (var j = 0; j < parts.length; j++) {
        if (current == null || typeof current !== "object") {
            return undefined;
        }
        current = current[parts[j]];
    }
    return current;
}

function hasKeyAtPath(obj, keyPath) {
    return getValueAtPath(obj, keyPath) !== undefined;
}

function validateLanguageKeys(outputsByLanguage) {
    var referenceContent = outputsByLanguage[REFERENCE_LANGUAGE];

    if (!referenceContent) {
        logWarning("Missing reference language: " + REFERENCE_LANGUAGE + ".json. Key checks skipped.", "Warning");
        return;
    }

    var referencePaths = getAllKeyPaths(referenceContent);
    referencePaths.sort();

    Object.keys(outputsByLanguage).forEach(function (languageCode) {
        if (languageCode === REFERENCE_LANGUAGE) {
            return;
        }

        var languageContent = outputsByLanguage[languageCode];
        var languagePaths = getAllKeyPaths(languageContent);
        languagePaths.sort();

        var pathsMissingFromLanguage = referencePaths.filter(function (keyPath) {
            return !hasKeyAtPath(languageContent, keyPath);
        });
        var pathsExtraInLanguage = languagePaths.filter(function (keyPath) {
            return !hasKeyAtPath(referenceContent, keyPath);
        });

        if (pathsMissingFromLanguage.length > 0 || pathsExtraInLanguage.length > 0) {
            logWarning("Key mismatch with " + REFERENCE_LANGUAGE + ".json for " + languageCode + ".json", "Warning");
            logWarning(
                "\tMissing keys (" + pathsMissingFromLanguage.length + "): " + formatKeyList(pathsMissingFromLanguage),
            );
            logWarning("\tExtra keys (" + pathsExtraInLanguage.length + "): " + formatKeyList(pathsExtraInLanguage));
        }
    });
}

function formatKeyList(keys) {
    if (keys.length === 0) {
        return "(none)";
    }

    return keys.sort().join(", ");
}

function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function canRewriteCurrentLine() {
    return (
        process.stdout.isTTY &&
        typeof process.stdout.clearLine === "function" &&
        typeof process.stdout.cursorTo === "function"
    );
}

function clearActiveInfoLine() {
    if (!hasActiveInfoLine) {
        return;
    }

    if (canRewriteCurrentLine()) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    } else {
        process.stdout.write("\n");
    }

    hasActiveInfoLine = false;
}

function logTranslation(message) {
    clearActiveInfoLine();
    console.log(ANSI_INFO + "[Translation] " + message + ANSI_RESET);
}

function logInfo(message) {
    if (!canRewriteCurrentLine()) {
        console.log(ANSI_GRAY + "[Translation] " + message + ANSI_RESET);
        return;
    }

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(ANSI_GRAY + "[Translation] " + message + ANSI_RESET);
    hasActiveInfoLine = true;
}

function logSuccess(message) {
    clearActiveInfoLine();
    console.log(ANSI_APPLE_GREEN + "[Translation] " + message + ANSI_RESET);
}

function logWarning(message, title, newLine = false) {
    clearActiveInfoLine();
    console.log((newLine ? "\n" : "") + ANSI_YELLOW + (title ? "[" + title + "] " : "") + message + ANSI_RESET);
}

function logError(message, title, newLine = false) {
    clearActiveInfoLine();
    console.log((newLine ? "\n" : "") + ANSI_RED + (title ? "[" + title + "] " : "") + message + ANSI_RESET);
}

module.exports = {
    writeLanguageFolder: writeLanguageFolder,
    fileNameForKey: fileNameForKey,
};
