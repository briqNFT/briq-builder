import { createApp } from 'vue';

// Load Tailwind CSS
import './index.css';

import './FontAwesome';

// This was needed with the initial get-starknet library. TODO: review in the future if it's still needed.
window.gsw = true;

import App from './App.vue';
export var app = createApp(App);

// Routing
import { router } from './Routes';
app.use(router);

import { setupMonitoring } from './Monitoring';
setupMonitoring(app, router);

import Button from './components/generic/Button.vue';
import Toggle from './components/generic/Toggle.vue';
import Hotkey from './components/generic/Hotkey.vue';
import Window from './components/generic/Window.vue';

// Load general components
app.component('Btn', Button);
app.component('Hotkey', Hotkey);
app.component('Toggle', Toggle);
app.component('Window', Window);

async function start() {
    app.mount('#app');
}

start();
