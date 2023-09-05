import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import cors from '@fastify/cors'
import { replay } from 'briqout';
import { ec, hash, num, json, Contract, encode, BigNumberish } from 'starknet';

function getBackendAddress() {
    return process.env.BACKEND_URL || 'http://localhost:5055';
}

const server: FastifyInstance = Fastify({})

server.get('/health', {}, async () => {
    return 'ok'
})

server.post('/verify_replay', {}, async (request, reply) => {
    const rq_json = JSON.parse(request.body);
    const trace = rq_json.trace;
    // Some early exits
    if (trace.length === 0)
        throw new Error('Empty trace');

    if (trace[0].type !== 'setup')
        throw new Error('Trace does not start with setup event');

    // Check it's a victory
    if (trace[trace.length - 1].type !== 'won')
        throw new Error('Trace does not end with victory event');


    const setup = trace[0];
    let setBriqs = undefined;
    if (setup.setToMigrate !== '0x0') {
        const backend = getBackendAddress();
        const briqs = (await (await fetch(`${backend}/v1/metadata/${rq_json.chain_id}/${setup.setToMigrate}.json`)).json()).briqs;
        setBriqs = briqs.map(x => ({ position: x.pos, color: x.data.color }));
    }

    if (!replay(trace, setBriqs))
        throw new Error('Replay is incorrect');

    const message = [
        // First item: the contract address of the migratoor
        setup.migrator,
        // Second item: the number of briqs before the migration (to avoid replay attacks)
        setup.currentBriqs,
        // Third item: the number of briqs to migrate
        setup.briqsToMigrate,
        // Fourth, optional item: the set to migrate.
        setup.setToMigrate,
    ];

    return {
        message,
        signature: sign(message),
    }
})

const sign = (message) => {
    const privateKey = '0x1234567890987654321';
    const msgHash = hash.computeHashOnElements(message);
    console.log('Signing:', msgHash, ec.starkCurve.getStarkKey(privateKey));
    const signature = ec.starkCurve.sign(msgHash, privateKey)
    return [encode.addHexPrefix(signature.r.toString(16)), encode.addHexPrefix(signature.s.toString(16))];
}

const start = async () => {
    await server.register(cors, {
        // put your options here
    })

    try {
        await server.listen({ port: 3000 });

        const address = server.server.address();
        const port = typeof address === 'string' ? address : address?.port;
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()
