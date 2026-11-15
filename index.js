'use strict';

const http = require('http');
const { Client } = require('pg');

// Unresolvable host. `.invalid` is a reserved TLD, so DNS fails and the
// process exits. A container or pod that requires this connection then fails.
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://app:app@unknown-db-source.invalid:5432/app';

const CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);
const PORT = Number(process.env.PORT || 3000);

function databaseHost(connectionString) {
  try {
    return new URL(connectionString).host;
  } catch {
    return 'unparseable-database-url';
  }
}

function fail(source, err) {
  console.error('database connection failed');
  console.error(`source: ${source}`);
  console.error(`code: ${err && err.code ? err.code : 'UNKNOWN'}`);
  console.error(err && err.message ? err.message : err);
  console.error('exiting so the container is marked failed');
  process.exit(1);
}

async function connect() {
  const source = databaseHost(DATABASE_URL);
  const client = new Client({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(
        `timed out after ${CONNECT_TIMEOUT_MS}ms contacting ${source}`
      );
      err.code = 'ETIMEDOUT';
      reject(err);
    }, CONNECT_TIMEOUT_MS);
  });

  try {
    await Promise.race([client.connect(), timeout]);
    await client.query('SELECT 1');
    clearTimeout(timer);
    console.log(`database connection established (${source})`);
    return client;
  } catch (err) {
    clearTimeout(timer);
    client.end().catch(() => {});
    fail(source, err);
  }
}

async function main() {
  const client = await connect();

  const server = http.createServer(async (req, res) => {
    try {
      const result = await client.query('SELECT 1 AS ok');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`ok ${result.rows[0].ok}\n`);
    } catch (err) {
      console.error('database query failed', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('database query failed\n');
    }
  });

  server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
  });
}

main().catch((err) => {
  fail(databaseHost(DATABASE_URL), err);
});
