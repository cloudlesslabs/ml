/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * This code is a modification of this original code:
 * 
 * https://github.com/rayyamhk/Matrix.js/blob/f46fb9b22b35251ff21abb4d018d12f6e2a71596/src/core/decompositions/QR.js
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

import { reshape, identity, EPSILON } from '../matrix/utils.mjs'

export default function (data) {
	if (!data)
		throw new Error('Missing required argument \'data\'')
	if ((!data.length))
		throw new Error('Wrong argument exception. \'data\' canot be empty')

	const matrix = Array.isArray(data[0]) ? data : reshape(data).matrix
	const row = matrix.length
	const col = matrix[0].length
	const size = Math.min(row, col)

	const matrixR = matrix.map(row => ([...row]))
	const matrixQ = identity(row)

	for (let j = 0; j < size; j++) {
		// if all entries below main diagonal are considered as zero, skip this round
		let skip = true
		for (let i = j + 1; i < row; i++)
			if (Math.abs(matrixR[i][j]) >= EPSILON) {
				skip = false
				break
			}

		if (!skip) {
			// Apply Householder transform
			let norm = 0
			for (let i = j; i < row; i++) 
				norm += matrixR[i][j] ** 2
			
			norm = Math.sqrt(norm)

			// reduce floating point arithmatic error
			let s = -1
			if (matrixR[j][j] < 0)
				s = 1
			
			const u1 = matrixR[j][j] - s * norm

			let w = new Array(row - j)
			for (let i = 0; i < row - j; i++)
				w[i] = matrixR[i + j][j] / u1
			
			w[0] = 1

			const tau = (-1 * s * u1) / norm

			const subR = new Array(row - j)
			for (let i = 0; i < row - j; i++) {
				const newRow = new Array(col)
				for (let k = 0; k < col; k++)
					newRow[k] = matrixR[j + i][k]
				
				subR[i] = newRow
			}

			for (let i = j; i < row; i++) {
				for (let k = 0; k < col; k++) {
					let summation = 0
					for (let m = 0; m < row - j; m++)
						summation += subR[m][k] * w[m]
					
					matrixR[i][k] = subR[i - j][k] - tau * w[i - j] * summation
				}
			}

			const subQ = new Array(row)
			for (let i = 0; i < row; i++) {
				const newRow = new Array(row - j)
				for (let k = 0; k < row - j; k++)
					newRow[k] = matrixQ[i][j + k]
				
				subQ[i] = newRow
			}

			for (let i = 0; i < row; i++) {
				for (let k = j; k < row; k++) {
					let summation = 0
					for (let m = 0; m < row - j; m++)
						summation += subQ[i][m] * w[m]
					
					matrixQ[i][k] = subQ[i][k - j] - tau * w[k - j] * summation
				}
			}
		}
	}

	for (let i = 0; i < row; i++) 
		for (let j = 0; j < col; j++)
			if (i > j)
				matrixR[i][j] = 0

	return [matrixQ, matrixR]
}




