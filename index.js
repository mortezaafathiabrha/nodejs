const http = require('http');
const fs = require('fs');

const PORT = 3000;
const currentDirectory = process.cwd();

function listDirectory(directory) {
  const files = [];
  const directories = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      directories.push(entry.name);
    } else if (entry.isFile()) {
      files.push(entry.name);
    }
  }

  files.sort();
  directories.sort();

  return { directory, files, directories };
}

const server = http.createServer((req, res) => {
  const body = JSON.stringify(listDirectory(currentDirectory));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(body + '\n');
});

console.log(`Current directory: ${currentDirectory}`);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
