import { createApp } from 'vue'
import { createWebHistory, createRouter } from "vue-router";
import App from './App.vue'

// Load Tailwind CSS
import './index.css'

import { store } from './store/Store'

import { routes } from './Routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).use(store).mount('#app')
