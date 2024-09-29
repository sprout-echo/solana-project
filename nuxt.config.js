// https://nuxt.com/docs/api/configuration/nuxt-config
import { Buffer } from 'buffer'
import inject from '@rollup/plugin-inject'
import Inspect from 'vite-plugin-inspect'

const port = process.env.PORT || 3066;

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  devServer: { port },
  modules: [
    "@element-plus/nuxt",
  ],
  vite: {
    define: {
      "global": {},
      "process.env.NODE_DEBUG": JSON.stringify("")
    },
    plugins: [
      inject({
        Buffer: ['buffer', 'Buffer']
      }),
      Inspect(),
    ],
  }
})
