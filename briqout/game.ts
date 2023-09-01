import { projectSet } from './set_projection';

class Rectangle {
    x = 0;
    y = 0;
    width = 100;
    height = 20;
}

class Circle {
    x = 0;
    y = 0;
    radius = 10;
}

export interface BriqoutItem {
    id: number;
    readonly type: 'briq' | 'powerup' | 'ball';
}

export class BriqoutBall extends Circle implements BriqoutItem {
    id: number;
    type = 'ball' as const;

    x = 400;
    y = 200;
    radius = 10;

    isLaunching = false;

    velocity = 500;
    vX = 200.0;
    vY = 300.0;

    // True if we already hit a briq this tick, to avoid double-hits that would make the ball go through the briq.
    hitBriq = false;

    constructor(game: Game) {
        super();
        this.id = game.nextId++;
    }
}

export class BriqoutBriq extends Rectangle implements BriqoutItem {
    id: number;
    type = 'briq' as const;

    color = '#ff5500';

    constructor(game: Game) {
        super();
        this.id = game.nextId++;
    }
}

export class Powerup extends Circle implements BriqoutItem {
    id: number;
    type = 'powerup' as const;

    kind: 'multiball' | 'biggerpaddle' | 'metalballs';

    constructor(game: Game, kind: Powerup['kind']) {
        super();
        this.id = game.nextId++;
        this.kind = kind;
    }
}

/**
 * These are used for setup, so that users cannot just re-use someone else's replay.
 */
export interface SetupParams {
    migrator: string;
    currentBriqs: number;
    briqsToMigrate: number;
    setToMigrate: string;
}

export class Game {
    paddleX = 0.0;
    paddleWidth = 100;
    paddleActive = true; // Used when replaying.

    width = 1000;
    height = 600;

    TICK_LENGTH = 1/120.0;
    time = 0.0;

    status = 'pregame' as 'pregame' | 'running' | 'paused' | 'lost' | 'won';

    nextId = 1;

    balls = [] as BriqoutBall[];
    items = [] as BriqoutItem[];

    pendingEvents = [];
    gameTrace = [];

    powerups = {
        metalballs: 0,
    }

    randomSeed = 0;

    init() {}

    trace(event, time?: number) {
        event.time = time || this.time;
        // for stable sorting
        event.id = this.gameTrace.length;
        this.gameTrace.push(event);
    }

    pushEvent(event) {
        this.pendingEvents.push(event);
    }

    pollEvents() {
        if (this.status !== 'running') {
            this.pendingEvents = [];
            return;
        }
        for (const event of this.pendingEvents)
            if (event.type === 'mousemove')
                this.paddleX = event.x * this.width;
            else if (event.type === 'mouseup')
                for (const ball of this.balls)
                    ball.isLaunching = false;


        this.pendingEvents = [];
    }

