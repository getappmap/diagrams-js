import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import scss from 'rollup-plugin-scss';
import serve from 'rollup-plugin-serve';
import * as meta from './package.json';

export default {
  input: 'src/js/index.js',
  output: [
    {
      file: `dist/${meta.name}.js`,
      name: 'Appmap',
      format: 'umd',
      globals: {
        d3: 'd3',
      },
    },
  ],
  external: ['d3'],
  plugins: [
    nodeResolve(),
    commonjs(),
    scss({
      watch: 'src/scss',
    }),
    process.env.ROLLUP_WATCH
      ? serve({
        contentBase: ['dist', 'examples'],
      }) : null,
  ],
};
