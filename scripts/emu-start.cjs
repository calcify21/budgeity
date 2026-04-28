const { execSync, spawn } = require('child_process');

/**
 * This script clears the Firebase emulator port (8085) and starts the emulators.
 * It's cross-platform (Windows/Unix) and handles process killing robustly.
 */
async function start() {
  const isWin = process.platform === 'win32';
  const port = '8085';

  console.log(`[Emulator] Checking for ghost processes on port ${port}...`);

  try {
    if (isWin) {
      // On Windows, use netstat to find the PID
      const out = execSync('netstat -ano').toString();
      const lines = out.split('\n');
      lines.forEach(l => {
        if (l.includes(`:${port}`)) {
          const parts = l.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid) && pid !== '0') {
            try {
              process.kill(pid, 'SIGKILL');
              console.log(`[Emulator] Killed ghost process ${pid} on port ${port}`);
            } catch (e) {
              // Process might already be gone
            }
          }
        }
      });
    } else {
      // On Unix, use lsof
      try {
        const pids = execSync(`lsof -t -i:${port}`).toString().split('\n');
        pids.forEach(pid => {
          const trimmedPid = pid.trim();
          if (trimmedPid && !isNaN(trimmedPid)) {
            try {
              process.kill(trimmedPid, 'SIGKILL');
              console.log(`[Emulator] Killed ghost process ${trimmedPid} on port ${port}`);
            } catch (e) {}
          }
        });
      } catch (e) {}
    }
  } catch (e) {
    // Ignore errors from netstat/lsof if they return nothing
  }

  console.log('[Emulator] Starting Firebase emulators...');
  
  // Use spawn to inherit stdio and pass control to firebase.
  // Using shell: true to ensure 'npx' is found correctly on Windows.
  const firebase = spawn('npx', [
    'firebase', 
    'emulators:start', 
    '--import=./emulator-data', 
    '--export-on-exit'
  ], {
    stdio: 'inherit',
    shell: true
  });

  firebase.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle termination signals
  const cleanup = () => {
    firebase.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start().catch(err => {
  console.error('[Emulator] Fatal error:', err);
  process.exit(1);
});
