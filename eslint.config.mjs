import globals from 'globals'
import pluginJS from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  { languageOptions: { globals: globals.node } },
  pluginJS.configs.recommended,
  eslintConfigPrettier
]
