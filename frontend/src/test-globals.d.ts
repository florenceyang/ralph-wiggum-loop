/**
 * Ambient declarations for the test environment.
 *
 * Some unit tests stub `global.fetch` directly (the Node/Vitest global
 * object) rather than `globalThis.fetch`. `@types/node` isn't a project
 * dependency, so declare the minimal `global` alias here to keep `tsc`
 * happy without adding a new dependency.
 */
export {}

declare global {
  // eslint-disable-next-line no-var
  var global: typeof globalThis
}
