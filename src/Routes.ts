import Legal from './components/Legal.vue'
import LandingPage from './components/landing_page/LandingPage.vue'
import Team from './components/team/Team.vue'

var loader;
async function loadExtraPages()
{
    loader = await import('./Dispatch');
    await loader.Store.isLoaded;
}

// After a few seconds, preload the rest of the JS anyways,
// under the assumption that the user might want it soon anyways.
setTimeout(loadExtraPages, 5000);

export const routes = [
    {
        path: "/",
        name: "Landing",
        component: LandingPage,
    },
    {
        path: "/legal",
        name: "Legal",
        component: Legal,
    },
    {
        path: "/team",
        name: "Team",
        component: Team
    },
    {
        path: "/builder",
        name: "Builder",
        component: async () => { await loadExtraPages(); return loader.Builder },
    },
    {
        path: "/admin",
        name: "Admin",
        component: async () => { await loadExtraPages(); return loader.Admin },
    },
    {
        path: "/debug/:address?",
        name: "Debug",
        component: async () => { await loadExtraPages(); return loader.Debug },
    },
    {
        path: "/share",
        name: "Share",
        component: async () => { await loadExtraPages(); return loader.Share },
        props(route: any) {
            return route.query || {}
        }
    },
    {
        path: "/gallery",
        name: "Gallery",
        component: async () => { await loadExtraPages(); return loader.Gallery },
    },
];
