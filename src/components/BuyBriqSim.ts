class BriqFactory {
    private static readonly decimals = BigInt(10 ** 18);
    private static readonly estimatedFairPrice = BigInt(5 * 10 ** 13);
    private static readonly slope = BigInt(5 * 10 ** 8);
    private static readonly inflectionPoint = BigInt(60000 * 10 ** 18);
    private static readonly rawFloor = BigInt(2 * 10 ** 13);
    private static readonly lowerFloor = BigInt(3 * 10 ** 13);
    private static readonly lowerSlope = BigInt(333333333);
    private static readonly decayPerSecond = BigInt(10 ** 10);
    private static readonly surgeSlope = BigInt(10 ** 14);
    private static readonly minimalSurge = BigInt(10000 * 10 ** 18);
    private static readonly surgeDecayPerSecond = BigInt(2315 * 10 ** 14);

    private lastStoredT: bigint;
    private lastPurchaseTime: bigint;
    private surgeT: bigint;

    constructor() {
        this.lastStoredT = BigInt(0);
        this.lastPurchaseTime = BigInt(0);
        this.surgeT = BigInt(0);
    }

    private getBlockTimestamp(): bigint {
        // Here, replace with the actual way to get the blockchain timestamp
        return BigInt(Date.now());
    }

    private getCurrentT(): bigint {
        const t = this.lastStoredT;
        const timestamp = this.getBlockTimestamp();
        const timeSinceLastPurchase = timestamp - this.lastPurchaseTime;
        const decay = timeSinceLastPurchase * BriqFactory.decayPerSecond;

        return t <= decay ? BigInt(0) : t - decay;
    }

    private getSurgeT(): bigint {
        const t = this.surgeT;
        const timestamp = this.getBlockTimestamp();
        const timeSinceLastPurchase = timestamp - this.lastPurchaseTime;
        const decay = timeSinceLastPurchase * BriqFactory.surgeDecayPerSecond;

        return t <= decay ? BigInt(0) : t - decay;
    }

    getSurgePrice(realAmnt: number): bigint {
        const amount = BigInt(realAmnt) * BriqFactory.decimals;
        const t = this.getSurgeT();
        const surgeMode = t + BigInt(amount) <= BriqFactory.minimalSurge;
        if (surgeMode)
            return BigInt(0);

        const fullSurge = t <= BriqFactory.minimalSurge;
        if (!fullSurge)
            return this.getLinIntegral(BriqFactory.surgeSlope, BigInt(0), t - BriqFactory.minimalSurge, t + amount - BriqFactory.minimalSurge);

        return this.getLinIntegral(BriqFactory.surgeSlope, BigInt(0), BigInt(0), t + amount - BriqFactory.minimalSurge);
    }

    getPrice(amount: number): bigint {
        const t = this.getCurrentT();
        const price = this.integrate(t, BigInt(amount) * BriqFactory.decimals);
        const surge = this.getSurgePrice(amount);
        return price + surge;
    }

    getPriceAfter(amount: number): bigint {
        const t = this.getCurrentT() + BigInt(amount) * BriqFactory.decimals;
        const price = this.integrate(t, BigInt(1) * BriqFactory.decimals);
        return price;
    }

    private getLinIntegral(slope: bigint, floor: bigint, t2: bigint, t1: bigint): bigint {
        if (t2 >= t1)
            throw new Error('t2 must be less than t1');

        if (t2 >= BigInt(10 ** 30) || (t1 - t2) >= BigInt(10 ** 28))
            throw new Error('briq machine broke above 10^12 bricks of demand.');


        const aInterm = slope * (t1 + t2);
        const aIntermDivided = aInterm / BriqFactory.decimals;
        const aIntermFinal = aIntermDivided * (t1 - t2);
        const aIntermFinalDivided = aIntermFinal / BriqFactory.decimals;
        const finalAInterm = aIntermFinalDivided / BigInt(2);
        const floorFinal = (floor * (t1 - t2)) / BriqFactory.decimals;
        const intermValue = finalAInterm + floorFinal;

        return intermValue;
    }

    private integrate(t: bigint, amount: bigint): bigint {
        if (t + amount <= BriqFactory.inflectionPoint)
            return this.getLinIntegral(BriqFactory.lowerSlope, BriqFactory.lowerFloor, t, t + amount);

        if (BriqFactory.inflectionPoint <= t)
            return this.getLinIntegral(BriqFactory.slope, BriqFactory.rawFloor, t, t + amount);


        return this.getLinIntegral(BriqFactory.lowerSlope, BriqFactory.lowerFloor, t, BriqFactory.inflectionPoint) +
            this.getLinIntegral(BriqFactory.slope, BriqFactory.rawFloor, BriqFactory.inflectionPoint, t + amount - BriqFactory.inflectionPoint);
    }
}

export const briqFactory = new BriqFactory();
