/**
 * Copy of Three JS's examples TAA pass.
 * Custom precision is used, and also my SSAA class.
 */
import {
    WebGLRenderTarget,
} from 'three';
import { SSAARenderPass } from './SSAARenderPass.js';

/**
 *
 * Temporal Anti-Aliasing Render Pass
 *
 * When there is no motion in the scene, the TAA render pass accumulates jittered camera samples across frames to create a high quality anti-aliased result.
 *
 * References:
 *
 * TODO: Add support for motion vector pas so that accumulation of samples across frames can occur on dynamics scenes.
 *
 */

class TAARenderPass extends SSAARenderPass {

    constructor( scene, camera, clearColor, clearAlpha ) {

        super( scene, camera, clearColor, clearAlpha );

        this.sampleLevel = 0;
        this.accumulate = false;

    }

    render( renderer, writeBuffer, readBuffer, deltaTime ) {

        if ( this.accumulate === false ) {

            super.render( renderer, writeBuffer, readBuffer, deltaTime );

            this.accumulateIndex = - 1;
            return;

        }

        const jitterOffsets = _JitterVectors[ 6 ];

        if ( this.sampleRenderTarget === undefined ) {

            this.sampleRenderTarget = new WebGLRenderTarget( readBuffer.width, readBuffer.height, this.params );
            this.sampleRenderTarget.texture.name = 'TAARenderPass.sample';

        }

        if ( this.holdRenderTarget === undefined ) {

            this.holdRenderTarget = new WebGLRenderTarget( readBuffer.width, readBuffer.height, this.params );
            this.holdRenderTarget.texture.name = 'TAARenderPass.hold';

        }

        if ( this.accumulateIndex === - 1 ) {

            super.render( renderer, this.holdRenderTarget, readBuffer, deltaTime );

            this.accumulateIndex = 0;

        }

        const autoClear = renderer.autoClear;
        renderer.autoClear = false;

        const sampleWeight = 1.0 / ( jitterOffsets.length );

        if ( this.accumulateIndex >= 0 && this.accumulateIndex < jitterOffsets.length ) {

            this.copyUniforms[ 'opacity' ].value = sampleWeight;
            this.copyUniforms[ 'tDiffuse' ].value = writeBuffer.texture;

            // render the scene multiple times, each slightly jitter offset from the last and accumulate the results.
            const numSamplesPerFrame = Math.pow( 2, this.sampleLevel );
            for ( let i = 0; i < numSamplesPerFrame; i ++ ) {

                const j = this.accumulateIndex;
                const jitterOffset = jitterOffsets[ j ];

                if ( this.camera.setViewOffset )

                    this.camera.setViewOffset( readBuffer.width, readBuffer.height,
                        jitterOffset[ 0 ] * 0.0625, jitterOffset[ 1 ] * 0.0625, // 0.0625 = 1 / 16
                        readBuffer.width, readBuffer.height );



                renderer.setRenderTarget( writeBuffer );
                renderer.clear();
                renderer.render( this.scene, this.camera );

                renderer.setRenderTarget( this.sampleRenderTarget );
                if (this.accumulateIndex === 0 ) {
                    renderer.setClearColor( this.clearColor, this.clearAlpha );
                    renderer.clear();
                }
                this.fsQuad.render( renderer );

                this.accumulateIndex ++;

                if ( this.accumulateIndex >= jitterOffsets.length )
                    break;

            }

            if ( this.camera.clearViewOffset )
                this.camera.clearViewOffset();

        }

        const accumulationWeight = this.accumulateIndex * sampleWeight;
        if (accumulationWeight > 0 ) {

            this.copyUniforms[ 'opacity' ].value = 1.0;
            this.copyUniforms[ 'tDiffuse' ].value = this.sampleRenderTarget.texture;
            renderer.setRenderTarget( writeBuffer );
            renderer.clear();
            this.fsQuad.render( renderer );

        }

        if (accumulationWeight < 1.0 ) {

            this.copyUniforms[ 'opacity' ].value = 1.0 - accumulationWeight;
            this.copyUniforms[ 'tDiffuse' ].value = this.holdRenderTarget.texture;
            renderer.setRenderTarget( writeBuffer );
            if ( accumulationWeight === 0 )
                renderer.clear();
            this.fsQuad.render( renderer );
        }

        renderer.autoClear = autoClear;

    }

}

const _JitterVectors = [
    [
        [0, 0],
    ],
    [
        [4, 4], [- 4, - 4],
    ],
    [
        [- 2, - 6], [6, - 2], [- 6, 2], [2, 6],
    ],
    [
        [1, - 3], [- 1, 3], [5, 1], [- 3, - 5],
        [- 5, 5], [- 7, - 1], [3, 7], [7, - 7],
    ],
    [
        [1, 1], [- 1, - 3], [- 3, 2], [4, - 1],
        [- 5, - 2], [2, 5], [5, 3], [3, - 5],
        [- 2, 6], [0, - 7], [- 4, - 6], [- 6, 4],
        [- 8, 0], [7, - 4], [6, 7], [- 7, - 8],
    ],
    [
        [- 4, - 7], [- 7, - 5], [- 3, - 5], [- 5, - 4],
        [- 1, - 4], [- 2, - 2], [- 6, - 1], [- 4, 0],
        [- 7, 1], [- 1, 2], [- 6, 3], [- 3, 3],
        [- 7, 6], [- 3, 6], [- 5, 7], [- 1, 7],
        [5, - 7], [1, - 6], [6, - 5], [4, - 4],
        [2, - 3], [7, - 2], [1, - 1], [4, - 1],
        [2, 1], [6, 2], [0, 4], [4, 4],
        [2, 5], [7, 5], [5, 6], [3, 7],
    ],
    // Hand generated using a poisson disk distribution.
    [[-3.105, 5.903], [-5.036, 5.385], [-3.133, 3.904], [-4.940, 7.383], [-1.255, 4.590], [-5.047, 3.322], [-6.929, 7.175], [-3.167, 1.904], [-2.409, 0.053], [-1.168, 1.835], [-5.061, 1.261], [-6.985, 4.934], [-1.312, 6.790], [-0.262, 0.052], [1.612, -0.644], [3.084, -1.998], [3.356, 0.332], [0.788, 2.246], [3.513, -3.951], [0.744, 4.564], [0.687, 6.783], [-6.899, 2.567], [2.458, 5.853], [5.403, -4.605], [3.197, 3.995], [5.018, -2.509], [4.114, 2.183], [5.326, -0.533], [0.498, -2.306], [4.882, 5.071], [1.516, -4.065], [7.277, -5.305], [4.270, -6.253], [4.007, 7.118], [-0.427, -4.535], [-1.198, -6.380], [-6.677, 0.083], [6.886, -3.223], [-1.532, -2.868], [5.271, -7.985], [2.270, -6.223], [7.297, -0.870], [7.780, 1.070], [0.259, -7.749], [-3.275, -1.887], [7.722, 3.069], [6.000, 7.280], [-3.219, -3.942], [-3.198, -6.348], [7.039, 5.571], [7.180, -7.389], [-5.182, -3.558], [7.937, 7.780], [-7.973, -1.439], [-7.406, -3.357], [-5.070, -5.645], [-5.360, -1.566], [-7.903, -5.294], [-4.949, -7.641], [-6.908, -7.239]],
];

export { TAARenderPass };
