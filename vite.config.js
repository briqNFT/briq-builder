import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import analyze from 'rollup-plugin-analyzer';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { visualizer } from 'rollup-plugin-visualizer';

svgLoader({
    svgoConfig: {
        multipass: true,
    },
});

const injectNpmVersion = () => {
    return {
        name: 'inject-npm-version',
        config: () => ({ define: { 'import.meta.env.VERSION': JSON.stringify(process.env.npm_package_version) } }),
    };
};

const htmlPlugin = () => {
    return {
        name: 'html-transform',
        transformIndexHtml(html, ctx) {
            if (!ctx?.chunk?.dynamicImports)
                return html;
            // Prefetch some scripts that we'll load and can take some time to load. Can help, can not help, depending.
            const preloadScripts = ctx.chunk.dynamicImports.filter(x => x.indexOf('Dispatch') !== -1 || x.indexOf('three') !== -1)
            return html.replace(
                '</script>',
                '</script>\n    ' + preloadScripts.map(x => `<link rel="prefetch" as="script" crossorigin href="/${x}">`).join('\n    '),
            )
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    assetsInclude: ['**/*.exr'],
    build: {
        target: 'es2020',
        sourcemap: true,
        minify: false,
    },
    test: {
        globals: true,
        environment: 'jsdom',
    },
    // Uncomment to see details on what's going with rollup
    plugins: [vue(), svgLoader(), injectNpmVersion(), htmlPlugin()],//, analyze({ showExports: true }), visualizer({ template: 'treemap', sourcemap: true })],
}));
