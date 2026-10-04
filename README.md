# ENV_TARGET stays "web" in Vite 8 server environments

Minimal reproduction for `@module-federation/vite` 1.23.1 with Vite 8.3.2 and `@module-federation/runtime` 2.9.2 (Node 24).

With the Environment API (`environments: { client, ssr }`), the plugin writes `ENV_TARGET = "web"` to the root `define`. Vite merges the root `define` into every environment before `configEnvironment` runs, so the plugin's server-environment hook finds `ENV_TARGET` already set and keeps `"web"`. When the server bundle includes the federation runtime (`ssr.noExternal: true`), the Node entry loader is constant-folded away and loading a remote in Node fails.

## Steps

```sh
npm install
npm run defines   # resolved define per environment
npm run build     # builds only the ssr environment (src/server.mjs)
npm start         # serves remote/remoteEntry.js over HTTP and calls loadRemote() from the built server bundle
```

Workaround (setting `ENV_TARGET` on the ssr environment explicitly):

```sh
WORKAROUND=1 npm run build && npm start
```

Removing `ssr: { noExternal: true }` also makes it pass: the runtime is then loaded from `node_modules` at run time, where `define` does not apply.

## Expected

- `npm run defines`: the `ssr` environment has `ENV_TARGET="node"`.
- `npm start`: `OK: hello from widget`.

## Actual

```
$ npm run defines
vite 8.3.2

environments: { client: {}, ssr: {} }
  [configEnvironment, before federation] client: ENV_TARGET="web"
  [configEnvironment, before federation] ssr: ENV_TARGET="web"
  root define.ENV_TARGET="web"
  client (consumer=client): ENV_TARGET="web" FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN=undefined
  ssr (consumer=server): ENV_TARGET="web" FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN=true
...

$ npm start
FAILED: [ Federation Runtime ]: Failed to load script resources. #RUNTIME-008
...
Original Error Message:
 document is not defined
remote entry requests: 0
```

The Node loader is folded out of the server bundle:

```
$ grep -c loadEntryNode dist/server/assets/*.js
0
$ grep -n "inBrowser:" dist/server/assets/*.js
3460:			inBrowser: true
```

With `WORKAROUND=1` the bundle keeps `loadEntryNode`, has `inBrowser: false`, prints `OK: hello from widget`, and the remote entry is requested once.

## Files

- `print-defines.mjs` - `resolveConfig()` with the plugin and `environments: { client: {}, ssr: {} }`; prints each environment's `define`.
- `vite.config.mjs` - ssr environment entry `src/server.mjs`, `ssr.noExternal: true`.
- `src/server.mjs` - `createInstance()` + `loadRemote()` from `@module-federation/runtime`.
- `remote/remoteEntry.js` - a hand-written container (`init` / `get`) in the shape the Node script loader evaluates.
- `run.mjs` - serves the remote entry on an ephemeral port and calls the built `render()`.
