import * as http from 'http';
import { TorusKnotBufferGeometry } from 'three';

const hostname = '0.0.0.0';
const port = process.env.NODE_ENV === 'development' ? 3000 : 5000;

const starknet = require('starknet');
const { getSelectorFromName } = require('starknet/utils/stark');
const { toBN } = require('starknet/utils/number');

const { createServer: createViteServer } = require('vite');

import type { createServer, ViteDevServer } from 'vite';

const fs = require('fs');
const path = require('path');
var vite: ViteDevServer;

const https = require('https');

import * as url from 'url';

var connect = require('connect');
var app = connect();
http.createServer(app);

console.log("ENV is ", process.env.NODE_ENV);

var toto = async function() {
    vite = await (createViteServer as typeof createServer)({ mode: 'development', server: { middlewareMode: 'ssr' } });

    
    let template: string;
    if (process.env.NODE_ENV === 'development')
    {
        app.use(vite.middlewares)

        template = fs.readFileSync(
            path.resolve(__dirname, '../../index.html'),
            'utf-8'
        );
    }
    else
        template = fs.readFileSync(
            path.resolve(__dirname, '../index.html'),
            'utf-8'
        );

    app.use(async (req: http.IncomingMessage, res) => {

        console.log("REQUEST");
        console.log(req.url);

        if (req.url === '/health')
        {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end("ok");
            return
        }
    
        try
        {
            let processedTemplate = template;
            if (process.env.NODE_ENV === 'development')
                processedTemplate = await vite.transformIndexHtml(req.url!, processedTemplate);

            if (req.url?.indexOf('/share') !== -1)
            {
                let url_parts = url.parse(req.url!, true);
                let setId = url_parts.query["set_id"]

                let data: any;
                try {
                    data = await new Promise((res, err) => {
                        try
                        {
                            let query = https.request({
                                hostname: 'api.' + req.headers.host,
                                port: 443,
                                method: 'GET',
                                path: '/store_get/' + setId,
                            }, (resp) => {
                                let data = '';

                                // A chunk of data has been received.
                                resp.on('data', (chunk) => {
                                    data += chunk;
                                });
                                
                                // The whole response has been received. Print out the result.
                                resp.on('end', () => {
                                    res(JSON.parse(data));
                                });
                                
                                resp.on('error', err => {
                                    err();
                                })
                            });
                            query.end();
                            query.on('error', () => err());
                        }
                        catch(_) { err(); }
                    })
                    processedTemplate = processedTemplate.replace("<!--<meta-replace>-->",[
                        '<meta property="og:title" content="' + (data.data.name || data.data.id) + '">',
                        '<meta property="og:type" content="article" />',
                        '<meta property="og:description" content="Built with briqs">',
                        '<meta property="og:image" content="https://api.' + req.headers.host + '/preview/' + setId + '">',
                        '<meta property="og:url" content="https://' + req.headers.host + req.url + '">',
                        '<meta name="twitter:card" content="summary_large_image">',
                    ].join("\n"))
                }
                catch (_)
                {
                    // Ignore error -> probably just a bad ID, will be handled by frontend.
                }
            }
    
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(processedTemplate);
        } catch (e: any) {
            // If an error is caught, let Vite fix the stracktrace so it maps back to
            // your actual source code.
            if (e instanceof Error)
                vite.ssrFixStacktrace(e)
            console.error(e)
            res.statusCode = 500;
            res.end(e?.message || e?.toString() || "Unknown error");
        }
    });

    app.listen(port, hostname, async () => {
        console.log("Start");

        /*
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
        */
    });
}
toto();
