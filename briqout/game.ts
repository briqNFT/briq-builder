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

    isLaunching = BallLaunch.LAUNCHED;

    velocity = 500;
    vX = 0.0;
    vY = -500.0;

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

export enum BallLaunch {
    LOCKED,
    LAUNCHING,
    LAUNCHED,
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
    storePaddlePos = false;

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
                this.paddleX += event.x / 2;
            else if (event.type === 'mouseup') {
                this.storePaddlePos = true;
                this.trace({ type: 'launchBall' }, this.time + this.TICK_LENGTH / 2);
                for (const ball of this.balls)
                    ball.isLaunching = BallLaunch.LAUNCHING;
            }


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

        let turns = delay / this.TICK_LENGTH;
        if (turns < 1)
            return { ticks: 0, events: [] };

        this.storePaddlePos = false;
        this.pollEvents();

        const updateEvents = [];
        const ticks = Math.floor(turns);

        while (turns >= 1) {
            const initX = this.paddleX;
            const initTime = this.time;

            updateEvents.push(...this.tick());
            turns -= 1;

            if (this.storePaddlePos)
                this.trace({ type: 'mouseMoveTo', x: initX }, initTime - this.TICK_LENGTH * 0.8);
            this.storePaddlePos = false;
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
            if (ball.isLaunching === BallLaunch.LOCKED) {
                ball.x = this.paddleX;
                continue;
            } else if (ball.isLaunching === BallLaunch.LAUNCHING) {
                ball.x = this.paddleX;
                ball.isLaunching = BallLaunch.LAUNCHED;
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
                tickEvents.push({ type: 'ballLost' });
                continue;
            } else if (this.paddleActive && ball.vY > 0 && checkBallPaddleCollision(ball, { x: this.paddleX, y: this.height - 20, width: this.paddleWidth, height: 20 })) {
                this.storePaddlePos = true;
                this.trace({ type: 'activatepaddle' }, this.time - this.TICK_LENGTH / 2);
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
                    const coll = checkBallBriqCollision(ball, item as BriqoutBriq);
                    if (coll !== CollisionSide.None) {
                        if (!ball.hitBriq && !this.powerups.metalballs) {
                            if (coll === CollisionSide.Horiz)
                                ball.vX *= -1;

                            if (coll === CollisionSide.Vert)
                                ball.vY *= -1;

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
                        tickEvents.push({ type: 'briqTonk', x: ball.x, y: ball.y });
                    }
                }

        }

        this.balls = this.balls.filter(ball => !ballsToDrop.includes(ball));

        for (const ball of this.balls) {
            if (ball.isLaunching !== BallLaunch.LAUNCHED)
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

            if (this.paddleActive && checkBallPaddleCollision(item as Powerup, { x: this.paddleX, y: this.height - 20, width: this.paddleWidth, height: 20 })) {

                this.storePaddlePos = true;
                this.trace({ type: 'activatepaddle' }, this.time - this.TICK_LENGTH / 2);
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
            this.paddleWidth = Math.max(this.paddleWidth - 25, 0);
            this.balls = [new BriqoutBall(this)];
            this.balls[0].isLaunching = BallLaunch.LOCKED;
            this.balls[0].x = this.width / 2;
            this.balls[0].y = this.height - 30 - this.balls[0].radius;
        } else
            this.paddleWidth = Math.max(this.paddleWidth, 25);


        if (!this.items.some(x => x.type === 'briq')) {
            this.trace({ type: 'won' });
            this.status = 'won';
            tickEvents.push({ type: 'won' });
        } else if (this.paddleWidth <= 0) {
            this.trace({ type: 'lost' });
            this.status = 'lost';
            tickEvents.push({ type: 'lost' });
        }

        return tickEvents;
    }

    maybeLaunchPowerup(kind: Powerup['kind']) {
        if (kind === 'metalballs' && this.random() < 0.0015) {
            const powerup = new Powerup(this, kind);
            powerup.x = this.random() * this.width;
            powerup.y = -50;
            powerup.radius = 25;
            this.items.push(powerup);
            this.trace({ type: 'powerupspawn', x: powerup.x, y: powerup.y, kind: 'metalballs' });
        } else if (kind === 'biggerpaddle' && this.random() < 0.002 && this.paddleWidth <= 175) {
            const powerup = new Powerup(this, kind);
            powerup.x = this.random() * this.width;
            powerup.y = -50;
            powerup.radius = 25;
            this.items.push(powerup);
            this.trace({ type: 'powerupspawn', x: powerup.x, y: powerup.y, kind: 'biggerpaddle' });
        } else if (kind === 'multiball' && this.random() < 0.001) {
            const powerup = new Powerup(this, kind);
            powerup.x = this.random() * this.width;
            powerup.y = -50;
            powerup.radius = 25;
            this.items.push(powerup);
            this.trace({ type: 'powerupspawn', x: powerup.x, y: powerup.y, kind: 'multiball' });
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
            this.paddleWidth += 25;
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

        this.time = 0;
        this.nextId = 1;

        this.gameTrace = [];
        this.balls = [new BriqoutBall(this)];
        this.balls[0].isLaunching = BallLaunch.LOCKED;

        this.paddleX = this.width / 2.0;
        this.paddleWidth = 100;
        this.balls[0].x = this.width / 2;
        this.balls[0].y = this.height - 30 - this.balls[0].radius;

        this.powerups.metalballs = 10000;
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
                    briq.x = i * 65 + 7 + (j % 2) * 15;
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

/*
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
}*/

enum CollisionSide {
    None,
    Vert,
    Horiz,
}

function checkBallBriqCollision(ball: BriqoutBall, rect: Rectangle): CollisionSide {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    const rectLeft = rect.x - rect.width / 2;
    const rectRight = rect.x + rect.width / 2;
    const rectTop = rect.y - rect.height / 2;
    const rectBottom = rect.y + rect.height / 2;

    // Bounding box check
    if (ballRight < rectLeft || ballLeft > rectRight || ballBottom < rectTop || ballTop > rectBottom)
        return CollisionSide.None;


    // Determine which side of the rectangle the ball hit
    if (ball.y < rectTop && ball.x >= rectLeft && ball.x <= rectRight)
        return CollisionSide.Vert;
    if (ball.y > rectBottom && ball.x >= rectLeft && ball.x <= rectRight)
        return CollisionSide.Vert;
    if (ball.x < rectLeft && ball.y >= rectTop && ball.y <= rectBottom)
        return CollisionSide.Horiz;
    if (ball.x > rectRight && ball.y >= rectTop && ball.y <= rectBottom)
        return CollisionSide.Horiz;

    return CollisionSide.None;
}

function checkBallCircleCollision(ball: BriqoutBall, circle: Circle) {
    const dx = ball.x - circle.x;
    const dy = ball.y - circle.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSquared = (ball.radius + circle.radius) * (ball.radius + circle.radius);
    return distanceSquared < radiusSquared;
}

/**
 * Validates that a game matches a replay trace.
 * @param trace - the trace to replay against
 * @param setBriqs - if the trace is a set replay, this is needed - the same data as the generating trace must be passed.
 */
export function replay(trace: any[], setBriqs?: unknown[]) {
    const game = new Game();
    if (trace.length === 0)
        return false;
    game.start(trace[0], setBriqs);

    let eventI = 0;
    while (game.status === 'running' && game.time <= trace[trace.length - 1].time) {
        game.storePaddlePos = false;
        const initX = game.paddleX;
        const initTime = game.time;
        while (eventI < trace.length && trace[eventI].time < game.time + game.TICK_LENGTH) {
            if (trace[eventI].type === 'mouseMoveTo')
                game.paddleX = trace[eventI].x;
            else if (trace[eventI].type === 'activatepaddle')
                game.paddleActive = true;
            else if (trace[eventI].type === 'shutdownpaddle')
                game.paddleActive = false;
            else if (trace[eventI].type === 'launchBall') {
                game.storePaddlePos = true;
                game.trace({ type: 'launchBall' }, game.time + game.TICK_LENGTH / 2);
                for (const ball of game.balls) {
                    ball.isLaunching = BallLaunch.LAUNCHED;
                    ball.x = game.paddleX;
                }
            }
            eventI++;
        }
        game.tick();
        if (game.storePaddlePos)
            game.trace({ type: 'mouseMoveTo', x: initX }, initTime - game.TICK_LENGTH * 0.8);
    }
    const replayTrace = game.exportTrace();
    // Compare both traces.
    // Have to round a little because of floating point errors.
    // (this is mega ugly).
    if (trace.length !== replayTrace.length)
        return false;
    for (let i = 0; i < Math.min(trace.length, replayTrace.length); i++) {
        const a = trace[i];
        const b = replayTrace[i];
        if (a.type !== b.type)
            return false;
        if (Math.round(a.time * 100) !== Math.round(b.time * 100))
            return false;
        if (a.type === 'briqcollision' || a.type === 'paddlebounce') {
            if (Math.round(a.x * 100) !== Math.round(b.x * 100))
                return false;
            if (Math.round(a.y * 100) !== Math.round(b.y * 100))
                return false;
        }
    }
    return true;
}
