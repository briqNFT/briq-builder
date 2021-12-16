import { reactive } from 'vue'

import { PROD } from './Meta'

var gaLoaded = false;
function loadGA()
{
    if (!PROD)
    {
        console.log("GA not loaded, dev environment");
        return;
    }
    if (gaLoaded)
        return;
    gaLoaded = true;
    if (!gaStore.agreed)
        return;
    const gaScript = document.createElement('script')
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-R9E196KSVG';
    document.head.append(gaScript)

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-R9E196KSVG');
}

export var gaStore = reactive({
    agreed: false,
    agree: () => {
        let old = gaStore.agreed;
        gaStore.agreed = true;
        if (!old)
        {
            window.localStorage.setItem('ga-agreed', true);
            window.localStorage.setItem('ga-agreed-time', Date.now());
            loadGA();
        }
    },
    reject: () => {
        gaStore.agreed = false;
        window.localStorage.setItem('ga-agreed', false);
        window.localStorage.setItem('ga-agreed-time', Date.now());
    },
    clear: () => {
        gaStore.agreed = false;
        window.localStorage.removeItem('ga-agreed');
        window.localStorage.removeItem('ga-agreed-time');
    },
    needGAPopup: function() {
        return !window.localStorage.getItem('ga-agreed-time') ||
            (Date.now() - +window.localStorage.getItem('ga-agreed-time') > 365*24*3600*1000) // JS timestamps are milliseconds
    }
})

// initialise
gaStore.agreed = window.localStorage.getItem('ga-agreed') == "true";

if (gaStore.agreed)
    loadGA();
