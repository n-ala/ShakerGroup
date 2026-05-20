const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Global database memory context
const db = {};

/**
 * Loads valid JSON configurations from the data directory and maps them to memory arrays
 */
function bootstrapDatabase() {
    try {
        const dataDir = path.join(__dirname, 'data');

        if (!fs.existsSync(dataDir)) {
            console.error(`❌ Critical Error: The data folder path does not exist: ${dataDir}`);
            process.exit(1);
        }

        // 1. Process regions array file
        const regionsPath = path.join(dataDir, 'regions_and_neighbourhoods.json');
        if (fs.existsSync(regionsPath)) {
            const regionsData = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
            db['regions'] = Array.isArray(regionsData) ? regionsData : [];
        } else {
            console.warn("⚠️ Warning: regions_and_neighbourhoods.json was not found.");
        }

        // 2. Process multi-array format file
        const dataArraysPath = path.join(dataDir, 'data_arrays.json');
        if (fs.existsSync(dataArraysPath)) {
            const structuralMap = JSON.parse(fs.readFileSync(dataArraysPath, 'utf8'));
            
            let arrayCount = 0;
            for (const key in structuralMap) {
                if (Array.isArray(structuralMap[key])) {
                    // Enforce lowercase route names for URL consistency
                    db[key.toLowerCase()] = structuralMap[key];
                    arrayCount++;
                }
            }
            console.log(`\n✅ Database Bootstrap Success: Loaded 1 array from regions and ${arrayCount} arrays from data_arrays.json`);
        } else {
            console.error("❌ Critical Error: data_arrays.json was not found.");
        }

        // Log exactly which API paths are live for validation testing
        console.log('\n🚀 Automated API Routes Mounted:');
        Object.keys(db).forEach(collection => {
            console.log(`  -> [GET/POST/PUT] http://localhost:3000/api/${collection}`);
        });
        console.log('--------------------------------------------------\n');

    } catch (error) {
        console.error('\n❌ Critical JSON Parsing Error during startup validation checklist:');
        console.error(error.message);
        console.error('Make sure all comma dividers and bracket pairs are structured cleanly.\n');
        process.exit(1);
    }
}

// Run database loader
bootstrapDatabase();

function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        let buffer = '';
        req.on('data', chunk => { buffer += chunk.toString(); });
        req.on('end', () => resolve(buffer));
        req.on('error', err => reject(err));
    });
}

// Instantiate server logic core
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/\/$/, '').toLowerCase();
    const method = req.method;
    const query = parsedUrl.query;

    // Enforce global UTF-8 encoding configuration for accurate Arabic processing
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        if (pathname.startsWith('/api/')) {
            const targetCollection = pathname.substring(5);

            if (db.hasOwnProperty(targetCollection)) {
                
                // --- GET METHOD ENDPOINT ---
                if (method === 'GET') {
                    res.statusCode = 200;
                    return res.end(JSON.stringify(db[targetCollection]));
                }

                // --- POST METHOD ENDPOINT ---
                if (method === 'POST') {
                    const rawBody = await collectRequestBody(req);
                    if (!rawBody) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Payload data string cannot be null." }));
                    }
                    const payload = JSON.parse(rawBody);
                    db[targetCollection].push(payload);
                    res.statusCode = 201;
                    return res.end(JSON.stringify({ message: "Record successfully appended.", storedData: payload }));
                }

                // --- PUT METHOD ENDPOINT ---
                if (method === 'PUT') {
                    const queryKeys = Object.keys(query);
                    if (queryKeys.length === 0) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Missing identifier filter string query parameter. (e.g. ?model=XYZ)" }));
                    }

                    const identifierKey = queryKeys[0];
                    const identifierValue = String(query[identifierKey]).toLowerCase();

                    // Search index mapping configuration layer
                    const itemIndex = db[targetCollection].findIndex(item => {
                        // Dynamically find a matching key inside the target row record
                        const itemValue = Object.keys(item).find(k => k.toLowerCase() === identifierKey.toLowerCase());
                        return itemValue && String(item[itemValue]).toLowerCase() === identifierValue;
                    });

                    if (itemIndex === -1) {
                        res.statusCode = 404;
                        return res.end(JSON.stringify({ error: `Record matching search descriptor ${identifierKey}='${query[identifierKey]}' could not be found.` }));
                    }

                    const rawBody = await collectRequestBody(req);
                    if (!rawBody) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Body content updates required." }));
                    }
                    const updatePayload = JSON.parse(rawBody);

                    // Perform shallow dictionary merge mapping over target item index configuration
                    db[targetCollection][itemIndex] = {
                        ...db[targetCollection][itemIndex],
                        ...updatePayload
                    };

                    res.statusCode = 200;
                    return res.end(JSON.stringify({
                        message: "Item record updated successfully",
                        updatedData: db[targetCollection][itemIndex]
                    }));
                }

                res.statusCode = 405;
                return res.end(JSON.stringify({ error: `Method ${method} is not supported for this dataset.` }));
            }
        }

        // Catch-all route mismatch error response 
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Endpoint route not found." }));

    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal microservice core evaluation fault.", details: err.message }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 API Microservice environment live executing at: http://localhost:${PORT}`);
});
