import Legal from './components/Legal.vue'
import LandingPage from './components/landing_page/LandingPage.vue'
import Team from './components/team/Team.vue'
import { CONF } from './Conf';

var loader;
async function loadExtraPages()
{
    loader = await import('@/Dispatch');
    await loader.Store.isLoaded;
}
// Some pages know that they'll need threeJS so don't wait until Dispatch is loaded to request it.
async function loadThreeJS()
{
    await import('@/three_wrapper');
}

async function loadAllExtraPages()
{
    let res = loadExtraPages();
    let res2 = loadThreeJS();
    await res2;
    return await res;
}

// After a few seconds, preload the rest of the JS anyways,
// under the assumption that the user might want it soon anyways.
setTimeout(loadExtraPages, 5000);

export const routes = [
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
        component: async () => { await loadAllExtraPages(); return loader.Share },
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

if (CONF.useLanding)
{
    routes.push({
        path: "/",
        name: "Landing",
        component: LandingPage,
    });
    routes.push({
        path: "/builder",
        name: "Builder",
        component: async () => { await loadAllExtraPages(); return loader.Builder },
    });
} else {
    routes.push({
        path: "/",
        name: "Builder",
        component: async () => { await loadAllExtraPages(); return loader.Builder },
    })
    routes.push({
        path: "/builder",
        redirect: "/",
    });
}