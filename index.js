const http = require('http');

const PORT = 3000;
const TEST_ENV = process.env.TEST_ENV || 'Morteza';

const server = http.createServer((req, res) => {
  const body = JSON.stringify({ TEST_ENV });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(body + '\n');
});

console.log(`TEST_ENV=${TEST_ENV}`);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
