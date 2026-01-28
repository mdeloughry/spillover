import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react(), tailwind()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4321,
  },
});
