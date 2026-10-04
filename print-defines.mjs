import { resolveConfig, version } from 'vite';
import { federation } from '@module-federation/vite';

// Logs what each environment's define looks like before the federation plugin's
// configEnvironment hook runs (enforce: 'pre' puts it first).
const spy = {
  name: 'spy',
  enforce: 'pre',
  configEnvironment(name, config) {
    console.log(`  [configEnvironment, before federation] ${name}: ENV_TARGET=${config.define?.ENV_TARGET}`);
  },
};

async function print(label, extra = {}) {
  console.log(`\n${label}`);
  const config = await resolveConfig(
    {
      configFile: false,
      logLevel: 'silent',
      plugins: [spy, federation({ name: 'host', dts: false, manifest: false })],
      environments: { client: {}, ssr: {} },
      ...extra,
    },
    'build'
  );
  console.log(`  root define.ENV_TARGET=${config.define?.ENV_TARGET}`);
  for (const [name, env] of Object.entries(config.environments)) {
    console.log(
      `  ${name} (consumer=${env.consumer}): ENV_TARGET=${env.define?.ENV_TARGET}` +
        ` FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN=${env.define?.FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN}`
    );
  }
}

console.log(`vite ${version}`);
await print('environments: { client: {}, ssr: {} }');
await print('control: ssr sets ENV_TARGET explicitly', {
  environments: { client: {}, ssr: { define: { ENV_TARGET: JSON.stringify('node') } } },
});
