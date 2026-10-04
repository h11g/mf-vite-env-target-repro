import { createInstance } from '@module-federation/runtime';

export async function render(entry) {
  const mf = createInstance({ name: 'host', remotes: [{ name: 'widget', entry }] });
  const mod = await mf.loadRemote('widget/hello');
  return mod.default;
}
