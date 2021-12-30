import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'

svgLoader({
    svgoConfig: {
        multipass: true
    }
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    build: {
        target: "es2020",
        sourcemap: mode === "production",
        /*
        minify: false,
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
    plugins: [vue(), svgLoader()]
}));
