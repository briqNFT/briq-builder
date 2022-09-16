import { THREE } from '@/three';

export class ShaderGrid {
    grid!: THREE.Object3D;
    generate() {
        const size = 128;
        const gridData = new Uint8Array(size * size);
        for (let x = 0; x < size; x++)
            for (let y = 0; y < size; y++)
                if (x === 0 || x === size - 1 || y === 0 || y === size - 1)
                    gridData[x * size + y] = 255;
                else
                    gridData[x * size + y] = 0;
        const gridTex = new THREE.DataTexture(gridData, size, size, THREE.RedFormat);
        gridTex.needsUpdate = true;
        gridTex.magFilter = THREE.NearestFilter;
        gridTex.minFilter = THREE.NearestMipmapLinearFilter;
        gridTex.anisotropy = 2;
        gridTex.wrapS = THREE.RepeatWrapping;
        gridTex.wrapT = THREE.RepeatWrapping;
        gridTex.generateMipmaps = true;
        const material = new THREE.ShaderMaterial( {
            uniforms: {
                size: { value: new THREE.Vector2(0, 0) },
                color: { value: new THREE.Vector3(0.521, 0.0561, 0) },
                tex: { value: gridTex },
            },
            vertexShader: `
            varying vec3 pos;
            varying vec2 tc;
            uniform vec2 size;
            attribute vec2 uv2;
            void main() {
                tc = uv;
                pos = position + vec3(size.x * uv2.x, 0.0, size.y * uv2.y);
                vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * modelViewPosition; 
            }
            `,
            fragmentShader:
            `
            varying vec3 pos;
            varying vec2 tc;
            uniform vec3 color;
            uniform sampler2D tex;
            void main() {
                float shouldGrid = texture2D(tex, pos.xz).r;
                // Increase alpha artificially so that on lower mipmaps the color remains darker.
                gl_FragColor = vec4(color, clamp(shouldGrid * 3.0f, 0.0f, 1.0f) * tc.y);
            }
            `,
        });
        material.side = THREE.DoubleSide;
        material.transparent = true;
        material.depthWrite = false;
        const ret = new THREE.Mesh();
        ret.userData.skipSSAO = true;
        const vertices = [];
        const uvs = [];
        const uv2s = [];
        const geom = new THREE.BufferGeometry();

        const WIDTH = 5.0;

        vertices.push(...[-WIDTH, 0, -WIDTH]);
        uvs.push(...[0, 0]);
        uv2s.push(...[0, 0]);
        vertices.push(...[-WIDTH, 0, WIDTH + 1]);
        uvs.push(...[0, 0]);
        uv2s.push(...[0, 1]);
        vertices.push(...[WIDTH + 1, 0, -WIDTH]);
        uvs.push(...[0, 0]);
        uv2s.push(...[1, 0]);
        vertices.push(...[WIDTH + 1, 0, WIDTH + 1]);
        uvs.push(...[0, 0]);
        uv2s.push(...[1, 1]);

        vertices.push(...[0, 0, 0]);
        uvs.push(...[0, 1]);
        uv2s.push(...[0, 0]);
        vertices.push(...[0, 0, 1]);
        uvs.push(...[0, 1]);
        uv2s.push(...[0, 1]);
        vertices.push(...[1, 0, 0]);
        uvs.push(...[0, 1]);
        uv2s.push(...[1, 0]);
        vertices.push(...[1, 0, 1]);
        uvs.push(...[0, 1]);
        uv2s.push(...[1, 1]);

        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geom.setAttribute('uv2', new THREE.Float32BufferAttribute(uv2s, 2));
        geom.setIndex([
            0, 1, 4,  1, 5, 4,
            1, 3, 5,  3, 7, 5,
            3, 2, 7,  2, 6, 7,
            2, 0, 6, 0, 4, 6,
            // Inner square
            4, 5, 7, 7, 6, 4,
        ]);
        ret.geometry = geom;
        ret.material = material;
        this.grid = ret;
        ret.frustumCulled = false;
    }

    place(x, y, z, w = 1, h = 1) {
        this.grid.position.set(Math.floor(x), Math.floor(y) + 0.01, Math.floor(z));
        this.grid.material.uniforms.size.value = new THREE.Vector2(w - 1, h - 1);
    }
}