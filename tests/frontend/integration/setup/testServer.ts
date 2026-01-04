import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3002;

export function getServerUrl(): string {
  return `http://localhost:${TEST_PORT}`;
}

export async function startServer(): Promise<ChildProcess> {
  const serverPath = path.join(__dirname, '../../../../src/backend/server.ts');

  const serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: 'pipe',
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      serverProcess.kill('SIGTERM');
      reject(new Error('Server failed to start within timeout'));
    }, 15000);

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server is running')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });

    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });

  return serverProcess;
}

export async function stopServer(serverProcess: ChildProcess): Promise<void> {
  if (!serverProcess) return;

  return new Promise((resolve) => {
    serverProcess.on('exit', () => {
      resolve();
    });

    serverProcess.kill('SIGTERM');

    // Force kill after 5 seconds if graceful shutdown fails
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}
