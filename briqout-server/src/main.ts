import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import cors from '@fastify/cors'
import { replay } from 'briqout';
import { ec, hash, num, json, Contract, encode, BigNumberish } from "starknet";

const server: FastifyInstance = Fastify({})

server.get('/health', {}, async () => {
    return 'ok'
})

server.post('/verify_replay', {}, async (request, reply) => {
    const trace = JSON.parse(request.body).trace;
    // Some early exits
    if (trace.length === 0) {
        throw new Error('Empty trace');
    }
    if (trace[0].type !== 'setup') {
        throw new Error('Trace does not start with setup event');
    }
    // Check it's a victory
    if (trace[trace.length - 1].type !== 'won') {
        throw new Error('Trace does not end with victory event');
    }

    const setup = trace[0];
    const message = [
        // First item: the contract address of the migratoor
        hash.computeHashOnElements([setup.migrator]),
        // Second item: the number of briqs before the migration (to avoid replay attacks)
        hash.computeHashOnElements([setup.currentBriqs]),
        // Third item: the number of briqs to migrate
        hash.computeHashOnElements([setup.briqsToMigrate]),
        // Fourth, optional item: the set to migrate.
        hash.computeHashOnElements([setup.setToMigrate]),
    ];

    if (!replay(trace)) {
        throw new Error('Replay is incorrect');
    }

    return {
        message,
        signature: sign(message),
    }
})

const sign = (message) => {
    const privateKey = "0x1234567890987654321";
    const starknetPublicKey = ec.starkCurve.getStarkKey(privateKey);
    const fullPublicKey = encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false)));

    const msgHash = hash.computeHashOnElements(message);
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
