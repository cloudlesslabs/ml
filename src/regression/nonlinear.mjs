/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { catchErrors, wrapErrors as e, mergeErrors } from 'puffy-core/error'
import qr from '../linalg/qr.mjs'
import backward from '../linalg/backward.mjs'
import { isZero, mult, transpose } from '../matrix/utils.mjs'

/**
 * Determines the coefficients of linear and nonlinear equations based on the number of points provided.
 * 
 * @param	{[Object]}	points[]
 * @param	{Number}		[0]			x value
 * @param	{Number}		[1]			y value
 * @param	{Object}	options
 * @param	{Number}		.deg		Default 1
 * @param	{Boolean}		.exact		Default true. When true, an error is thrown if not enough points are provided to resolve the system.
 * @param	{[Function]}	.components	Equation components (1). When defined, it overides options.deg
 * 
 * @return	{[Number]}	coefficients
 *
 * (1) Equation's components examples
 * 	- Ax + B = y -> [x => x]
 * 	- Ax^2 + Bx + c = y -> [x => x**2, x => x]
 * 	- Ax^3 + Bx^2 + cx + d = y -> [x => x**3, x => x**2, x => x]
 */
export default function (points, options) {
	const [errors, resp] = catchErrors('Failed to compute nonlinear regression', () => {
		const pointsSize = (points||[]).length
		if (!pointsSize)
			throw e('Missing required \'points\' argument.')

		const { deg:_deg=1, exact=true, components:_components } = options || {}
		const compDeg = (_components||[]).length
		const deg = compDeg || _deg
		const size = deg+1

		if (exact && pointsSize < size)
			throw e(`Missing points, not enough data provided. To resolve nonlinear equation of degree ${deg}, at least ${size} points must be provided. Found ${pointsSize} instead.`)

		const components = compDeg ? _components : [...Array(deg).fill(0).map((_,i) => !i ? x => x : x => x**(i+1)).reverse(), () => 1]
		const invalidCompIdx = components.findIndex(c => typeof(c) != 'function')
		if (invalidCompIdx >= 0)
			throw e(`Wrong argument exception. 'options.components' expects an array of function. Found type ${typeof(components[invalidCompIdx])} in 'options.components${invalidCompIdx}'`)

		const A = Array(size).fill(0).map(() => Array(size))
		const Y = Array(size).fill(0).map(() => ([]))
		for (let i=0;i<size;i++) {
			const row = A[i]
			const [x,y] = points[i]
			const tx = typeof(x)
			const ty = typeof(y)
			if (tx != 'number')
				throw e(`Wrong argument exception. points[${i}][0] is expected to be a number. Found ${tx} instead.`)
			if (ty != 'number')
				throw e(`Wrong argument exception. points[${i}][1] is expected to be a number. Found ${ty} instead.`)
			Y[i][0] = y
			for (let j=0;j<size;j++) {
				const v = components[j](x)
				const tv = typeof(v)
				if (tv != 'number')
					throw e(`Wrong argument exception. Function in components[${j}] is expected to return a number. Found ${tv} instead.`)
				row[j] = v
			}
		}

		const [Q,R] = qr(A)
		const { linearIndependance } = R.reduce((acc,row,i) => {
			if (acc.linearIndependance)
				acc.linearIndependance = !isZero(row[i])
			return acc
		}, { linearIndependance:true })

		if (!linearIndependance)
			throw e(`The ${size} points are not linearly independant. The QR decomposition cannot provide a unique solution to regression.`)

		const coefficients = backward(R, mult(transpose(Q),Y))

		return coefficients
	})
	if (errors)
		throw mergeErrors(errors)
	else
		return resp
}






