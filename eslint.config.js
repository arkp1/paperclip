// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*'],
    rules: {
      // Reanimated shared values and imperative gesture handles intentionally
      // expose mutable/ref-like APIs during render; React Compiler rules
      // cannot model them safely.
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      // Existing dialogs synchronize presentation state; keep these visible
      // as warnings rather than blocking lint.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
