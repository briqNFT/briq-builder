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

interface BriqoutItem {
    id: number;
    readonly type: 'briq' | 'powerup' | 'ball';
}

export class BriqoutBall extends Circle implements BriqoutItem {
    id: number;
    type = 'ball' as const;

    x = 400;
    y = 200;
    radius = 10;

    velocity = 800;
    vX = 200.0;
    vY = 300.0;

    constructor(game: Game) {
        super();
        this.id = game.nextId++;
    }
}

export class BriqoutBriq extends Rectangle implements BriqoutItem {
    id: number;
    type = 'briq' as const;

    constructor(game: Game) {
        super();
        this.id = game.nextId++;
    }
}

export class Powerup extends Circle implements BriqoutItem {
    id: number;
    type = 'powerup' as const;

    constructor(game: Game) {
        super();
        this.id = game.nextId++;
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

    init() {}

    trace(event, time = undefined) {
        event.time = time || this.time;
        // for stable sorting
        event.id = this.gameTrace.length;
        this.gameTrace.push(event);
    }

    pushEvent(event) {
        this.pendingEvents.push(event);
    }

    pollEvents() {
        for (const event of this.pendingEvents)
            if (event.type === 'mousemove')
                this.paddleX = event.x * this.width;


        this.pendingEvents = [];
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
        for (const ball of this.balls)
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
                continue;
            } else if (this.paddleActive && ball.vY > 0 && checkBallPaddleCollision(ball, { x: this.paddleX, y: this.height - 20, width: 100, height: 20 })) {
                // Record the position of the paddle as a phantom move, assuming it was literally anywhere else any other time.
                this.trace({ type: 'activatepaddle' }, this.time - this.TICK_LENGTH / 2);
                this.trace({ type: 'mousemove', x: this.paddleX }, this.time - this.TICK_LENGTH / 2);
                // Record a trace for reproductions
                this.trace({ type: 'paddlebounce', x: ball.x, y: ball.y });
                this.trace({ type: 'shutdownpaddle' }, this.time + this.TICK_LENGTH / 3);

                tickEvents.push({ type: 'paddlebounce' });

                // Adjust velocity based on angle to center
                const angle = (ball.x - this.paddleX) / 100;
                //console.log("Angle:", angle, "cos", Math.cos(angle), "sin", Math.sin(angle));
                ball.vX = ball.velocity * Math.sin(angle);
                ball.vY = -ball.velocity * Math.cos(angle);
            } else {
                const drop = [];
                for (const item of this.items)
                    if (item.type === 'powerup') {
                        if (checkBallCircleCollision(ball, item as Powerup)) {
                            this.trace({ type: 'powerupcollision', x: ball.x, y: ball.y });
                            tickEvents.push({ type: 'powerup' });

                            {
                                const ball = new BriqoutBall(this);
                                const r = Math.random();
                                ball.vX = Math.cos(r) * ball.velocity;
                                ball.vY = Math.sin(r) * ball.velocity;
                                ball.x = Math.random() * this.width;
                                ball.y = Math.random() * 200 + 50;
                                this.balls.push(ball);
                            }
                            {
                                const ball = new BriqoutBall(this);
                                const r = Math.random();
                                ball.vX = Math.cos(r) * ball.velocity;
                                ball.vY = Math.sin(r) * ball.velocity;
                                ball.x = Math.random() * this.width;
                                ball.y = Math.random() * 200 + 50;
                                this.balls.push(ball);
                            }

                            drop.push(item);
                        }
                    } else
                        if (checkBallBriqCollision(ball, item as BriqoutBriq)) {
                            ball.vY *= -1;
                            ball.velocity *= 1.05;
                            // Drop the briq from the lineup
                            drop.push(item);
                            // Record a trace for reproduction
                            this.trace({ type: 'briqcollision', x: ball.x, y: ball.y });
                            tickEvents.push({ type: 'briqTonk' });
                        }


                this.items = this.items.filter(item => !drop.includes(item));
            }

        this.balls = this.balls.filter(ball => !ballsToDrop.includes(ball));

        for (const ball of this.balls) {
            ball.x += ball.vX * this.TICK_LENGTH;
            ball.y += ball.vY * this.TICK_LENGTH;
        }

        if (this.items.length === 0) {
            this.trace({ type: 'won' });
            this.status = 'won';
        } else if (this.balls.length === 0) {
            this.trace({ type: 'lost' });
            this.status = 'lost';
        }

        return tickEvents;
    }

    start(params: SetupParams) {
        this.gameTrace = [];
        this.balls = [new BriqoutBall(this)];
        // Compute a random starting position for the ball based on the parameters.
        // TODO: do this
        // for convenience, emit setup params
        this.trace({ type: 'setup', ...params });
        for (let i = 0; i < this.width / 105 - 1; i++) {
            const briq = new BriqoutBriq(this);
            briq.x = i * 105 + 52;
            briq.y = 20;
            this.items.push(briq);
        }
        const powerup = new Powerup(this);
        powerup.x = 600;
        powerup.y = 200;
        powerup.radius = 25;
        this.items.push(powerup);
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

function checkBallPaddleCollision(ball: BriqoutBall, square: Rectangle) {
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

    if (ballLeft < squareRight && ballRight > squareLeft && ballTop < squareBottom && ballBottom > squareTop)
        return true;

    return false;
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
