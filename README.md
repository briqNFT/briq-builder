# Overview

WebApp to access the briq builder, see https://briq.construction/.  
The `briq api` server is required for some starknet interaction (see https://github.com/briqNFT/briq-api).  

The WebApp exposes a Three.js builder to display the briqs and create with them.
# Setup

`npm install` then `npm run dev`

Tests can be run with `npm test`, though they are fairly lacking at the moment.

## Repository structure
#### infra/
Kubernetes deployment tooling. Includes templates & dockerfile.  
Note that the website is served by nginx as static assets for the most part.

#### server/
Mostly a node-server (but uses the vite SSR because it's convenient when testing it).  
Used to return custom social media metadata (thumbnail, ...) for the sharing page.

#### src/
The main source of the website. Tentatively divided as such, though the boundaries are sometimes foggy:
 - Root level

Global javascript files, such as the main entry point (`App.vue`), configuration, monitoring or routes.

 - `components/`

Vue3 SFC components. These are then subdivided in hopefully explicit subfolders.  
Those are the only components that actually get renderered onto HTML.

 - `builder/`

All files related to the builder data & rendering (under `graphics/`). Intended to not really contain much blockchain-specific code.  
Input modes use a FSM that's under `inputs/` here.

 - `chain/`

Starknet specific code. NB: not all files have been moved here yet.  
The StarkNet contracts addresses can be found under `src/chain/Contracts.ts`