    random() {
        let t = this.randomSeed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    update(delay: number) {
        if (this.status !== 'running')
            return { ticks: 0, events: [] };

        this.pollEvents();

        let turns = delay / this.TICK_LENGTH;
        if (turns < 1)
            return { ticks: 0, events: [] };
        const updateEvents = [];
        const ticks = Math.floor(turns);
        while (turns >= 1) {
            updateEvents.push(...this.tick());
            turns -= 1;
        }
        return { ticks, events: updateEvents };
    }

    tick() {
        if (this.status !== 'running')
            return [];

        const tickEvents = [];

        this.time += this.TICK_LENGTH;

        const ballsToDrop = [] as BriqoutBall[];
        const itemsToDrop = [] as BriqoutItem[];
        for (const ball of this.balls) {
            if (ball.isLaunching) {
                ball.x = this.paddleX;
                continue;
            }

            if (ball.x <= ball.radius) {
                ball.x = ball.radius;
                ball.vX *= -1;
                tickEvents.push({ type: 'wallTonk' });
            } else if (ball.x >= this.width - ball.radius) {
                ball.x = this.width - ball.radius;
                ball.vX *= -1;
                tickEvents.push({ type: 'wallTonk' });
            } else if (ball.y <= ball.radius) {
                ball.y = ball.radius;
                ball.vY *= -1;
                tickEvents.push({ type: 'wallTonk' });
            } else if (ball.y > this.height + ball.radius) {
                ballsToDrop.push(ball);
                this.paddleWidth = Math.max(this.paddleWidth - 50, 0);
                continue;
            } else if (this.paddleActive && ball.vY > 0 && checkBallPaddleCollision(ball, { x: this.paddleX, y: this.height - 20, width: this.paddleWidth, height: 20 })) {
                // Record the position of the paddle as a phantom move, assuming it was literally anywhere else any other time.
                this.trace({ type: 'activatepaddle' }, this.time - this.TICK_LENGTH / 2);
                this.trace({ type: 'mousemove', x: this.paddleX }, this.time - this.TICK_LENGTH / 2);
                // Record a trace for reproductions
                this.trace({ type: 'paddlebounce', x: ball.x, y: ball.y });
                this.trace({ type: 'shutdownpaddle' }, this.time + this.TICK_LENGTH / 3);

                tickEvents.push({ type: 'paddlebounce' });

                // Adjust velocity based on angle to center
                const angle = (ball.x - this.paddleX) / this.paddleWidth;
                //console.log("Angle:", angle, "cos", Math.cos(angle), "sin", Math.sin(angle));
                ball.vX = ball.velocity * Math.sin(angle);
                ball.vY = -ball.velocity * Math.cos(angle);
            } else
                for (const item of this.items) {
                    if (item.type !== 'briq')
                        continue;
                    const [coll, cx, cy] = checkBallBriqCollision(ball, item as BriqoutBriq);
                    if (coll) {
                        if (!ball.hitBriq && !this.powerups.metalballs) {
                            if (!cx) {
                                ball.vX *= -1;
                                ball.x += Math.sign(ball.vX) * 10;
                            }
                            if (!cy) {
                                ball.vY *= -1;
                                ball.y += Math.sign(ball.vY) * 10;
                            }
                            ball.hitBriq = true;
                        }
                        if (ball.velocity < 1000) {
                            ball.velocity += 10;
                            ball.radius += 0.2;
                        }
                        // Drop the briq from the lineup
                        itemsToDrop.push(item);
                        // Record a trace for reproduction
                        this.trace({ type: 'briqcollision', x: ball.x, y: ball.y });
                        tickEvents.push({ type: 'briqTonk' });
                    }
                }

        }

        this.balls = this.balls.filter(ball => !ballsToDrop.includes(ball));

        for (const ball of this.balls) {
            if (ball.isLaunching)
                continue;
            ball.x += ball.vX * this.TICK_LENGTH;
            ball.y += ball.vY * this.TICK_LENGTH;
            ball.hitBriq = false;
        }

        for (const kind of ['multiball', 'biggerpaddle', 'metalballs'] as const)
            this.maybeLaunchPowerup(kind);

        for (const item of this.items) {
            if (item.type !== 'powerup')
                continue;
            item.y += 200 * this.TICK_LENGTH;

            if (checkBallPaddleCollision(item as Powerup, { x: this.paddleX, y: this.height - 20, width: this.paddleWidth, height: 20 })) {

                this.trace({ type: 'activatepaddle' }, this.time - this.TICK_LENGTH / 2);
                this.trace({ type: 'mousemove', x: this.paddleX }, this.time - this.TICK_LENGTH / 2);
                this.trace({ type: 'powerupcollision', x: item.x, y: item.y, kind: (item as Powerup).kind });
                this.trace({ type: 'shutdownpaddle' }, this.time + this.TICK_LENGTH / 3);

                tickEvents.push({ type: 'powerup', kind: (item as Powerup).kind });

                this.triggerPowerup((item as Powerup).kind);

                itemsToDrop.push(item);
            }
        }
        this.items = this.items.filter(item => !itemsToDrop.includes(item));

        this.powerups.metalballs = Math.max(0, this.powerups.metalballs - this.TICK_LENGTH);

        if (this.balls.length === 0) {
            this.balls = [new BriqoutBall(this)];
            this.balls[0].isLaunching = true;
            this.balls[0].x = this.width / 2;
            this.balls[0].y = this.height - 30 - this.balls[0].radius;
        }

        if (!this.items.some(x => x.type === 'briq')) {
            this.trace({ type: 'won' });
            this.status = 'won';
        } else if (this.paddleWidth <= 0) {
            this.trace({ type: 'lost' });
            this.status = 'lost';
        }

        return tickEvents;
    }

    maybeLaunchPowerup(kind: Powerup['kind']) {
        if (kind === 'metalballs' && this.random() < 0.0015) {
            const powerup = new Powerup(this, kind);
            powerup.x = Math.random() * this.width;
            powerup.y = -50;
            powerup.radius = 25;
            this.items.push(powerup);
        } else if (kind === 'biggerpaddle' && this.random() < 0.001 && this.paddleWidth < 250) {
            const powerup = new Powerup(this, kind);
            powerup.x = Math.random() * this.width;
            powerup.y = -50;
            powerup.radius = 25;
            this.items.push(powerup);
        } else if (kind === 'multiball' && this.random() < 0.001) {
            const powerup = new Powerup(this, kind);
            powerup.x = Math.random() * this.width;
            powerup.y = -50;
            powerup.radius = 25;
            this.items.push(powerup);
        }
    }

    triggerPowerup(kind: Powerup['kind']) {
        if (kind === 'multiball') {
            const ball = new BriqoutBall(this);
            const r = this.random() * Math.PI / 2 + Math.PI / 4;
            ball.vX = Math.cos(r) * ball.velocity;
            ball.vY = -Math.sin(r) * ball.velocity;
            ball.x = this.random() * this.width;
            ball.y = this.random() * 200 + 50;
            this.balls.push(ball);
        } else if (kind === 'biggerpaddle')
            this.paddleWidth += 50;
        else if (kind === 'metalballs')
            this.powerups.metalballs += 2;
    }

    // All these parameters must be reconstructed identically (and assume trust)
    // for replayability.
    start(params: SetupParams, setBriqs?: unknown[]) {
        if (params.setToMigrate !== '0x0' && !setBriqs)
            throw new Error('setBriqs must be provided if setToMigrate is set');
        else if (params.setToMigrate === '0x0' && setBriqs)
            throw new Error('setToMigrate must be provided if setBriqs is set');

        this.pendingEvents = [];

        this.gameTrace = [];
        this.balls = [new BriqoutBall(this)];
        this.balls[0].isLaunching = true;

        this.paddleX = this.width / 2;
        this.paddleWidth = 100;
        this.balls[0].x = this.width / 2;
        this.balls[0].y = this.height - 30 - this.balls[0].radius;

        this.powerups.metalballs = 0;
        this.items = [];

        // Compute a random starting position for the ball based on the parameters.
        // TODO: do this
        // for convenience, emit setup params
        this.randomSeed = 20;
        this.trace({ type: 'setup', ...params });
        if (setBriqs) {
            const { size, briqs } = projectSet(setBriqs);

            const bsize = Math.min(this.width / (size[0] + 2), this.height * 0.7 / (size[1] + 2));

            for (const briq of briqs) {
                const briqObj = new BriqoutBriq(this);
                briqObj.x = briq[0] * (bsize + 2) + this.width / 2 - size[0] * bsize / 2;
                briqObj.y = briq[1] * (bsize + 2) + 20;
                briqObj.color = briq[2];
                briqObj.width = bsize;
                briqObj.height = bsize;
                this.items.push(briqObj);
            }
        } else
            for (let j = 0; j < 10; j++)
                for (let i = 0; i < this.width / 60 - 1; i++) {
                    const briq = new BriqoutBriq(this);
                    briq.x = i * 65 + 30 + (j % 2) * 15;
                    briq.y = 20 + 25 * j;
                    briq.width = 60;
                    this.items.push(briq);
                }

        this.status = 'running';
    }

    exportTrace() {
        const data = this.gameTrace.slice();
        // Sort by time, then ID for stability
        data.sort((a, b) => {
            if (a.time < b.time)
                return -1;
            if (a.time > b.time)
                return 1;
            if (a.id < b.id)
                return -1;
            if (a.id > b.id)
                return 1;
            return 0;
        });
        return data;
    }
}

function checkBallPaddleCollision(ball: Circle, square: Rectangle) {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    const squareLeft = square.x - square.width / 2;
    const squareRight = square.x + square.width / 2;
    const squareTop = square.y - square.height / 2;
    const squareBottom = square.y + square.height / 2;

    if (ballLeft < squareRight && ballRight > squareLeft && ballTop < squareBottom && ballBottom > squareTop)
        return true;

    return false;
}

function checkBallBriqCollision(ball: BriqoutBall, square: Rectangle) {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    const squareLeft = square.x - square.width / 2;
    const squareRight = square.x + square.width / 2;
    const squareTop = square.y - square.height / 2;
    const squareBottom = square.y + square.height / 2;

    // Determine if we should flip X and/or Y velocity for the ball.
    const collSide = ballLeft < squareRight && ballRight > squareLeft;
    const collTop = ballTop < squareBottom && ballBottom > squareTop;
    const lastcollSide = ballLeft - ball.vX < squareRight && ballRight - ball.vX > squareLeft;
    const lastcollTop = ballTop - ball.vY < squareBottom && ballBottom - ball.vY > squareTop;

    return [collSide && collTop, lastcollSide, lastcollTop];
}

function checkBallCircleCollision(ball: BriqoutBall, circle: Circle) {
    const dx = ball.x - circle.x;
    const dy = ball.y - circle.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSquared = (ball.radius + circle.radius) * (ball.radius + circle.radius);
    return distanceSquared < radiusSquared;
}

export function replay(trace: any[]) {
    const game = new Game();
    if (trace.length === 0)
        return false;
    game.start(trace[0]);

    let eventI = 0;
    while (game.status === 'running') {
        while (eventI < trace.length && trace[eventI].time <= game.time + game.TICK_LENGTH) {
            if (trace[eventI].type === 'mousemove')
                game.paddleX = trace[eventI].x;
            else if (trace[eventI].type === 'activatepaddle')
                game.paddleActive = true;
            else if (trace[eventI].type === 'shutdownpaddle')
                game.paddleActive = false;
            eventI++;
        }
        game.tick();
    }
    const replayTrace = game.exportTrace();
    // Compare both traces by hashing.
    const traceHash = trace.map(e => JSON.stringify(e)).join('');
    const replayHash = replayTrace.map(e => JSON.stringify(e)).join('');
    return traceHash === replayHash;
}
