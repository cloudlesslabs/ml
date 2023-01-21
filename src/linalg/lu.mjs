/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * This code is a modification of this original code:
 * 
 * https://github.com/rayyamhk/Matrix.js/blob/f46fb9b22b35251ff21abb4d018d12f6e2a71596/src/core/decompositions/LU.js
 * 
 * This code was published under the following license:
 * 
 * MIT License
 * 
 * Copyright (c) 2020 Rayyamhk
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
*/

import { catchErrors, wrapErrors as e, mergeErrors } from 'puffy-core/error'
import { reshape, generate, EPSILON } from '../matrix/utils.mjs'

/**
 * Calculates the LUP decomposition of the Matrix,
 * where L is lower triangular matrix which diagonal entries are always 1,
 * U is upper triangular matrix, and P is permutation matrix.<br><br>
 * 
 * It is implemented using Gaussian Elimination with Partial Pivoting in order to
 * reduce the error caused by floating-point arithmetic.<br><br>
 * 
 * Note that if optimized is true, P is a Permutation Array and both L and U are merged
 * into one matrix in order to improve performance.
 * @memberof Matrix
 * @static
 * @param {Matrix} A - Any matrix
 * @param {boolean} [optimized=false] - Returns [P, LU] if it is true, [P, L, U] if it is false
 * @returns {Matrix[]} The LUP decomposition of Matrix
 */
export default function LU(data, optimized = false) {
	const [errors, resp] = catchErrors('Failed to compute LU decomposition', () => {
		if (!data)
			throw e('Missing required argument \'data\'')
		if ((!data.length))
			throw e('Wrong argument exception. \'data\' canot be empty')

		const matrix = Array.isArray(data[0]) ? data : reshape(data).matrix
		const row = matrix.length
		const col = matrix[0].length
		const size = Math.min(row, col)
		
		const permutation = initPermutation(row)
		const copy = matrix.map(row => ([...row]))

		for (let i = 0; i < row - 1; i++) {
			const currentCol = Math.min(i, col)

			// apply Partial Pivoting
			PartialPivoting(copy, permutation, currentCol, row, col)

			const ith = permutation[i]
			const pivot = copy[ith][currentCol]

			if (Math.abs(pivot) < EPSILON)
				continue

			for (let j = i + 1; j < row; j++) {
				const jth = permutation[j]
				const entry = copy[jth][currentCol]

				if (Math.abs(entry) >= EPSILON) {
					const factor = entry / pivot
					for (let k = currentCol; k < col; k++)
						copy[jth][k] -= factor * copy[ith][k]
					copy[jth][currentCol] = factor
				}
			}
		}

		const result = new Array(row)
		for (let i = 0; i < row; i++)
			result[i] = copy[permutation[i]]

		if (optimized)
			return [permutation, result]

		const P = generate(row, row, (i, j) => permutation[i] === j ? 1 : 0)
		const L = generate(row, size, (i, j) => i === j ? 1 : i < j ? 0 : result[i][j])
		const U = generate(size, col, (i, j) => i > j ? 0 : result[i][j])

		return [P, L, U]
	})
	if (errors)
		throw mergeErrors(errors)
	else
		return resp
}

const initPermutation = size => {
	const permutation = new Array(size)
	for (let i = 0; i < size; i++)
		permutation[i] = i
	
	return permutation
}

const PartialPivoting = (matrix, permutation, pos, row, col) => {
	const currentCol = Math.min(pos, col)
	let maxIdx = pos
	let max = Math.abs(matrix[permutation[pos]][currentCol])
	for (let i = pos + 1; i < row; i++) {
		const value = Math.abs(matrix[permutation[i]][currentCol])
		if (value > max) {
			maxIdx = i
			max = value
		}
	}
	const t = permutation[pos]
	permutation[pos] = permutation[maxIdx]
	permutation[maxIdx] = t
}





