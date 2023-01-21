/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * This code is a modification of this original code:
 * 
 * https://github.com/rayyamhk/Matrix.js/blob/f46fb9b22b35251ff21abb4d018d12f6e2a71596/src/core/linear-equations/backward.js
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

import { isUpperTriangular, isZero, reshape } from '../matrix/utils.mjs'

export default function backward(data, y) {
	if (!data)
		throw new Error('Missing required argument \'data\'')
	if (!y)
		throw new Error('Missing required argument \'y\'')
	const yl = y.length
	if (!yl)
		throw new Error('Wrong argument exception. \'y\' cannot be an empty array.')
	if ((!data.length))
		throw new Error('Wrong argument exception. \'data\' canot be empty')

	const U = Array.isArray(data[0]) ? data : reshape(data).matrix
	const Y = Array.isArray(y[0]) ? y : y.map(v => ([v]))
	if (!isUpperTriangular(U))
		throw new Error('Failed to run backward substitution. Matrix is not square upper triangular.')

	const size = U.length

	if (yl !== size)
		throw new Error(`Incompatible size error. The square upper triangular matrix U (size: ${size}) is not compatible with the Y vector (length: ${yl}).`)

	for (let i = 0; i < size; i++)
		if (isZero(U[i][i]))
			throw new Error('Failed to run backward substitution. The square upper triangular matrix U contains one or more diagonal values equal to zero, which will lead to non unique solutions.')

	const coefficients = Array(size).fill(1).map(v => ([v]))

	for (let i = size - 1; i >= 0; i--) {
		const Urow = U[i]
		let summation = 0
		for (let j = i + 1; j < size; j++)
			summation += coefficients[j][0] * Urow[j]

		coefficients[i][0] = (Y[i][0] - summation) / Urow[i]
	}

	return coefficients
}




