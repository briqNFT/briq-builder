// eslint-disable-next-line @typescript-eslint/no-var-requires
import { createServer as createViteServer } from 'vite';
// Somehow didn't work if I just import above - some error when building.
import type { createServer, ViteDevServer } from 'vite';

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import connect from 'connect';

import { APP_ENV } from '@/Meta';

const DEV = process.env.NODE_ENV === 'development';

const config = {
    hostname: '0.0.0.0',
    port: DEV ? 3000 : 5000,
};

const __dirname = path.resolve();

// TODO: reduce duplication with frontend.
function getApiUrl(hostname: string | undefined) {
    if (!hostname || hostname.indexOf('localhost') !== -1)
        return 'localhost:5055';
    if (hostname.indexOf('test') !== -1)
        return 'api.test.sltech.company';
    if (hostname.indexOf('sltech.company') !== -1 || hostname.indexOf('briq.construction') !== -1)
        return 'api.briq.construction';
}

async function runServer() {
    const app = connect();
    let vite: undefined | ViteDevServer;
    let template: string;
    // In dev mode, run vite as a dev server middleware so that the frontend can be loaded as if running 'npm run dev'
    if (DEV) {
        vite = await (createViteServer as typeof createServer)({
            mode: 'development',
            server: { middlewareMode: 'ssr' },
        });
        app.use(vite.middlewares);

        // Load the raw index.html, to be transformed.
        template = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');
    }
    // Load the transformed dist/index.html
    else
        template = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');

    app.use(async (req: http.IncomingMessage, res) => {
        console.log('GET ', req.url);
        if (req.url === '/health') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('ok');
            return;
        }

        try {
            let processedTemplate = template;
            if (DEV)
                processedTemplate = await vite!.transformIndexHtml(req.url!, processedTemplate);

            if (req.url?.indexOf('/set') !== -1) {
                const url_parts = url.parse(req.url!, true);
                const relevant_part = url_parts.path?.slice(5);
                let data: any;
                try {
                    // Fetch information from the API.
                    const apiUrl = APP_ENV === 'prod' ? 'briq-api' : 'dev-briq-api';
                    data = await new Promise((resolve, reject) => {
                        try {
                            const query = http.request(
                                `http://${apiUrl}/v1/metadata/${relevant_part}.json`,
                                {
                                    port: 80,
                                    method: 'GET',
                                    // Low timeout, we don't want to be too reliant on the API
                                    timeout: 1000,
                                },
                                (resp) => {
                                    let data = '';
                                    // A chunk of data has been received.
                                    resp.on('data', (chunk) => {
                                        data += chunk;
                                    });

                                    // The whole response has been received. Print out the result.
                                    resp.on('end', () => {
                                        try {
                                            resolve(JSON.parse(data));
                                        } catch (err) {
                                            reject(err);
                                        }
                                    });

                                    resp.on('error', (err) => {
                                        reject(err);
                                    });
                                },
                            );
                            query.end();
                            query.on('error', (err) => {
                                reject(err);
                            });
                        } catch (err) {
                            reject(err);
                        }
                    });
                    const meta_start = processedTemplate.indexOf('<!--<meta-replace-start>-->');
                    const meta_end = processedTemplate.indexOf('<!--<meta-replace-end>-->');
                    processedTemplate =
                        processedTemplate.slice(0, meta_start) +
                        [
                            '<meta property="og:title" content="' + (data.name || data.id) + '">',
                            '<meta property="og:type" content="article" />',
                            '<meta property="og:description" content="Built with briqs">',
                            '<meta property="og:image" content="https://api.briq.construction/v1/preview/' + relevant_part + '.png">',
                            '<meta property="og:url" content="https://' + req.headers.host + req.url + '">',
                            '<meta name="twitter:card" content="summary_large_image">',
                        ].join('\n') +
                        processedTemplate.slice(meta_end);
                } catch (_) {
                    // Ignore error -> probably just a bad ID, will be handled by frontend.
                    // console.error(_);
                }
            } else if (req.url?.indexOf('/starknet_planet') !== -1)
                try {
                    const meta_start = processedTemplate.indexOf('<!--<meta-replace-start>-->');
                    const meta_end = processedTemplate.indexOf('<!--<meta-replace-end>-->');
                    processedTemplate =
                        processedTemplate.slice(0, meta_start) +
                        [
                            '<meta property="og:title" content="Starknet Planet - made with briq">',
                            '<meta property="og:type" content="article" />',
                            '<meta property="og:description" content="“A few briqs for a man, a giant leap for NFTs”. Get ready to build your first NFT collection, briq by briq.">',
                            '<meta property="og:image" content="https://api.briq.construction/v1/starknet-mainnet/starknet_planet/high/splash.jpg">',
                            '<meta property="og:url" content="https://briq.construction/product/starknet_planet">',
                            '<meta name="twitter:card" content="summary_large_image">',
                        ].join('\n') +
                        processedTemplate.slice(meta_end);
                } catch (_) {
                    // Ignore error -> probably just a bad ID, will be handled by frontend.
                    // console.error(_);
                }
            else if (req.url?.indexOf('/product/ducks_everywhere') !== -1)
                try {
                    const meta_start = processedTemplate.indexOf('<!--<meta-replace-start>-->');
                    const meta_end = processedTemplate.indexOf('<!--<meta-replace-end>-->');
                    processedTemplate =
                        processedTemplate.slice(0, meta_start) +
                        [
                            '<meta property="og:title" content="Ducks Everywhere - made with briq">',
                            '<meta property="og:type" content="article" />',
                            '<meta property="og:description" content="“Quack quack” - heard on Starknet, 2023">',
                            '<meta property="og:image" content="https://api.briq.construction/v1/starknet-mainnet/ducks_everywhere/high/splash.jpg">',
                            '<meta property="og:url" content="https://briq.construction/product/ducks_everywhere">',
                            '<meta name="twitter:card" content="summary_large_image">',
                        ].join('\n') +
                        processedTemplate.slice(meta_end);
                } catch (_) {
                    // Ignore error -> probably just a bad ID, will be handled by frontend.
                    // console.error(_);
                }


            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(processedTemplate);
        } catch (e: any) {
            // If an error is caught, let Vite fix the stracktrace so it maps back to
            // your actual source code.
            if (DEV && e instanceof Error)
                vite!.ssrFixStacktrace(e);
            console.error(e);
            res.statusCode = 500;
            res.end(e?.message || e?.toString() || 'Unknown error');
        }
    });

    app.listen(config.port, config.hostname, async () => {
        console.log('Starting briq-builder Node server on ', config.port, config.hostname);
    });
}
runServer();
