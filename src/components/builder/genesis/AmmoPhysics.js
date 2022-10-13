async function AmmoPhysics(THREE) {

    const ammoScript = document.createElement('script');
    ammoScript.src = '/ammo.js';
    await new Promise((resolve, _) => {
        ammoScript.onload = () => resolve(null);
        document.body.appendChild(ammoScript);
    })

    if ( 'Ammo' in window === false ) {

        console.error( 'AmmoPhysics: Couldn\'t find Ammo.js' );
        return;

    }
    const AmmoLib = await Ammo(); // eslint-disable-line no-undef

    const frameRate = 60;

    const collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration();
    const dispatcher = new AmmoLib.btCollisionDispatcher( collisionConfiguration );
    const broadphase = new AmmoLib.btDbvtBroadphase();
    const solver = new AmmoLib.btSequentialImpulseConstraintSolver();
    const world = new AmmoLib.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
    world.setGravity( new AmmoLib.btVector3( 0, -0.5, 0 ) );

    const worldTransform = new AmmoLib.btTransform();

    //

    function getShape( mesh ) {

        const geometry = (() => {
            if (!mesh.geometry) {
                let r;
                mesh.traverse(obj => {
                    if (obj.geometry?.boundingBox)
                        r = obj;
                })
                return r.geometry;
            }
            return mesh.geometry;
        })();
        const parameters = geometry.parameters;

        // TODO change type to is*

        if ( geometry.type === 'BoxGeometry' ) {

            const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
            const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
            const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

            const shape = new AmmoLib.btBoxShape( new AmmoLib.btVector3( sx, sy, sz ) );
            shape.setMargin( 0.001 );

            return shape;

        } else if ( geometry.type === 'SphereGeometry' || geometry.type === 'IcosahedronGeometry' ) {

            const radius = parameters.radius !== undefined ? parameters.radius : 1;

            const shape = new AmmoLib.btSphereShape( radius );
            shape.setMargin( 0.001 );

            return shape;

        } else {
            const box = geometry.boundingBox;/* new THREE.Box3();
            box.setFromObject(mesh, false);*/

            const sx = (box.max.x - box.min.x)/2;
            const sy = (box.max.y - box.min.y)/2;
            const sz = (box.max.z - box.min.z)/2;

            const shape = new AmmoLib.btBoxShape( new AmmoLib.btVector3( sx, sy, sz ) );
            shape.setMargin( 0.001 );

            return shape;

        }

        return null;

    }

    const meshes = [];
    const meshMap = new WeakMap();

    function addMesh( mesh, mass = 0, friction = 1.0) {

        const shape = getShape( mesh );

        if ( shape !== null )

            if ( mesh.isInstancedMesh )

                handleInstancedMesh( mesh, mass, shape );

			 else

                handleMesh( mesh, mass, shape, friction );





    }

    function handleMesh( mesh, mass, shape, friction ) {
        const position = mesh.position;
        const quaternion = mesh.quaternion;

        const transform = new AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin( new AmmoLib.btVector3( position.x, position.y, position.z ) );
        transform.setRotation( new AmmoLib.btQuaternion( quaternion.x, quaternion.y, quaternion.z, quaternion.w ) );

        const motionState = new AmmoLib.btDefaultMotionState( transform );

        const localInertia = new AmmoLib.btVector3( 0, 0, 0 );
        shape.calculateLocalInertia( mass, localInertia );

        const rbInfo = new AmmoLib.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );

        const body = new AmmoLib.btRigidBody( rbInfo );
        body.setFriction( friction );
        world.addRigidBody( body );

        if ( mass > 0 ) {

            meshes.push( mesh );
            meshMap.set( mesh, body );

        }


    }

    function handleInstancedMesh( mesh, mass, shape ) {

        const array = mesh.instanceMatrix.array;

        const bodies = [];

        for ( let i = 0; i < mesh.count; i ++ ) {

            const index = i * 16;

            const transform = new AmmoLib.btTransform();
            transform.setFromOpenGLMatrix( array.slice( index, index + 16 ) );

            const motionState = new AmmoLib.btDefaultMotionState( transform );

            const localInertia = new AmmoLib.btVector3( 0, 0, 0 );
            shape.calculateLocalInertia( mass, localInertia );

            const rbInfo = new AmmoLib.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );

            const body = new AmmoLib.btRigidBody( rbInfo );
            world.addRigidBody( body );

            bodies.push( body );

        }

        if ( mass > 0 ) {

            meshes.push( mesh );

            meshMap.set( mesh, bodies );

        }

    }

    //

    function setMeshPosition( mesh, position, index = 0 ) {

        if ( mesh.isInstancedMesh ) {

            const bodies = meshMap.get( mesh );
            const body = bodies[ index ];

            body.setAngularVelocity( new AmmoLib.btVector3( 0, 0, 0 ) );
            body.setLinearVelocity( new AmmoLib.btVector3( 0, 0, 0 ) );

            worldTransform.setIdentity();
            worldTransform.setOrigin( new AmmoLib.btVector3( position.x, position.y, position.z ) );
            body.setWorldTransform( worldTransform );

        } else {

            const body = meshMap.get( mesh );

            body.setAngularVelocity( new AmmoLib.btVector3( 0, 0, 0 ) );
            body.setLinearVelocity( new AmmoLib.btVector3( 0, 0, 0 ) );

            worldTransform.setIdentity();
            worldTransform.setOrigin( new AmmoLib.btVector3( position.x, position.y, position.z ) );
            body.setWorldTransform( worldTransform );

        }

    }

    //

    function step(delta) {
        if ( delta > 0 )
            world.stepSimulation( delta, 10 );

        for ( let i = 0, l = meshes.length; i < l; i ++ ) {

            const mesh = meshes[ i ];

            if ( mesh.isInstancedMesh ) {

                const array = mesh.instanceMatrix.array;
                const bodies = meshMap.get( mesh );

                for ( let j = 0; j < bodies.length; j ++ ) {

                    const body = bodies[ j ];

                    const motionState = body.getMotionState();
                    motionState.getWorldTransform( worldTransform );

                    const position = worldTransform.getOrigin();
                    const quaternion = worldTransform.getRotation();

                    compose( position, quaternion, array, j * 16 );

                }

                mesh.instanceMatrix.needsUpdate = true;

            } else {

                const body = meshMap.get( mesh );

                const motionState = body.getMotionState();
                motionState.getWorldTransform( worldTransform );

                const position = worldTransform.getOrigin();
                const quaternion = worldTransform.getRotation();
                mesh.position.set( position.x(), position.y(), position.z() );
                mesh.quaternion.set( quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w() );

            }

        }

    }

    return {
        addMesh: addMesh,
        setMeshPosition: setMeshPosition,
        AmmoLib,
        world,
        step: step,
        meshMap,
        // addCompoundMesh
    };

}

