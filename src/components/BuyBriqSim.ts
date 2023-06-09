import { reactive } from 'vue';

class BriqFactory {
    private static readonly decimals = BigInt(10 ** 18);

    private static readonly inflectionPoint = BigInt(400000 * 10 ** 18);

    private static readonly slope = BigInt(1 * 10 ** 8);
    private static readonly rawFloor = BigInt(-1 * 10 ** 13);

    private static readonly lowerFloor = BigInt(1 * 10 ** 13);
    private static readonly lowerSlope = BigInt(5 * 10 ** 7);

    private static readonly decayPerSecond = BigInt(6337791082068820);
    private static readonly surgeSlope = BigInt(1 * 10 ** 8);
    private static readonly minimalSurge = BigInt(250000 * 10 ** 18);
    private static readonly surgeDecayPerSecond = BigInt(150 * 10**18);

    private lastStoredT: bigint;
    private lastPurchaseTime: bigint;
    private surgeT: bigint;

    constructor() {
        this.lastStoredT = BigInt('420000000000000000000000');
        this.lastPurchaseTime = BigInt(1686303989 * 1000);
        this.surgeT = BigInt(0);
    }

    setParams(t: string, surge_t: string) {
        this.lastStoredT = BigInt(t);
        this.surgeT = BigInt(surge_t);
    }

    private getBlockTimestamp(): bigint {
        // Here, replace with the actual way to get the blockchain timestamp
        return BigInt(Date.now());
    }

    private getCurrentT(): bigint {
        const t = this.lastStoredT;

        const timestamp = BigInt(Date.now());
        const timeSinceLastPurchase = timestamp - this.lastPurchaseTime;
        const decay = timeSinceLastPurchase * BriqFactory.decayPerSecond;

        return t <= decay ? BigInt(0) : t - decay;
    }

    private getSurgeT(): bigint {
        const t = this.surgeT;

        const timestamp = BigInt(Date.now());
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
            return BigInt(0);

        if (t2 >= BigInt(10 ** 30) || (t1 - t2) >= BigInt(10 ** 28))
            return BigInt(0);

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
            this.getLinIntegral(BriqFactory.slope, BriqFactory.rawFloor, BriqFactory.inflectionPoint, t + amount);
    }
}

export const briqFactory = reactive(new BriqFactory());
