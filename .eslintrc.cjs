const eslintrc = require('@chubbyts/chubbyts-eslint/dist/eslintrc').default;

module.exports = {
  ...eslintrc,
  rules: {
    ...eslintrc.rules,
    'functional/prefer-tacit': 'off'
  }
};
