import { createApp } from 'vue'

// Load Tailwind CSS
import './index.css'

import App from './App.vue'
export var app = createApp(App);

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

async function start()
{
    app.mount('#app')
}

start();
