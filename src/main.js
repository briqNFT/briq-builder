import { createApp } from 'vue'
import { createWebHistory, createRouter } from "vue-router";
import App from './App.vue'

// Load Tailwind CSS
import './index.css'

import { store } from './store/Store'

// Pages
import Builder from './components/builder/Builder.vue'
import Legal from './components/Legal.vue'
import Admin from './components/Admin.vue'
import Settings from './components/Settings.vue'
import SetBrowser from './components/builder/set_browser/SetBrowser.vue'

const routes = [
  {
    path: "/",
    name: "Builder",
    component: Builder,
  },
  {
    path: "/legal",
    name: "Legal",
    component: Legal,
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings
  },
  {
    path: "/browse_sets",
    name: "Browse Sets",
    component: SetBrowser
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).use(store).mount('#app')
