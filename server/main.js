const http = require('http');

const hostname = 'localhost';
const port = 3001;

const starknet = require('starknet');
const { getSelectorFromName } = require('starknet/utils/stark');
const { toBN } = require('starknet/utils/number');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World!\n');
});

const https = require('https');

server.listen(port, hostname, async () => {
  console.log("Start");
  https.get({
    hostname: 'api.test.sltech.company',
    port: 443,
    path: '/store_get/0xf7917ffd99a249248695911e83c798e2',
  }, (resp) => {
    let data = '';
    console.log("go");
    
    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      console.log(JSON.parse(data));
    });

    resp.on('error', err => {
      console.log(err);
    })
  });
  let prov = starknet.defaultProvider;
  console.log(prov);
  console.log(getSelectorFromName("owner_of"))
  let call = prov.callContract({
    contract_address: "0x01618ffcb9f43bfd894eb4a176ce265323372bb4d833a77e20363180efca3a65",
    entry_point_selector: getSelectorFromName("owner_of"),
    calldata: [toBN("0xf7917ffd99a249248695911e83c798e2").toString()],
  })
  await call;
  console.log((await call).result);
});