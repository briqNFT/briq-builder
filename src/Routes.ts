import Legal from './components/Legal.vue';
import LandingPage from './components/landing_page/LandingPage.vue';
import Team from './components/team/Team.vue';
import GenesisMint from '@/components/builder/genesis/GenesisMint.vue';

import BuilderLoader from './components/builder/BuilderLoader.vue';

import RealmsComplete from '@/components/realms/Complete.vue';

import ProfileVue from '@/components/profile/Profile.vue';

import ThemesListingVue from './components/builder/genesis/ThemesListing.vue';
import ThemeMainPageVue from './components/builder/genesis/ThemeMainPage.vue';
import BoxPageVue from './components/builder/genesis/BoxPage.vue';

import { CONF } from './Conf';

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
        path: '/gallery',
        name: 'Gallery',
        component: async () => {
            await loadExtraPages();
            return loader.Gallery;
        },
    },
    {
        path: '/profile/:address?',
        name: 'Profile',
        component: ProfileVue,
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
        path: '/theme/:theme',
        name: 'Theme',
        component: ThemeMainPageVue,
    },
    {
        path: '/box/:theme/:box',
        name: 'Box',
        component: BoxPageVue,
    },
    {
        path: '/unboxing',
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
        component: LandingPage,
    });
    routes.push({
        path: '/builder',
        name: 'Builder',
        component: BuilderLoader,
    });
}
