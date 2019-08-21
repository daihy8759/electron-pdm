module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'airbnb-base',
  globals: {
    __static: true
  },
  plugins: [
    'vuefix',
    'html'
  ],
  'rules': {
    'global-require': 0,
    'import/no-unresolved': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'import/extensions': 0,
    'import/newline-after-import': 0,
    'no-multi-assign': 0,
    'consistent-return': 0,
    'no-underscore-dangle': 0,
    'import/no-extraneous-dependencies': 0,
    'no-plusplus': 0,
    'no-console': 0,
    'no-mixed-operators': 0,
    'no-await-in-loop': 0
  }
}
