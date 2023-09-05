interface Briq {
    position: [number, number, number];
    color: string;
}

export function projectSet(briqs: Briq[]) {
    let x0: number, x1: number, y0: number, y1: number, z0: number, z1: number;
    x1 = y1 = z1 = -Infinity;
    x0 = y0 = z0 = Infinity;

    for (const briq of briqs) {
        [x0, x1] = [Math.min(x0, briq.position[0]), Math.max(x1, briq.position[0])];
        [y0, y1] = [Math.min(y0, briq.position[1]), Math.max(y1, briq.position[1])];
        [z0, z1] = [Math.min(z0, briq.position[2]), Math.max(z1, briq.position[2])];
    }

    const sizes = [x1 - x0, y1 - y0, z1 - z0];

    let x_axis = 0;
    let y_axis = 1;
    if (sizes[0] < sizes[1] && sizes[0] < sizes[2]) {
        x_axis = 2;
        x0 = z0;
    }
    if (sizes[1] < sizes[0] && sizes[1] < sizes[2]) {
        y_axis = 2;
        y0 = z0;
    }

    const output = [];
    for (const briq of briqs) {
        const col = briq.color;
        const x = briq.position[x_axis];
        const y = briq.position[y_axis];
        // Flip Y and normalise to 0.
        output.push([x - x0, sizes[y_axis] - (y - y0), col]);
    }
    return {
        size: [sizes[x_axis], sizes[y_axis]] as const,
        briqs: output,
    };
}