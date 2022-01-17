import { createApp } from 'vue'

// Load Tailwind CSS
import './index.css'

import App from './App.vue'
let app = createApp(App);

// Routing
import { createWebHistory, createRouter } from "vue-router";
import { routes } from './Routes'
const router = createRouter({
    history: createWebHistory(),
    routes,
});
app.use(router);

import { setupMonitoring } from './Monitoring';
setupMonitoring(app, router);

import Button from './components/generic/Button.vue';
import Hotkey from './components/generic/Hotkey.vue';
// Load general components
app.component("Btn", Button);
app.component("Hotkey", Hotkey);

// Load general store
import { store } from './store/Store'
app.use(store);

import { THREE } from './three';
async function start()
{
    await THREE;
    app.mount('#app')    
}

start();
