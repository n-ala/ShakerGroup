const http = require('http');
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
                    // Force registry collection keys to be lowercase
                    db[key.trim().toLowerCase()] = structuralMap[key];
                    arrayCount++;
                }
            }
            console.log(`\n✅ Database Bootstrap Success: Loaded 1 array from regions and ${arrayCount} arrays from data_arrays.json`);
        } else {
            console.error("❌ Critical Error: data_arrays.json was not found.");
        }

        // Visual validation checking block
        console.log('\n🚀 Automated API Routes Mounted & Live:');
        Object.keys(db).forEach(collection => {
            console.log(`  -> [GET/POST/PUT] http://localhost:10000/api/${collection}`);
        });
        console.log('--------------------------------------------------\n');

    } catch (error) {
        console.error('\n❌ Critical JSON Parsing Error during startup validation checklist:');
        console.error(error.message);
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

// Instantiate modern server layout logic core
const server = http.createServer(async (req, res) => {
    // --- MODERN WHATWG URL PARSING ENGINE ---
    // Using a fallback dummy base string handles internal local routing arrays reliably
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    
    // Normalize pathname: lowercase it and strip trailing slashes safely
    let pathname = reqUrl.pathname.toLowerCase();
    if (pathname.endsWith('/') && pathname !== '/') {
        pathname = pathname.slice(0, -1);
    }
    
    const method = req.method;
    const searchParams = reqUrl.searchParams; // Modern iterable URLSearchParams map

    // Enforce global UTF-8 encoding configuration for accurate Arabic processing
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        if (pathname.startsWith('/api/')) {
            const targetCollection = pathname.substring(5);

            if (db.hasOwnProperty(targetCollection)) {
                
                // --- GET METHOD ENDPOINT ---
                if (method === 'GET') {
                    const queryKeys = Array.from(searchParams.keys());
                    
                    // If a query parameter exists (like ?phone=0511111111)
                    if (queryKeys.length > 0) {
                        const identifierKey = queryKeys[0];
                        let identifierValue = searchParams.get(identifierKey).toLowerCase().trim();

                        // Normalize phone numbers for the search query if applicable
                        if (identifierKey === 'phone') {
                            identifierValue = identifierValue.replace(/[\s+]/g, '');
                            if (identifierValue.startsWith('00')) identifierValue = identifierValue.substring(2);
                        }

                        // Find the specific item matching the query criteria
                        const matchedItem = db[targetCollection].find(item => {
                            const dbKey = Object.keys(item).find(k => k.toLowerCase() === identifierKey.toLowerCase());
                            if (!dbKey) return false;

                            let dbValue = String(item[dbKey]).toLowerCase().trim();
                            if (identifierKey === 'phone') {
                                dbValue = dbValue.replace(/[\s+]/g, '');
                                if (dbValue.startsWith('00')) dbValue = dbValue.substring(2);
                            }
                            return dbValue === identifierValue;
                        });

                        // Return the single object if found, or a 404 error if it doesn't exist
                        if (matchedItem) {
                            res.statusCode = 200;
                            return res.end(JSON.stringify(matchedItem));
                        } else {
                            res.statusCode = 404;
                            return res.end(JSON.stringify({ error: `Record not found where ${identifierKey} equals '${searchParams.get(identifierKey)}'.` }));
                        }
                    }

                    // Fallback: If NO query parameters are passed, return the whole array as normal
                    res.statusCode = 200;
                    return res.end(JSON.stringify(db[targetCollection]));
                }

                // --- POST METHOD ENDPOINT ---
                if (method === 'POST') {
                    const rawBody = await collectRequestBody(req);
                    if (!rawBody || !rawBody.trim()) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Payload data string cannot be null or empty." }));
                    }
                    
                    const payload = JSON.parse(rawBody);

                    // --- FULLY DYNAMIC AUTOMATIC ID GENERATOR ---
                    const prefixConfig = {
                        'user_profiles':      { prefix: 'USR-',      key: 'profile_id',       pad: 0, defaultMax: 9981 },
                        'service_types':      { prefix: 'ST-',       key: 'service_id',       pad: 2, defaultMax: 4 },
                        'categories':         { prefix: 'CAT-',      key: 'category_id',      pad: 2, defaultMax: 3 },
                        'issue_types':        { prefix: 'ISS-',      key: 'issue_id',         pad: 2, defaultMax: 4 },
                        'technician_slots':   { prefix: 'SLOT-',     key: 'slot_id',          pad: 0, defaultMax: 559 },
                        'service_requests':   { prefix: 'SR-2026-',  key: 'request_id',       pad: 4, defaultMax: 1 },
                        'inquiry_requests':   { prefix: 'INQ-2026-', key: 'inquiry_id',       pad: 0, defaultMax: 881 },
                        'complaint_requests': { prefix: 'COM-2026-', key: 'complaint_id',     pad: 0, defaultMax: 441 },
                        'submitted_tickets':  { prefix: 'TCK-',      key: 'ticket_id',        pad: 0, defaultMax: 55412 },
                        'sales_orders':       { prefix: 'SO-',       key: 'order_id',         pad: 0, defaultMax: 77412 }
                    };

                    // If the current collection matches our auto-id roadmap configuration
                    if (prefixConfig.hasOwnProperty(targetCollection)) {
                        const config = prefixConfig[targetCollection];
                        let maxIdNum = config.defaultMax;

                        // Scan through the collection array to calculate the true mathematical max number
                        db[targetCollection].forEach(item => {
                            // Discover key field name regardless of casing differences
                            const actualKey = Object.keys(item).find(k => k.toLowerCase() === config.key.toLowerCase());
                            if (actualKey && String(item[actualKey]).toUpperCase().startsWith(config.prefix)) {
                                const currentNum = parseInt(String(item[actualKey]).toUpperCase().replace(config.prefix, ''), 10);
                                if (!isNaN(currentNum) && currentNum > maxIdNum) {
                                    maxIdNum = currentNum;
                                }
                            }
                        });

                        // Increment tracking sequence and apply string padding layout adjustments
                        const nextNum = maxIdNum + 1;
                        const formattedNum = config.pad > 0 ? String(nextNum).padStart(config.pad, '0') : String(nextNum);
                        
                        // Dynamically attach the completed token string directly into the payload object
                        payload[config.key] = `${config.prefix}${formattedNum}`;
                    }

                    // Append the payload record to the array database
                    db[targetCollection].push(payload);
                    
                    res.statusCode = 201;
                    return res.end(JSON.stringify({ 
                        message: `Record successfully appended to ${targetCollection}.`, 
                        storedData: payload 
                    }));
                }

                // --- PUT METHOD ENDPOINT ---
                if (method === 'PUT') {
                    const queryKeys = Array.from(searchParams.keys());
                    if (queryKeys.length === 0) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Missing lookup parameters (e.g. ?phone=0511111111)" }));
                    }

                    const identifierKey = queryKeys[0].toLowerCase().trim();
                    let identifierValue = searchParams.get(queryKeys[0]).toLowerCase().trim();

                    if (identifierKey === 'phone') {
                        identifierValue = identifierValue.replace(/[\s+]/g, '');
                    }

                    // Log debug details to the terminal console window
                    console.log(`[PUT DEBUG] Looking for matching row in '${targetCollection}' where key '${identifierKey}' = '${identifierValue}'`);

                    const itemIndex = db[targetCollection].findIndex(item => {
                        const dbKey = Object.keys(item).find(k => k.toLowerCase() === identifierKey);
                        if (!dbKey) return false;

                        let dbValue = String(item[dbKey]).toLowerCase().trim();
                        if (identifierKey === 'phone') {
                            dbValue = dbValue.replace(/[\s+]/g, '');
                        }
                        return dbValue === identifierValue;
                    });

                    if (itemIndex === -1) {
                        res.statusCode = 404;
                        return res.end(JSON.stringify({ error: `No match found for query parameters provided.` }));
                    }

                    const rawBody = await collectRequestBody(req);
                    if (!rawBody || !rawBody.trim()) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Body updates payload required." }));
                    }
                    
                    const updatePayload = JSON.parse(rawBody);

                    // Perform clean object merge mapping update
                    db[targetCollection][itemIndex] = {
                        ...db[targetCollection][itemIndex],
                        ...updatePayload
                    };

                    res.statusCode = 200;
                    return res.end(JSON.stringify({
                        message: "Profile updated successfully.",
                        updatedData: db[targetCollection][itemIndex]
                    }));
                }

                res.statusCode = 405;
                return res.end(JSON.stringify({ error: `Method ${method} not handled.` }));
            }
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Endpoint route not found." }));

    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal microservice core evaluation fault.", details: err.message }));
    }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 API Microservice environment live executing at: http://localhost:${PORT}`);
});
