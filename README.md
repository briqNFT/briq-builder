# Overview

WebApp to access the brq builder. Requires the `briq protocol` server to run (https://github.com/S-L-Technologies/brq-protocol).
The WebApp exposes a Three.js builder to display the briqs and build constructions with them. It communicates with the StarkNet testnet through the Flask Server in brq-protocol.

The StarkNet contracts are here:
- `0x04aabebdf46043787c3da64aa2852a6e6062c1dbe5dcee51313c18cb2916fa89` manages the briqs, based on ERC-721
- `0x01e419c44afff349e65848be339ad01fb62dd9ac56a3720a366f32de754ef8d5` manages the briq sets  

# Setup

`npm install` then `npm run dev`