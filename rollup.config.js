import multiInput from 'rollup-plugin-multi-input'
import { nodeResolve } from '@rollup/plugin-node-resolve'
	
export default {
	input: ['src/**/*.mjs'],
	output: {
		dir: 'dist',
		format: 'cjs',
		chunkFileNames: '[name]-[hash].cjs',
		entryFileNames: '[name].cjs',
		exports: 'named'
	},
	plugins:[multiInput(), nodeResolve()],
	external: [
		'complex.js',
		'fraction.js',
		'javascript-natural-sort',
		'escape-latex',
		'seedrandom',
		'tiny-emitter'
	]
}