import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';

export default {
  input: 'src/appmap.js',
  output: {
    file: 'dist/d3-appmap.js',
    name: 'appmap',
    format: 'es'
  },
  // external: ['d3'],
  plugins: [nodeResolve(), commonjs(), serve({
    contentBase: ['dist', 'examples']
  })]
};
