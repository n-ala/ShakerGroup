const http = require('http');
const url = require('url');

const consultations = [];

// Create the HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
    const method = req.method;

    // Set standard response headers
    res.setHeader('Content-Type', 'application/json');

    // --- POST /api/schedule_consultation: Book a legal consultation ---
    if (pathname === '/api/schedule_consultation' && method === 'POST') {
        let body = '';

        // 1. Collect the incoming data payload
        req.on('data', chunk => {
            body += chunk.toString();
        });

        // 2. Process the data and respond
        req.on('end', () => {
            try {
                const { name, email, date, time, caseType, attorneyName } = JSON.parse(body);

                // Basic Validation: Ensure necessary legal consultation fields are present
                if (!name || !date || !time || !caseType) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ 
                        error: "Missing required fields (name, date, time, and caseType are mandatory)" 
                    }));
                }
                
                // Log the consultation (simulating a database save)
                const newConsultation = {
                    id: consultations.length + 1,
                    clientName: name,
                    email,
                    date,
                    time,
                    caseType,
                    attorneyName: attorneyName || "Next Available",
                    timestamp: new Date().toISOString()
                };

                consultations.push(newConsultation);

                // Success Response
                res.statusCode = 200; // 200 Created is more standard for POST
                res.end(JSON.stringify({ 
                    message: "Consultation scheduled successfully", 
                    consultationId: newConsultation.id 
                }));
            } catch (err) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Invalid JSON payload" }));
            }
        });
    }

    // --- GET /api/consultations: View all scheduled appointments ---
    else if (pathname === '/api/consultations' && method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify(consultations)); 
    }

    // --- Handle unknown or unsupported routes ---
    else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Route not found or method not supported" }));
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Legal Consultation Server running on http://localhost:${PORT}`);
    console.log(`- POST /api/schedule_consultation (Schedule an appointment)`);
    console.log(`- GET  /api/consultations (View all appointments)`);
});
