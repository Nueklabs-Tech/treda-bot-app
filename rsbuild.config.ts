import path from 'path';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

loadEnv({ mode: 'production' });

const isStaticBuild = process.env.NEXT_PUBLIC_APP_BUILD === 'true';

// `rsbuild dev` sets NODE_ENV to development; `rsbuild build` sets it to production.
const isDev = process.env.NODE_ENV !== 'production';

// Dev-only same-origin proxy for the Deriv REST API. Those calls carry an
// Authorization header, so the browser preflights them, and the preflight is rejected
// intermittently when the app is served from a tunnel (ngrok) origin — taking the OAuth
// callback's accounts fetch down with it. Routing through the dev server makes the call
// same-origin, so no preflight is ever sent. Production builds talk to the host directly
// (empty prefix). See src/utils/deriv-api-proxy.ts.
const DERIV_API_PROXY_PREFIX = '/deriv-api';
const DERIV_API_HOST =
    process.env.NEXT_PUBLIC_DERIV_ENV === 'preview' ? 'https://staging-api.derivws.com' : 'https://api.derivws.com';

const smartchartsDist = path.join(
    path.dirname(require.resolve('@deriv-com/smartcharts-champion/package.json')),
    'dist'
);

export default defineConfig({
    plugins: [
        pluginSass({
            sassLoaderOptions: {
                sourceMap: true,
            },
            exclude: /node_modules/,
        }),
        pluginReact(),
    ],

    source: {
        entry: {
            index: './src/main.tsx',
        },

        define: {
            'process.env': {
                NEXT_PUBLIC_DERIV_APP_ID: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_APP_ID ?? ''),
                NEXT_PUBLIC_DERIV_ENV: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_ENV ?? ''),
                NEXT_PUBLIC_DERIV_REDIRECT_URI: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? ''),
                NEXT_PUBLIC_DERIV_REFERRAL_LINK: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ?? ''),
                NEXT_PUBLIC_DERIV_APP_NAME: JSON.stringify(process.env.NEXT_PUBLIC_DERIV_APP_NAME ?? ''),
                NEXT_PUBLIC_APP_BUILD: JSON.stringify(process.env.NEXT_PUBLIC_APP_BUILD ?? ''),
                NEXT_PUBLIC_DERIV_API_PROXY: JSON.stringify(isDev ? DERIV_API_PROXY_PREFIX : ''),
                GD_CLIENT_ID: JSON.stringify(process.env.GD_CLIENT_ID ?? ''),
                GD_APP_ID: JSON.stringify(process.env.GD_APP_ID ?? ''),
                GD_API_KEY: JSON.stringify(process.env.GD_API_KEY ?? ''),
            },
        },

        alias: {
            react: path.dirname(require.resolve('react/package.json')),
            'react-dom': path.dirname(require.resolve('react-dom/package.json')),

            '@/external': path.resolve(__dirname, './src/external'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/constants': path.resolve(__dirname, './src/constants'),
            '@/stores': path.resolve(__dirname, './src/stores'),
        },
    },

    output: {
        assetPrefix: isStaticBuild ? '/bot/preview/' : '/',

        distPath: {
            root: isStaticBuild ? 'out/preview' : 'dist',
        },

        copy: [
            {
                from: path.join(smartchartsDist, '*'),
                to: 'js/smartcharts/[name][ext]',
                globOptions: {
                    ignore: ['**/*.LICENSE.txt'],
                },
            },
            {
                from: path.join(smartchartsDist, 'chart'),
                to: 'js/smartcharts/chart',
            },
            {
                from: path.join(smartchartsDist, 'assets'),
                to: 'js/smartcharts/assets',
            },
            {
                from: path.join(smartchartsDist, 'assets/*'),
                to: 'assets/[name][ext]',
            },
            {
                from: path.join(smartchartsDist, 'assets/fonts/*'),
                to: 'assets/fonts/[name][ext]',
            },
            {
                from: path.join(smartchartsDist, 'assets/shaders/*'),
                to: 'assets/shaders/[name][ext]',
            },
            {
                from: path.join(__dirname, 'public'),
            },
        ],
    },

    html: {
        template: './index.html',
    },

    server: {
        compress: true,

        proxy: isDev
            ? {
                  [DERIV_API_PROXY_PREFIX]: {
                      target: DERIV_API_HOST,
                      changeOrigin: true,
                      pathRewrite: { [`^${DERIV_API_PROXY_PREFIX}`]: '' },
                  },
              }
            : undefined,
    },

    dev: {
        hmr: true,
    },

    tools: {
        rspack: {
            module: {
                rules: [
                    {
                        test: /\.xml$/,
                        exclude: /node_modules/,
                        use: 'raw-loader',
                    },
                ],
            },
        },
    },
});
