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

        let arrayCount = 0;

        // 1. Process regions file (Extract array wrapped inside "sub_regions")
        const regionsPath = path.join(dataDir, 'regions.json');
        if (fs.existsSync(regionsPath)) {
            const regionsData = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
            if (regionsData && Array.isArray(regionsData.sub_regions)) {
                db['sub_regions'] = regionsData.sub_regions;
                arrayCount++;
            } else {
                db['sub_regions'] = [];
            }
        } else {
            console.warn("⚠️ Warning: regions.json was not found.");
        }

        // 2. Process locations file (Extract array wrapped inside "locations")
        const locationsPath = path.join(dataDir, 'locations.json');
        if (fs.existsSync(locationsPath)) {
            const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
            if (locationsData && Array.isArray(locationsData.locations)) {
                db['locations'] = locationsData.locations;
                arrayCount++;
            } else {
                db['locations'] = [];
            }
        } else {
            console.warn("⚠️ Warning: locations.json was not found.");
        }

        // 3. Process brands file (Extract array wrapped inside "brands")
        const brandsPath = path.join(dataDir, 'brands.json');
        if (fs.existsSync(brandsPath)) {
            const brandsData = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
            if (brandsData && Array.isArray(brandsData.brands)) {
                db['brands'] = brandsData.brands;
                arrayCount++;
            } else {
                db['brands'] = [];
            }
        } else {
            console.warn("⚠️ Warning: brands.json was not found.");
        }

        // 4. Keep fallback processing for data_arrays.json multi-array format file if needed
        const dataArraysPath = path.join(dataDir, 'data_arrays.json');
        if (fs.existsSync(dataArraysPath)) {
            const structuralMap = JSON.parse(fs.readFileSync(dataArraysPath, 'utf8'));
            
            for (const key in structuralMap) {
                if (Array.isArray(structuralMap[key])) {
                    // Force registry collection keys to be lowercase
                    db[key.trim().toLowerCase()] = structuralMap[key];
                    arrayCount++;
                }
            }
        }

        console.log(`\n✅ Database Bootstrap Success: Tracked and mounted ${arrayCount} collection endpoint datasets successfully.`);

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
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    
    let pathname = reqUrl.pathname.toLowerCase();
    if (pathname.endsWith('/') && pathname !== '/') {
        pathname = pathname.slice(0, -1);
    }
    
    const method = req.method;
    const searchParams = reqUrl.searchParams;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        if (pathname.startsWith('/api/')) {
            const targetCollection = pathname.substring(5);

            // --- CUSTOM OVERRIDE ROUTE: POST FOR TECHNICIAN SLOTS FILTERING ---
            if (targetCollection === 'available_dates' && method === 'POST') {
                const rawBody = await collectRequestBody(req);
                if (!rawBody || !rawBody.trim()) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ error: "Payload data criteria string cannot be null or empty." }));
                }

                const criteria = JSON.parse(rawBody);

                // Filter down memory storage rows based on matching input criteria
                const filteredSlots = db['technician_slots'].filter(slot => {
                    let isMatch = true;

                    if (criteria.BrandId) {
                        isMatch = isMatch && (String(slot.BrandId || slot.brandId).toUpperCase() === String(criteria.BrandId).toUpperCase());
                    }
                    if (criteria.Category) {
                        isMatch = isMatch && (String(slot.Category || slot.category_id || slot.category).toUpperCase() === String(criteria.Category).toUpperCase());
                    }
                    if (criteria.Location) {
                        isMatch = isMatch && (String(slot.Location || slot.locationId || slot.location).trim() === String(criteria.Location).trim());
                    }

                    return isMatch;
                });

                res.statusCode = 200;
                return res.end(JSON.stringify(filteredSlots));
            }

            // --- STANDARD DYNAMIC ROUTER PIPELINE ---
            if (db.hasOwnProperty(targetCollection)) {
                
                // --- GET METHOD ENDPOINT ---
                if (method === 'GET') {
                    const queryKeys = Array.from(searchParams.keys());
                    if (queryKeys.length > 0) {
                        const identifierKey = queryKeys[0].toLowerCase().trim();
                        let identifierValue = searchParams.get(queryKeys[0]).toLowerCase().trim();

                        if (identifierKey === 'phone' || identifierKey === 'phonenumber') {
                            identifierValue = identifierValue.replace(/[\s+]/g, '');
                            if (identifierValue.startsWith('00')) identifierValue = identifierValue.substring(2);
                        }

                        const matchedItem = db[targetCollection].find(item => {
                            const dbKey = Object.keys(item).find(k => k.toLowerCase() === identifierKey);
                            if (!dbKey) return false;

                            let dbValue = String(item[dbKey]).toLowerCase().trim();
                            if (identifierKey === 'phone' || identifierKey === 'phonenumber') {
                                dbValue = dbValue.replace(/[\s+]/g, '');
                                if (dbValue.startsWith('00')) dbValue = dbValue.substring(2);
                            }
                            return dbValue === identifierValue;
                        });

                        if (matchedItem) {
                            res.statusCode = 200;
                            return res.end(JSON.stringify(matchedItem));
                        } else {
                            res.statusCode = 404;
                            return res.end(JSON.stringify({ error: `Record not found where ${queryKeys[0]} equals '${searchParams.get(queryKeys[0])}'.` }));
                        }
                    }

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
                    const prefixConfig = {
                        'brands':             { prefix: '',          key: 'brandId',          pad: 0, defaultMax: 106 },
                        'locations':          { prefix: '',          key: 'locationId',       pad: 0, defaultMax: 1005 },
                        'user_profiles':      { prefix: 'USR-',      key: 'profile_id',       pad: 0, defaultMax: 9981 },
                        'service_types':      { prefix: 'ST-',       key: 'service_id',       pad: 2, defaultMax: 4 },
                        'categories':         { prefix: 'CAT-',      key: 'category_id',      pad: 2, defaultMax: 3 },
                        'issue_types':        { prefix: 'ISS-',      key: 'issue_id',         pad: 2, defaultMax: 4 },
                        'service_requests':   { prefix: 'SR-2026-',  key: 'request_id',       pad: 4, defaultMax: 1 },
                        'inquiry_requests':   { prefix: 'INQ-2026-', key: 'inquiry_id',       pad: 0, defaultMax: 881 },
                        'complaint_requests': { prefix: 'COM-2026-', key: 'complaint_id',     pad: 0, defaultMax: 441 },
                        'submitted_tickets':  { prefix: 'TCK-',      key: 'ticket_id',        pad: 0, defaultMax: 55412 },
                        'technician_slots':   { prefix: 'SLOT-',     key: 'slot_id',          pad: 0, defaultMax: 5572 },
                        'sales_orders':       { prefix: 'SO-',       key: 'order_id',         pad: 0, defaultMax: 77412 }
                    };

                    if (prefixConfig.hasOwnProperty(targetCollection)) {
                        const config = prefixConfig[targetCollection];
                        let maxIdNum = config.defaultMax;

                        db[targetCollection].forEach(item => {
                            const actualKey = Object.keys(item).find(k => k.toLowerCase() === config.key.toLowerCase());
                            if (actualKey && String(item[actualKey]).toUpperCase().startsWith(config.prefix)) {
                                const currentNum = parseInt(String(item[actualKey]).toUpperCase().replace(config.prefix, ''), 10);
                                if (!isNaN(currentNum) && currentNum > maxIdNum) {
                                    maxIdNum = currentNum;
                                }
                            }
                        });

                        const nextNum = maxIdNum + 1;
                        const formattedNum = config.pad > 0 ? String(nextNum).padStart(config.pad, '0') : String(nextNum);
                        payload[config.key] = `${config.prefix}${formattedNum}`;

                        if (targetCollection === 'service_requests') {
                            payload.status = "Pending Allocation";
                        } else if (targetCollection === 'inquiry_requests') {
                            payload.status = "Open";
                        } else if (targetCollection === 'complaint_requests') {
                            payload.status = "Under Investigation";
                        }
                    }

                    db[targetCollection].push(payload);
                    res.statusCode = 201;
                    return res.end(JSON.stringify({ message: `Record successfully appended to ${targetCollection}.`, storedData: payload }));
                }

                // --- PUT METHOD ENDPOINT ---
                if (method === 'PUT') {
                    const queryKeys = Array.from(searchParams.keys());
                    if (queryKeys.length === 0) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Missing lookup parameters." }));
                    }

                    const identifierKey = queryKeys[0].toLowerCase().trim();
                    let identifierValue = searchParams.get(queryKeys[0]).toLowerCase().trim();

                    if (identifierKey === 'phone' || identifierKey === 'phonenumber') {
                        identifierValue = identifierValue.replace(/[\s+]/g, '');
                    }

                    const itemIndex = db[targetCollection].findIndex(item => {
                        const dbKey = Object.keys(item).find(k => k.toLowerCase() === identifierKey);
                        if (!dbKey) return false;

                        let dbValue = String(item[dbKey]).toLowerCase().trim();
                        if (identifierKey === 'phone' || identifierKey === 'phonenumber') {
                            dbValue = dbValue.replace(/[\s+]/g, '');
                        }
                        return dbValue === identifierValue;
                    });

                    if (itemIndex === -1) {
                        res.statusCode = 404;
                        return res.end(JSON.stringify({ error: `No match found for query parameters.` }));
                    }

                    const rawBody = await collectRequestBody(req);
                    if (!rawBody || !rawBody.trim()) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Body updates payload required." }));
                    }
                    
                    const updatePayload = JSON.parse(rawBody);
                    db[targetCollection][itemIndex] = { ...db[targetCollection][itemIndex], ...updatePayload };

                    res.statusCode = 200;
                    return res.end(JSON.stringify({ message: "Profile updated successfully.", updatedData: db[targetCollection][itemIndex] }));
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
