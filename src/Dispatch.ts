import * as StoreModule from './store/Store';
import BuilderVue from './components/builder/Builder.vue';
import AdminVue from './components/Admin.vue';
import DebugVue from './components/debug/Debug.vue';
import ShareVue from './components/builder/share/Share.vue';
import GalleryVue from './components/builder/gallery/Gallery.vue';

import { THREE } from './three';

export const Builder = BuilderVue;
export const Admin = AdminVue;
export const Debug = DebugVue;
export const Share = ShareVue;
export const Gallery = GalleryVue;
export const Store = StoreModule;

// Load VueX store - this is only relied upon by modules loaded here.
import { app } from './main.js';
app.use(StoreModule.store);
StoreModule.setLoaded();
