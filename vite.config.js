import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import analyze from 'rollup-plugin-analyzer'
import { visualizer } from "rollup-plugin-visualizer";

svgLoader({
    svgoConfig: {
        multipass: true
    }
})

const injectNpmVersion = () => {
  return {
    name: 'inject-npm-version',
    config: () => ({ define: { "import.meta.env.VERSION": JSON.stringify(process.env.npm_package_version) } })
  }
};

import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    resolve:{
        alias:{
            '@' : path.resolve(__dirname, './src'),
        },
    },
    build: {
        target: "es2020",
        sourcemap: true,
        minify: mode === "production",
        /*
        rollupOptions: {
            output: {
                manualChunks: {
                    threejs: ['three'],
                    sentry: ['@sentry/vue', '@sentry/tracing'],
                    vendor: ['starknet'],
                    vue: ['vue', 'vuex', 'vue-router']
                }
            }
        }
        */
    },
    test: {
        globals: true,
        environment: 'jsdom',
    },
    // Uncomment to see details on what's going with rollup
    plugins: [vue(), svgLoader(), injectNpmVersion()], //, analyze({ showExports: true }), visualizer({ template: "treemap", sourcemap: true })]
}));
