import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

// WORKAROUND=1 sets ENV_TARGET on the ssr environment explicitly.
const ssrDefine = process.env.WORKAROUND ? { ENV_TARGET: JSON.stringify('node') } : {};

export default defineConfig({
  plugins: [federation({ name: 'host', dts: false, manifest: false })],
  // Bundle @module-federation/runtime into the server output so `define` applies to it.
  ssr: { noExternal: true },
  environments: {
    client: {},
    ssr: { define: ssrDefine, build: { outDir: 'dist/server', ssr: 'src/server.mjs' } },
  },
  builder: {
    // Only the server graph matters here.
    buildApp: (builder) => builder.build(builder.environments.ssr),
  },
});