function compose( position, quaternion, array, index ) {

    const x = quaternion.x(), y = quaternion.y(), z = quaternion.z(), w = quaternion.w();
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    array[ index + 0 ] = ( 1 - ( yy + zz ) );
    array[ index + 1 ] = ( xy + wz );
    array[ index + 2 ] = ( xz - wy );
    array[ index + 3 ] = 0;

    array[ index + 4 ] = ( xy - wz );
    array[ index + 5 ] = ( 1 - ( xx + zz ) );
    array[ index + 6 ] = ( yz + wx );
    array[ index + 7 ] = 0;

    array[ index + 8 ] = ( xz + wy );
    array[ index + 9 ] = ( yz - wx );
    array[ index + 10 ] = ( 1 - ( xx + yy ) );
    array[ index + 11 ] = 0;

    array[ index + 12 ] = position.x();
    array[ index + 13 ] = position.y();
    array[ index + 14 ] = position.z();
    array[ index + 15 ] = 1;

}

export { AmmoPhysics };


/* global Ammo */

export const DefaultBufferSize = 3 * 1000000;

export const AmmoDebugConstants = {
    NoDebug: 0,
    DrawWireframe: 1,
    DrawAabb: 2,
    DrawFeaturesText: 4,
    DrawContactPoints: 8,
    NoDeactivation: 16,
    NoHelpText: 32,
    DrawText: 64,
    ProfileTimings: 128,
    EnableSatComparison: 256,
    DisableBulletLCP: 512,
    EnableCCD: 1024,
    DrawConstraints: 1 << 11, //2048
    DrawConstraintLimits: 1 << 12, //4096
    FastWireframe: 1 << 13, //8192
    DrawNormals: 1 << 14, //16384
    MAX_DEBUG_DRAW_MODE: 0xffffffff,
};

const setXYZ = function(array, index, x, y, z) {
    index *= 3;
    array[index + 0] = x;
    array[index + 1] = y;
    array[index + 2] = z;
};

/**
 * An implementation of the btIDebugDraw interface in Ammo.js, for debug rendering of Ammo shapes
 * @class AmmoDebugDrawer
 * @param {Uint32Array} indexArray
 * @param {Float32Array} verticessArray
 * @param {Float32Array} colorsArray
 * @param {Ammo.btCollisionWorld} world
 * @param {object} [options]
 */
