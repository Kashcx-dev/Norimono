// Start backend in-process and run priority 1 flow tests
const { server } = require('../src/main');
const path = require('path');

async function main() {
    // Wait for server to bind
    await new Promise(r => setTimeout(r, 1200));

    try {
        // Run testPriority1Flow
        const { spawn } = require('child_process');
        const child = spawn(process.execPath, [path.join(__dirname, 'testPriority1Flow.js')], {
            stdio: 'inherit'
        });

        child.on('exit', (code) => {
            console.log(`\nTest process exited with code ${code}`);
            server.close(() => {
                process.exit(code);
            });
        });
    } catch (err) {
        console.error("Test runner error:", err);
        server.close(() => process.exit(1));
    }
}

main();

