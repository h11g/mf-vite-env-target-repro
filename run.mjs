import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';

// Serve the remote entry over HTTP, as a real remote would be.
const remoteEntry = readFileSync(new URL('./remote/remoteEntry.js', import.meta.url));
let requests = 0;
const server = createServer((req, res) => {
  requests++;
  res.setHeader('content-type', 'text/javascript');
  res.end(remoteEntry);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const entry = `http://127.0.0.1:${server.address().port}/remoteEntry.js`;

const dir = new URL('./dist/server/assets/', import.meta.url);
const file = readdirSync(dir).find((f) => f.endsWith('.js'));
const { render } = await import(new URL(file, dir));

try {
  console.log('OK:', await render(entry));
} catch (e) {
  console.log('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  console.log('remote entry requests:', requests);
  server.close();
}