export const AmmoDebugDrawer = function(indexArray, verticesArray, colorsArray, world, options) {
    this.world = world;
    options = options || {};

    this.verticesArray = verticesArray;
    this.colorsArray = colorsArray;
    this.indexArray = indexArray;

    this.debugDrawMode = options.debugDrawMode || AmmoDebugConstants.DrawWireframe;

    this.index = 0;
    if (this.indexArray)
        Atomics.store(this.indexArray, 0, this.index);


    this.enabled = false;

    this.debugDrawer = new Ammo.DebugDrawer();
    this.debugDrawer.drawLine = this.drawLine.bind(this);
    this.debugDrawer.drawContactPoint = this.drawContactPoint.bind(this);
    this.debugDrawer.reportErrorWarning = this.reportErrorWarning.bind(this);
    this.debugDrawer.draw3dText = this.draw3dText.bind(this);
    this.debugDrawer.setDebugMode = this.setDebugMode.bind(this);
    this.debugDrawer.getDebugMode = this.getDebugMode.bind(this);
    this.debugDrawer.enable = this.enable.bind(this);
    this.debugDrawer.disable = this.disable.bind(this);
    this.debugDrawer.update = this.update.bind(this);

    this.world.setDebugDrawer(this.debugDrawer);
};

AmmoDebugDrawer.prototype = function() {
    return this.debugDrawer;
};

AmmoDebugDrawer.prototype.enable = function() {
    this.enabled = true;
};

AmmoDebugDrawer.prototype.disable = function() {
    this.enabled = false;
};

AmmoDebugDrawer.prototype.update = function() {
    if (!this.enabled)
        return;


    if (this.indexArray) {
        if (Atomics.load(this.indexArray, 0) === 0) {
            this.index = 0;
            this.world.debugDrawWorld();
            Atomics.store(this.indexArray, 0, this.index);
        }
    } else {
        this.index = 0;
        this.world.debugDrawWorld();
    }
};

AmmoDebugDrawer.prototype.drawLine = function(from, to, color) {
    const heap = Ammo.HEAPF32;
    const r = heap[(color + 0) / 4];
    const g = heap[(color + 4) / 4];
    const b = heap[(color + 8) / 4];

    const fromX = heap[(from + 0) / 4];
    const fromY = heap[(from + 4) / 4];
    const fromZ = heap[(from + 8) / 4];
    setXYZ(this.verticesArray, this.index, fromX, fromY, fromZ);
    setXYZ(this.colorsArray, this.index++, r, g, b);

    const toX = heap[(to + 0) / 4];
    const toY = heap[(to + 4) / 4];
    const toZ = heap[(to + 8) / 4];
    setXYZ(this.verticesArray, this.index, toX, toY, toZ);
    setXYZ(this.colorsArray, this.index++, r, g, b);
};

//TODO: figure out how to make lifeTime work
AmmoDebugDrawer.prototype.drawContactPoint = function(pointOnB, normalOnB, distance, lifeTime, color) {
    const heap = Ammo.HEAPF32;
    const r = heap[(color + 0) / 4];
    const g = heap[(color + 4) / 4];
    const b = heap[(color + 8) / 4];

    const x = heap[(pointOnB + 0) / 4];
    const y = heap[(pointOnB + 4) / 4];
    const z = heap[(pointOnB + 8) / 4];
    setXYZ(this.verticesArray, this.index, x, y, z);
    setXYZ(this.colorsArray, this.index++, r, g, b);

    const dx = heap[(normalOnB + 0) / 4] * distance;
    const dy = heap[(normalOnB + 4) / 4] * distance;
    const dz = heap[(normalOnB + 8) / 4] * distance;
    setXYZ(this.verticesArray, this.index, x + dx, y + dy, z + dz);
    setXYZ(this.colorsArray, this.index++, r, g, b);
};

AmmoDebugDrawer.prototype.reportErrorWarning = function(warningString) {
    if (Ammo.hasOwnProperty('UTF8ToString'))
        console.warn(Ammo.UTF8ToString(warningString));
    else if (!this.warnedOnce) {
        this.warnedOnce = true;
        console.warn('Cannot print warningString, please export UTF8ToString from Ammo.js in make.py');
    }
};

AmmoDebugDrawer.prototype.draw3dText = function(location, textString) {
    //TODO
    console.warn('TODO: draw3dText');
};

AmmoDebugDrawer.prototype.setDebugMode = function(debugMode) {
    this.debugDrawMode = debugMode;
};

AmmoDebugDrawer.prototype.getDebugMode = function() {
    return this.debugDrawMode;
};
