import Legal from './components/Legal.vue';
import LandingPage from './components/landing_page/LandingPage.vue';
import Team from './components/team/Team.vue';
import GenesisMint from '@/components/builder/genesis/GenesisMint.vue';

import BuilderLoader from './components/builder/BuilderLoader.vue';

import RealmsComplete from '@/components/realms/Complete.vue';

import ProfilePageVue from '@/components/profile/ProfilePage.vue';

import ThemesListingVue from './components/builder/genesis/ThemesListing.vue';
import ThemeMainPageVue from './components/builder/genesis/ThemeMainPage.vue';
import BoxPageVue from './components/builder/genesis/BoxPage.vue';

import ImageLoaderVue from '@/components/ImageLoader.vue';

import { CONF } from './Conf';
import SetPageVue from './components/builder/genesis/SetPage.vue';

let loader;
async function loadExtraPages() {
    loader = await import('@/Dispatch');
    await loader.Store.isLoaded;
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
    },
    {
        path: '/team',
        name: 'Team',
        component: Team,
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
        component: async () => {
            await loadExtraPages();
            return loader.Share;
        },
        props(route: any) {
            return route.query || {};
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
        path: '/sale/:theme',
        name: 'Theme',
        component: ThemeMainPageVue,
    },
    {
        path: '/sale/:theme/:box',
        name: 'BoxSale',
        component: BoxPageVue,
    },
    {
        path: '/user/box/:theme/:box',
        name: 'UserBox',
        component: BoxPageVue,
    },
    {
        path: '/user/booklet/:theme/:booklet',
        name: 'UserBooklet',
        component: SetPageVue,
    },
    {
        path: '/user/set/:set_id',
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
export const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition)
            return savedPosition
        else
            return { top: 0 }
    },
});