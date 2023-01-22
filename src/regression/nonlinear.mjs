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

export const getPolynomeComponents = (deg=1) => [...Array(deg).fill(0).map((_,i) => !i ? x => x : x => x**(i+1)).reverse(), () => 1]

/**
 * Decreases the complexity of a set of linear equations by using a single training point.
 * 
 * @param	{[Function]}	components			e.g., a polynome of degree 2 [x => x**2, x => x, , x => 1]
 * @param	{Object}		point
 * @param	{Number}			.x
 * @param	{Number}			.y
 * 
 * @return	{Object}		simplifiedSystem
 * @return	{[Function]}		.components			
 * @return	{Function}			.yMap			(x,y) => newY. This function adjust the point from the original system to fit the simplified system.
 * @return	{Function}			.remap			(points) => newPoints. Applies the 'yMap' function to a set of points
 * @return	{Function}			.getCoeff		(simplifiedCoeffs) => coeff. Once the simplified system is resolved, used them to get the last complex system coeff.
 */
export const decreaseLinearComplexity = (components, point) => {
	const [errors, resp] = catchErrors('Failed to decrease by one the dimension of the linear complexity', () => {
		if (!components)
			throw e('Missing required argument \'components\'')
		if (!point)
			throw e('Missing required argument \'point\'')
		const [x,y] = point
		if (typeof(x) != 'number' || isNaN(x))
			throw e(`Wrong argument exception. 'point[0]' must be a number. Found ${x} instead.`)
		if (typeof(y) != 'number' || isNaN(y))
			throw e(`Wrong argument exception. 'point[0]' must be a number. Found ${y} instead.`)
		const dim = components.length
		if (!dim)
			throw e('\'components\' cannot be empty')

		if (dim < 2)
			return [...components]

		const lastIdx = dim-1
		const componentN = components[lastIdx]
		const xis = components.map(fn => fn(x))
		const xn = xis[lastIdx]
		if (isZero(xn))
			throw e(`Unstable system. The point [${x},${y}] generates an xN close or equal to zero.`)

		const newXis = xis.slice(0,-1).map(v => -v/xn)
		const newY = y/xn

		const getCoeff = coeffs => {
			const [errors, resp] = catchErrors('Failed to remap points to adjust for linear complexity decrease.', () => {
				if (!coeffs)
					throw e('Missing required \'coeffs\' matrix')
				if (coeffs.length != lastIdx)
					throw e(`Expecting a list of ${lastIdx} coefficients in order to get the ${lastIdx == 1 ? '2nd' : lastIdx == 2 ? '3rd' : `${lastIdx+1}th`} coefficient.`)
				return coeffs.reduce((acc,c,i) => {
					const coeff = Array.isArray(c) ? c[0] : c
					if (typeof(coeff) != 'number' || isNaN(coeff))
						throw e(`coeffs[${i}]${Array.isArray(c) ? '[0]' : ''} is not a number.`)
					return acc + coeff*newXis[i]
				},newY)
			})
			if (errors)
				throw mergeErrors(errors)
			else
				return resp
		}

		const yMap = (xx,yy) => yy - newY*componentN(xx)
		const newComponents = Array(lastIdx)
		for (let i=0;i<lastIdx;i++){
			const fn = components[i]
			const K = newXis[i]
			newComponents[i] = v => fn(v) + K*componentN(v)
		}

		const remap = pts => {
			const [errors, resp] = catchErrors('Failed to remap points to adjust for linear complexity decrease.', () => {
				if (!pts)
					throw e('Missing required \'points\' argument')
				if (!Array.isArray(pts))
					throw e(`Wrong argument exception. 'points' is expected to be an array. Found ${typeof(pts)} instead.`)
				return pts.map(([x,y]) => ([x,yMap(x,y)]))
			})
			if (errors)
				throw mergeErrors(errors)
			else
				return resp
		}

		return {
			components: newComponents,
			yMap,
			remap,
			getCoeff
		}
	}) 
	if (errors)
		throw mergeErrors(errors)
	else
		return resp
}




/**
 * Determines the coefficients of linear and nonlinear equations based on the number of points provided.
 * 
 * @param	{[Object]}	points[]
 * @param	{Number}		[0]				x value
 * @param	{Number}		[1]				y value
 * @param	{Object}	options
 * @param	{Number}		.deg			Default 1
 * @param	{Boolean}		.exact			Default true. When true, an error is thrown if not enough points are provided to resolve the system.
 * @param	{[Function]}	.components		Equation components (1). When defined, it overides options.deg
 * @param	{Function}		.getNextCoeff	Gets the next coefficients if the system was simplified (same function as output 'getCoeff' of the 'decreaseLinearComplexity' function)
 * 
 * @return	{[Number]}	coefficients
 *
 * (1) Equation's components examples
 * 	- Ax + B = y -> [x => x, x => 1]
 * 	- Ax^2 + Bx + c = y -> [x => x**2, x => x, , x => 1]
 * 	- Ax^3 + Bx^2 + cx + d = y -> [x => x**3, x => x**2, x => x, , x => 1]
 */
export default function (points, options) {
	const [errors, resp] = catchErrors('Failed to compute nonlinear regression', () => {
		const pointsSize = (points||[]).length
		if (!pointsSize)
			throw e('Missing required \'points\' argument.')

		const { deg:_deg=1, exact=true, components:_components, getNextCoeff } = options || {}
		const compDeg = (_components||[]).length
		const deg = compDeg ? compDeg-1 : _deg
		const size = deg+1

		if (exact && pointsSize < size)
			throw e(`Missing points, not enough data provided. To resolve nonlinear equation of degree ${deg}, at least ${size} points must be provided. Found ${pointsSize} instead.`)

		const components = compDeg ? _components : getPolynomeComponents(deg)
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
		if (getNextCoeff)
			coefficients.push([getNextCoeff(coefficients)])

		return coefficients
	})
	if (errors)
		throw mergeErrors(errors)
	else
		return resp
}






