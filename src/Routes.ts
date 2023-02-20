import Legal from './components/Legal.vue';
import GenesisMint from '@/components/builder/genesis/GenesisMint.vue';

import BuilderLoader from './components/builder/BuilderLoader.vue';

import RealmsComplete from '@/components/realms/Complete.vue';

import ProfilePageVue from '@/components/profile/ProfilePage.vue';

import ThemesListingVue from './components/builder/genesis/ThemesListing.vue';
import ThemeRouter from './components/builder/genesis/ThemeRouter.vue';
import BoxSalePageVue from './components/builder/genesis/BoxSalePage.vue';
import BoxPageVue from './components/builder/genesis/BoxPage.vue';

import ImageLoaderVue from '@/components/ImageLoader.vue';

import { CONF } from './Conf';
import SetPageVue from './components/builder/genesis/SetPage.vue';

let loader;
async function loadExtraPages() {
    loader = await import('@/Dispatch');
}

// Preload the rest of the javascript after a short while,
// under the assumption that the user might want it soon anyways.
// NB: this is generally done already anyways.
setTimeout(loadExtraPages, 5000);

export const routes = [
    {
        path: '/legal',
        name: 'Legal',
        component: Legal,
    },
    {
        path: '/legal/:doc',
        name: 'Legal Doc',
        component: () => import('@/components/legal/Doc.vue'),
    },/*
    {
        path: '/team',
        name: 'Team',
        component: Team,
    },*/
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
        component: import('@/components/collections/ManageCollection.vue'),
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
        component: ProfilePageVue,
    },
    {
        path: '/genesis',
        name: 'Genesis Mint',
        component: GenesisMint,
    },
    {
        path: '/themes',
        name: 'ThemesListing',
        component: ThemesListingVue,
    },
    {
        path: '/product/:theme',
        name: 'Theme',
        component: ThemeRouter,
    },
    {
        path: '/product/:theme/:box',
        name: 'BoxSale',
        component: BoxSalePageVue,
    },
    {
        path: '/box/:theme/:box',
        name: 'UserBox',
        component: BoxPageVue,
    },
    {
        path: '/booklet/:theme/:booklet',
        name: 'UserBooklet',
        component: SetPageVue,
    },
    {
        path: '/set/:network/:set_id',
        name: 'UserCreation',
        component: SetPageVue,
    },
    {
        path: '/image',
        name: 'Image loader',
        component: ImageLoaderVue,
    },
    {
        path: '/unboxing/:theme/:box',
        name: 'Unboxing',
        component: async () => {
            await loadExtraPages();
            return loader.UnboxingVue;
        },
    },
    {
        path: '/briqmas',
        name: 'BriqMas',
        component: async () => {
            await loadExtraPages();
            return loader.Briqmas;
        },
    },
    {
        path: '/briqmas_next_day',
        name: 'briqmas_next_day',
        component: async () => {
            await loadExtraPages();
            return loader.BriqmasNextDay;
        },
    },
    {
        path: '/briqmas/forest',
        name: 'BriqMas Forest',
        component: () => import('@/components/builder/briqmas_forest/Forest.vue'),
    },
];

if (CONF.theme === 'realms') {
    routes.push({
        path: '/',
        name: 'RealmsComplete',
        component: RealmsComplete,
    });
    routes.push({
        path: '/builder',
        name: 'Builder',
        beforeEnter() {
            location.href = 'https://briq.construction/builder'
        },
    });
} else {
    routes.push({
        path: '/',
        name: 'Landing',
        component: GenesisMint,
    });
    routes.push({
        path: '/builder',
        name: 'Builder',
        component: BuilderLoader,
    });
}

import { createWebHistory, createRouter } from 'vue-router';
import { APP_ENV } from './Meta';
import ThemePageDucks from './components/builder/genesis/ThemePageDucks.vue';
export const router = createRouter({
    history: createWebHistory(),
    routes,
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