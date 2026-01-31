const net = require('net');
const http = require('http');

const findAvailablePort = (startPort) => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                process.stdout.write(`Port ${startPort} busy, trying next...\n`);
                resolve(findAvailablePort(startPort + 1));
            } else {
                reject(err);
            }
        });
        server.listen(startPort, () => {
            server.close(() => {
                resolve(startPort);
            });
        });
    });
};

const main = async () => {
    console.log('--- Testing Port Logic ---');

    // 1. Start a dummy server on 5000 to block it
    const blocker = http.createServer((req, res) => res.end('Blocker'));
    blocker.listen(5000, async () => {
        console.log('Blocker running on 5000');

        // 2. Try to find port starting at 5000
        try {
            console.log('Searching for port starting 5000...');
            const port = await findAvailablePort(5000);
            console.log(`Found available port: ${port}`);

            if (port > 5000) {
                console.log('✅ PASS: Port fallback worked!');
            } else {
                console.log('❌ FAIL: Should have skipped 5000');
            }

            blocker.close();
            process.exit(0);
        } catch (err) {
            console.error('❌ ERROR:', err);
            blocker.close();
            process.exit(1);
        }
    });
};

main();
