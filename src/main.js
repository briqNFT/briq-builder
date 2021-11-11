import { createApp } from 'vue'
import { createWebHistory, createRouter } from "vue-router";
import App from './App.vue'

// Pages
import Builder from './components/Builder.vue'
import Legal from './components/Legal.vue'
import Admin from './components/Admin.vue'

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).mount('#app')
