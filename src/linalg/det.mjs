/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * This code is a modification of this original code:
 * 
 * https://github.com/rayyamhk/Matrix.js/blob/f46fb9b22b35251ff21abb4d018d12f6e2a71596/src/core/properties/det.js 
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

import { reshape } from '../matrix/utils.mjs'
import lu from './lu.mjs'

export default function det(data) {
	const { matrix } = reshape(data)

	const size = matrix.length

	if (size === 0)
		return 1 // the determinant of 0x0 matrix must be 1

	if (size === 1)
		return matrix[0][0]

	if (size === 2)
		return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]

	if (size === 3)
		return matrix[0][0] * matrix[1][1] * matrix[2][2]
		+ matrix[0][1] * matrix[1][2] * matrix[2][0]
		+ matrix[0][2] * matrix[1][0] * matrix[2][1]
		- matrix[0][2] * matrix[1][1] * matrix[2][0]
		- matrix[0][1] * matrix[1][0] * matrix[2][2]
		- matrix[0][0] * matrix[1][2] * matrix[2][1]

	const [P, LU] = lu(matrix, true)

	// count whether the number of permutations <swap> is odd or even
	// O(n^2)
	let swap = 0
	for (let i = 0; i < size; i++) {
		if (P[i] === i)
			continue
		
		while (P[i] !== i) {
			const target = P[i]
			P[i] = P[target]
			P[target] = target
			swap++
		}
	}

	let result = 1
	for (let i = 0; i < size; i++)
		result *= LU[i][i]

	if (swap % 2 === 1)
		return result * -1
	
	return result
}

