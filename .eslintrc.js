module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ["prettier", "eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-multiple-empty-lines": [2, {"max": 2}]
  },
}
