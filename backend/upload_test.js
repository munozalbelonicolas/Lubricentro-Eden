const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

const form = new FormData();
form.append('name', 'Test Product');
form.append('category', 'aceite');
form.append('price', '1000');
form.append('images', fs.createReadStream('../frontend/public/aceite-premium.jpg'));

const request = http.request({
  method: 'POST',
  host: 'localhost',
  port: 5000,
  path: '/api/products',
  headers: form.getHeaders()
});

form.pipe(request);

request.on('response', (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});
request.on('error', console.error);
