import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';

export function useThemeURLs() {
    const themeCoverUrl = (theme: string, network: string = getCurrentNetwork()) => backendManager.getRoute(`${network}/${theme}/cover.jpg`);
    const themeLogoSrcSet = (theme: string, network: string = getCurrentNetwork()) => backendManager.getRoute(`${network}/${theme}/logo.png`) + ' 2x';
    return {
        themeCoverUrl,
        themeLogoSrcSet,
    }
}
