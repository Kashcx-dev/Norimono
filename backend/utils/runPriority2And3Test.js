// Start backend in-process and run priority 2 & 3 flow tests
const { server } = require('../src/main');
const path = require('path');

async function main() {
    await new Promise(r => setTimeout(r, 1200));

    try {
        const { spawn } = require('child_process');
        const child = spawn(process.execPath, [path.join(__dirname, 'testPriority2And3Flow.js')], {
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

