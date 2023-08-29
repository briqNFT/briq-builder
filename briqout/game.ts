class Rectangle {
    x = 0;
    y = 0;
    width = 50;
    height = 20;
}

export class BriqoutBriq extends Rectangle {
    id: number;
}

export class BriqoutBall {
    x = 400;
    y = 200;
    radius = 10;

    vX = 200.0;
    vY = 300.0;
}


export class Game {
    paddleX = 0.0;

    width = 1000;
    height = 600;

    status = 'pregame' as 'pregame' | 'running' | 'paused' | 'lost' | 'won';

    ball = new BriqoutBall();

    items = [] as Rectangle[];

    pendingEvents = [];
    gameTrace = [];

    init() {}

    pushEvent(event) {
        this.pendingEvents.push(event);
    }

    pollEvents() {
        for (const event of this.pendingEvents) {
            if (event.type === 'mousemove') {
                this.paddleX = event.x - 50;
            }
        }
    }

    update(delay: number) {
        if (this.status !== 'running') {
            return;
        }
        this.pollEvents();

        if (this.ball.x <= this.ball.radius) {
            this.ball.x = this.ball.radius;
            this.ball.vX *= -1;
        }
        else if (this.ball.x >= this.width - this.ball.radius) {
            this.ball.x = this.width - this.ball.radius;
            this.ball.vX *= -1;
        }
        else if (this.ball.y <= this.ball.radius) {
            this.ball.y = this.ball.radius;
            this.ball.vY *= -1;
        }
        else if (this.ball.y > this.height - this.ball.radius) {
            this.status = 'lost';
            return;
        }
        else if (checkBallPaddleCollision(this.ball, { x: this.paddleX, y: this.height - 20, width: 100, height: 20 })) {
            // Record the position of the paddle as a phantom move, assuming it was literally anywhere else any other time.
            this.gameTrace.push({ type: "mousemove", x: this.paddleX });
            // Record a trace for reproduction
            this.gameTrace.push({ type: "paddlebounce", x: this.ball.x, y: this.ball.y });
            // Adjust velocity based on angle to center
            const angle = (this.ball.x - this.paddleX) / 50;
            this.ball.y = this.height - 30 - this.ball.radius;
            this.ball.vX = 300 * angle;
            this.ball.vY = -300;
        }
        else {
            let drop = [];
            for (const item of this.items) {
                if (checkBallBriqCollision(this.ball, item)) {
                    this.ball.vY *= -1;
                    this.ball.vX *= -1;
                    // Drop the briq from the lineup
                    drop.push(item);
                    // Record a trace for reproduction
                    this.gameTrace.push({ type: "briqcollision", x: this.ball.x, y: this.ball.y });
                }
            }
            this.items = this.items.filter(item => !drop.includes(item));
        }

        this.ball.x += this.ball.vX * delay;
        this.ball.y += this.ball.vY * delay;
    }

    setup() {
        this.ball = new BriqoutBall();
        for (let i = 0; i < this.width / 55; i++)
        {
            const briq = new BriqoutBriq();
            briq.id = i;
            briq.x = i * 55 + 27;
            briq.y = 20;
            this.items.push(briq);
        }
    }

    start() {
        this.setup();
        this.status = 'running';
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

    if (ballLeft < squareRight && ballRight > squareLeft && ballTop < squareBottom && ballBottom > squareTop) {
        return true;
    }
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

    if (ballLeft < squareRight && ballRight > squareLeft && ballTop < squareBottom && ballBottom > squareTop) {
        return true;
    }
    return false;
}