import { createWebHistory, createRouter } from 'vue-router';
import { APP_ENV } from './Meta';

import GenesisMint from '@/components/builder/genesis/GenesisMint.vue';
import Legal from './components/Legal.vue';
import BuilderLoader from './components/builder/BuilderLoader.vue';
import { MIGRATION_ENABLED } from './MigrationData';

let loader;
async function loadExtraPages() {
    loader = await import('@/Dispatch');
}

let unboxingLoader;
async function loadUnboxing() {
    unboxingLoader = await import('@/DispatchUnboxing');
    return unboxingLoader;
}


// Preload the rest of the javascript after a short while,
// under the assumption that the user might want it soon anyways.
// NB: this is generally done already anyways.
setTimeout(loadExtraPages, 5000);

export const routes = [
    {
        path: '/',
        name: 'Landing',
        component: GenesisMint,
    },
    {
        path: '/builder',
        name: 'Builder',
        component: BuilderLoader,
    },
    {
        path: '/get_briqs',
        name: 'Get Briqs',
        component: async () => {
            await loadExtraPages();
            return loader.BuyBriqs;
        },
    },
    {
        path: '/legal',
        name: 'Legal',
        component: Legal,
    },
    {
        path: '/legal/:doc',
        name: 'Legal Doc',
        component: () => import('@/components/legal/Doc.vue'),
    },
    {
        path: '/admin',
        name: 'Admin',
        component: async () => {
            await loadExtraPages();
            return loader.Admin;
        },
    },
    {
        path: '/collections/manage',
        name: 'ManageCollection',
        component: async () => {
            await loadExtraPages();
            return loader.Collections;
        },
    },
    {
        path: '/collections/massmint',
        name: 'MassMint',
        component: () => import('@/components/collections/MassMint.vue'),
    },
    {
        path: '/debug/:address?',
        name: 'Debug',
        component: async () => {
            await loadExtraPages();
            return loader.Debug;
        },
    },
    {
        path: '/share',
        name: 'Share',
        redirect: (to: unknown) => {
            if (APP_ENV === 'prod')
                window.location.replace(`https://old.briq.construction${to.fullPath}`);
            else
                return '/';
        },
    },
    {
        path: '/profile/:address?',
        name: 'Profile',
        component: async () => {
            await loadExtraPages();
            return loader.ProfilePageVue;
        },
    },
    {
        path: '/themes',
        name: 'ThemesListing',
        component: async () => {
            await loadExtraPages();
            return loader.ThemesListingVue;
        },
    },
    {
        path: '/product/:theme',
        name: 'Theme',
        component: async () => {
            await loadExtraPages();
            return loader.ThemeRouter;
        },
    },
    {
        path: '/product/:theme/:box',
        name: 'BoxSale',
        component: async () => {
            await loadExtraPages();
            return loader.BoxSalePageVue;
        },
    },
    {
        path: '/box/:theme/:box',
        name: 'UserBox',
        component: async () => {
            await loadExtraPages();
            return loader.BoxPageVue;
        },
    },
    {
        path: '/booklet/:theme/:booklet',
        name: 'UserBooklet',
        component: async () => {
            await loadExtraPages();
            return loader.SetPageVue;
        },
    },
    {
        path: '/set/:network/:set_id',
        name: 'UserCreation',
        component: async () => {
            await loadExtraPages();
            return loader.SetPageVue;
        },
    },
    {
        path: '/unboxing/:theme/:box',
        name: 'Unboxing',
        component: async () => {
            return (await loadUnboxing()).UnboxingVue;
        },
    },
    {
        path: '/briqmas',
        name: 'BriqMas',
        component: async () => {
            return (await loadUnboxing()).Briqmas;
        },
    },
    {
        path: '/briqmas_next_day',
        name: 'briqmas_next_day',
        component: async () => {
            return (await loadUnboxing()).BriqmasNextDay;
        },
    },
    {
        path: '/briqmas/forest',
        name: 'BriqMas Forest',
        component: async () => {
            await loadExtraPages();
            return loader.BriqmasForest;
        },
    },
    {
        path: '/briqout',
        name: 'briqout',
        component: () => import('@/components/briqout/Briqout.vue'),
    },
];
export const router = createRouter({
    history: createWebHistory(),
    routes: MIGRATION_ENABLED ? routes : [{
        path: '/:pathMatch(.*)*',
        name: 'Migration ongoing',
        component: () => import('@/components/MigrationOngoing.vue'),
    }],
    scrollBehavior(to, from, savedPosition) {
        if (to.hash)
            return {
                el: to.hash,
            }
        if (savedPosition)
            return savedPosition
        else if (to.name !== from.name)
            return { top: 0 }
    },
});