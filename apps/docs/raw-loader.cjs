/**
 * Turbopack/webpack loader that returns a module's file contents as a raw
 * string. Used for `import code from './file.tsx?raw'` so example source can be
 * rendered verbatim in docs instead of being compiled as a module.
 */
module.exports = function rawLoader(source) {
  return `const code = ${JSON.stringify(source)};\nexport default code;`;
};
