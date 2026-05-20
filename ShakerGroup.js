const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Global database storage context mapped at runtime
const db = {};

/**
 * Bootstraps the application database by reading configurations from the data directory
 */
function bootstrapDatabase() {
    try {
        const dataDir = path.join(__dirname, 'data');

        if (!fs.existsSync(dataDir)) {
            console.error(`Missing vital directory: ${dataDir}. Creating an empty one...`);
            fs.mkdirSync(dataDir);
            return;
        }

        // 1. Process standard array data structures (Regions)
        const regionsPath = path.join(dataDir, 'regions_and_neighbourhoods.json');
        if (fs.existsSync(regionsPath)) {
            const regionsData = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
            db['regions'] = Array.isArray(regionsData) ? regionsData : [];
        }

        // 2. Process combined structural maps (Data Arrays map)
        const dataArraysPath = path.join(dataDir, 'data_arrays.json');
        if (fs.existsSync(dataArraysPath)) {
            const structuralMap = JSON.parse(fs.readFileSync(dataArraysPath, 'utf8'));
            
            for (const collectionKey in structuralMap) {
                if (Array.isArray(structuralMap[collectionKey])) {
                    db[collectionKey] = structuralMap[collectionKey];
                }
            }
        }

        console.log('Successfully registered entities:', Object.keys(db));
    } catch (error) {
        console.error('Critical failure mapping files into process memory:', error.message);
        process.exit(1);
    }
}

// Initialize target datasets
bootstrapDatabase();

/**
 * Formats data chunks streaming from incoming requests
 */
function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        let buffer = '';
        req.on('data', chunk => { buffer += chunk.toString(); });
        req.on('end', () => resolve(buffer));
        req.on('error', err => reject(err));
    });
}

// Instantiate server instance
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/\/$/, '').toLowerCase();
    const method = req.method;

    // Enforce global UTF-8 encoding across all routing variations for Arabic text safety
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        // Enforce basic API namespace parsing path filters
        if (pathname.startsWith('/api/')) {
            const TargetCollection = pathname.substring(5);

            if (db.hasOwnProperty(TargetCollection)) {
                
                // --- GET METHOD ENDPOINT ---
                if (method === 'GET') {
                    res.statusCode = 200;
                    return res.end(JSON.stringify(db[TargetCollection]));
                }

                // --- POST METHOD ENDPOINT ---
                if (method === 'POST') {
                    const rawBody = await collectRequestBody(req);
                    
                    if (!rawBody) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Payload body missing on data registration attempt." }));
                    }

                    const payload = JSON.parse(rawBody);

                    if (typeof payload !== 'object' || Array.isArray(payload)) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Payload item must be structured as a valid single JSON object." }));
                    }

                    // Dynamically push the custom body object into our memory array map
                    db[TargetCollection].push(payload);
                    
                    res.statusCode = 201;
                    return res.end(JSON.stringify({
                        message: `Record successfully injected into collection context: '${TargetCollection}'`,
                        storedData: payload
                    }));
                }

                res.statusCode = 405;
                return res.end(JSON.stringify({ error: `Method action ${method} explicitly unsupported here.` }));
            }
        }

        // Catch-all fallthrough mismatch
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Target route entity reference missing from collection index definitions." }));

    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Process engine crash on evaluation parsing lifecycle.", errors: err.message }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 Dynamic REST Engine live at: http://localhost:${PORT}`);
    console.log('=====================================================');
    console.log('Automated routes actively registered for execution:');
    Object.keys(db).forEach(collection => {
        console.log(`  • [GET/POST]  http://localhost:${PORT}/api/${collection}`);
    });
    console.log('=====================================================\n');
});
