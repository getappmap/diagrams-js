import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import scss from 'rollup-plugin-scss';
import serve from 'rollup-plugin-serve';
import { terser } from 'rollup-plugin-terser';
import { writeFileSync } from 'fs';
import * as meta from './package.json';

export default [
  {
    input: 'src/js/index.js',
    output: [
      {
        file: `dist/${meta.name}.umd.js`,
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
        output(styles) {
          writeFileSync(`dist/${meta.name}.css`, styles);
        },
      }),
      process.env.ROLLUP_WATCH
        ? serve({
          contentBase: ['dist', 'examples'],
        }) : null,
      !process.env.ROLLUP_WATCH ? terser() : null,
    ],
  },
  {
    input: 'src/js/index.js',
    output: [
      {
        file: `dist/${meta.name}.esm.js`,
        format: 'esm',
      },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      scss({ output: false }),
    ],
  },
];
