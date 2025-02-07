import babel from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import cleanup from 'rollup-plugin-cleanup'

const external = ['react', 'react-dom', 'mobx-react']

const plugins = [
  nodeResolve({
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  }),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: './dist/types',
    outDir: './dist',
  }),
  babel({
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    exclude: 'node_modules/**',
    babelrc: false,
    babelHelpers: 'bundled',
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
      [
        '@babel/plugin-proposal-decorators',
        {
          version: '2023-11',
        },
      ],
    ],
  }),
  cleanup({
    comments: ['some', /PURE/],
    extensions: ['.js', '.ts'],
  }),
]

const replaceDev = isDev =>
  replace({
    '"_EASY_EDITOR_DEV_"': isDev,
    preventAssignment: true,
    delimiters: ['', ''],
  })

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/easy-editor.production.cjs',
        format: 'cjs',
      },
      {
        file: 'dist/easy-editor.production.js',
        format: 'es',
      },
    ],
    plugins: [replaceDev(false)].concat(plugins),
    external,
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/easy-editor.development.cjs',
        format: 'cjs',
      },
      {
        file: 'dist/easy-editor.development.js',
        format: 'es',
      },
    ],
    plugins: [replaceDev(true)].concat(plugins),
    external,
  },
]
