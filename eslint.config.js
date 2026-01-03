import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Enable recommended rules
  ...tseslint.configs.recommended,
  // Enable strict rules
  ...tseslint.configs.strict,
  // Disable some rules that are too strict for this project
  {
    rules: {
      // Allow unused variables for some cases
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Allow any type for now (渐进式类型安全)
      '@typescript-eslint/no-explicit-any': 'off',
      // 允许 any 类型用于 React ref
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      // 允许 any 类型用于事件处理器
      '@typescript-eslint/ban-types': 'off',
      // 允许空函数
      '@typescript-eslint/no-empty-function': 'off',
      // 允许使用 _ 前缀表示未使用的参数
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // React specific rules
  {
    plugins: {
      react: await import('eslint-plugin-react'),
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Ignore node_modules
  {
    ignores: ['node_modules/', 'dist/', 'build/', '*.min.js'],
  }
);
