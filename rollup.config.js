/* eslint-disable flowtype/require-valid-file-annotation, no-console */
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import inject from 'rollup-plugin-inject'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import uglify from 'rollup-plugin-uglify'
import visualizer from 'rollup-plugin-visualizer'

const processShim = '\0process-shim'

const prod = process.env.PRODUCTION
const mode = prod ? 'production' : 'development'
const es = process.env.ES

console.log(`Creating ${mode} bundle...`)

const targets = prod
  ? [
    { dest: 'dist/sandpit.min.js', format: 'umd' }
  ]
  : [
    {
      dest: es ? 'dist/sandpit.es.js' : 'dist/sandpit.js',
      format: es ? 'es' : 'umd'
    }
  ]

const plugins = [
  // Unlike Webpack and Browserify, Rollup doesn't automatically shim Node
  // builtins like `process`. This ad-hoc plugin creates a 'virtual module'
  // which includes a shim containing just the parts the bundle needs.
  {
    resolveId (importee) {
      if (importee === processShim) return importee
      return null
    },
    load (id) {
      if (id === processShim) return 'export default { argv: [], env: {} }'
      return null
    }
  },
  nodeResolve(),
  commonjs(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development')
  }),
  inject({
    process: processShim
  }),
  babel({
    babelrc: false,
    presets: [
      ['latest', { es2015: { modules: false } }]
    ],
    plugins: [
      'transform-object-rest-spread',
      'transform-class-properties'
    ]
  }),
  json()
]

if (prod) plugins.push(uglify(), visualizer({ filename: './bundle-stats.html' }))

export default {
  moduleName: 'Sandpit',
  exports: prod ? 'default' : 'named',
  targets,
  plugins
}
