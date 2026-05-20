const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Global database storage context
const db = {};

function bootstrapDatabase() {
    try {
        const dataDir = path.join(__dirname, 'data');
        
        // 1. Load standard regions array
        const regionsPath = path.join(dataDir, 'regions_and_neighbourhoods.json');
        if (fs.existsSync(regionsPath)) {
            const regionsData = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
            db['regions'] = Array.isArray(regionsData) ? regionsData : [];
        }

        // 2. Load the structural map
        const dataArraysPath = path.join(dataDir, 'data_arrays.json');
        if (fs.existsSync(dataArraysPath)) {
            const structuralMap = JSON.parse(fs.readFileSync(dataArraysPath, 'utf8'));
            for (const key in structuralMap) {
                if (Array.isArray(structuralMap[key])) {
                    db[key] = structuralMap[key];
                }
            }
        }
        console.log('Successfully registered entities:', Object.keys(db));
    } catch (error) {
        console.error('Critical failure mapping files:', error.message);
        process.exit(1);
    }
}

bootstrapDatabase();

function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        let buffer = '';
        req.on('data', chunk => { buffer += chunk.toString(); });
        req.on('end', () => resolve(buffer));
        req.on('error', err => reject(err));
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/\/$/, '').toLowerCase();
    const method = req.method;
    const query = parsedUrl.query; // Capture query params (e.g., ?model=NG182C4 SK1 or ?city=Riyadh)

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        if (pathname.startsWith('/api/')) {
            const targetCollection = pathname.substring(5);

            if (db.hasOwnProperty(targetCollection)) {
                
                // --- GET METHOD ---
                if (method === 'GET') {
                    res.statusCode = 200;
                    return res.end(JSON.stringify(db[targetCollection]));
                }

                // --- POST METHOD ---
                if (method === 'POST') {
                    const rawBody = await collectRequestBody(req);
                    if (!rawBody) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Payload body missing." }));
                    }
                    const payload = JSON.parse(rawBody);
                    db[targetCollection].push(payload);
                    res.statusCode = 201;
                    return res.end(JSON.stringify({ message: "Record added successfully", storedData: payload }));
                }

                // --- NEW: PUT METHOD (DYNAMIC UPDATE) ---
                if (method === 'PUT') {
                    // 1. Identify what unique key the user is querying against
                    const queryKeys = Object.keys(query);
                    if (queryKeys.length === 0) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Missing query identifier parameter. Example: ?model=XYZ or ?city=ABC" }));
                    }

                    const identifierKey = queryKeys[0]; // e.g., 'model' or 'city'
                    const identifierValue = query[identifierKey].toLowerCase();

                    // 2. Locate the index of the item inside our array
                    const itemIndex = db[targetCollection].findIndex(item => {
                        // Check if the property exists on the item and matches the query value
                        return item[identifierKey] && String(item[identifierKey]).toLowerCase() === identifierValue;
                    });

                    if (itemIndex === -1) {
                        res.statusCode = 404;
                        return res.end(JSON.stringify({ error: `Record not found where ${identifierKey} equals '${query[identifierKey]}'.` }));
                    }

                    // 3. Collect new payload updates
                    const rawBody = await collectRequestBody(req);
                    if (!rawBody) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Payload update body missing." }));
                    }
                    const updatePayload = JSON.parse(rawBody);

                    // 4. Perform a shallow merge of properties into the existing object
                    db[targetCollection][itemIndex] = {
                        ...db[targetCollection][itemIndex],
                        ...updatePayload
                    };

                    res.statusCode = 200;
                    return res.end(JSON.stringify({
                        message: "Record updated successfully",
                        updatedData: db[targetCollection][itemIndex]
                    }));
                }

                res.statusCode = 405;
                return res.end(JSON.stringify({ error: `Method action ${method} explicitly unsupported.` }));
            }
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Endpoint route not found." }));

    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal parse exception.", details: err.message }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 Dynamic REST Engine with PUT support live at: http://localhost:${PORT}`);
});
