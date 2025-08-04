const http = require("http");

const HOST = "192.168.0.3";
const PORT = 13030;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, this server is only accessible via 192.168.0.10!");
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
