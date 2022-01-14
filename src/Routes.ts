import Builder from './components/builder/Builder.vue'
import Legal from './components/Legal.vue'
import Admin from './components/Admin.vue'
import Settings from './components/Settings.vue'
import SetBrowser from './components/builder/set_browser/SetBrowser.vue'
import ShareView from './components/builder/share/Share.vue'
import Gallery from './components/builder/gallery/Gallery.vue'
import LandingPage from './components/landing_page/LandingPage.vue'
import Debug from './components/debug/Debug.vue'
import Team from './components/team/Team.vue'

export const routes = [
    {
        path: "/",
        name: "Landing",
        component: LandingPage,
    },
    {
        path: "/builder",
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
    },
    {
        path: "/debug/:address?",
        name: "Debug",
        component: Debug
    },
    {
        path: "/share",
        name: "Share",
        component: ShareView,
        props(route: any) {
            return route.query || {}
        }
    },
    {
        path: "/gallery",
        name: "Gallery",
        component: Gallery,
    },
    {
        path: "/team",
        name: "Team",
        component: Team
    },
];
