const typescript = require('@rollup/plugin-typescript');
const postcss = require('rollup-plugin-postcss');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    postcss({
      modules: true,
      extract: true,
      minimize: true,
      sourceMap: true
    }),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: ['@ai-yuugen/types', '@ai-yuugen/sdk', 'react', 'vue', '@angular/core']
};