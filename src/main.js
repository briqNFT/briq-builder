import { createApp } from 'vue'
import { createWebHistory, createRouter } from "vue-router";
import App from './App.vue'

let app = createApp(App);

// Load Tailwind CSS
import './index.css'

// Routing
import { routes } from './Routes'
const router = createRouter({
  history: createWebHistory(),
  routes,
});
app.use(router);

// Load general store
import { store } from './store/Store'
app.use(store);

// Load general components
import Button from './components/generic/Button.vue';
app.component("Button", Button);
import Hotkey from './components/generic/Hotkey.vue';
app.component("Hotkey", Hotkey);

app.mount('#app')
