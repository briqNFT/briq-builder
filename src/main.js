import { createApp } from 'vue';

// Load Tailwind CSS
import './index.css';

import './FontAwesome';

// This was needed with the initial get-starknet library. TODO: review in the future if it's still needed.
window.gsw = true;

import App from './App.vue';
export var app = createApp(App);

// Global pinia store
import { createPinia } from 'pinia'
app.use(createPinia())

// Routing
import { router } from './Routes';
app.use(router);

import { setupMonitoring } from './Monitoring';
setupMonitoring(app, router);

import Button from './components/generic/Button.vue';
import CheckboxBtn from './components/generic/CheckboxBtn.vue';
import Toggle from './components/generic/Toggle.vue';
import Hotkey from './components/generic/Hotkey.vue';
import Window from './components/generic/Window.vue';

// Load general components
app.component('Btn', Button);
app.component('Hotkey', Hotkey);
app.component('CheckboxBtn', CheckboxBtn);
app.component('Toggle', Toggle);
app.component('Window', Window);

async function start() {
    app.mount('#app');
}

start();
