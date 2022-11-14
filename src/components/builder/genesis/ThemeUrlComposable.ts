import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';

export function useThemeURLs() {
    const themeCoverUrl = (theme: string, quality = 'high' as 'high' | 'low', network: string = getCurrentNetwork()) => backendManager.getRoute(`${network}/${theme}/${quality}/cover.jpg`);
    const themeLogoSrcSet = (theme: string, quality = 'high' as 'high' | 'low', network: string = getCurrentNetwork()) => backendManager.getRoute(`${network}/${theme}/${quality}/logo.png`) + ' 2x';
    const themeSplashSrc = (theme: string, quality = 'high' as 'high' | 'low', network: string = getCurrentNetwork()) => backendManager.getRoute(`${network}/${theme}/${quality}/splash.jpg`);
    const themeSplashSrcSet = (theme: string, quality = 'high' as 'high' | 'low', network: string = getCurrentNetwork()) => backendManager.getRoute(`${network}/${theme}/${quality}/splash.jpg`) + ' 2x';
    return {
        themeCoverUrl,
        themeLogoSrcSet,
        themeSplashSrc,
        themeSplashSrcSet,
    }
}
