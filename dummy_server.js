const http = require('http');
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Server Stabilized! You can run unzip.php now.');
});
server.listen(process.env.PORT || 3000, () => {
  console.log('Dummy server running...');
});
