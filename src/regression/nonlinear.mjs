/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { catchErrors, wrapErrors as e, mergeErrors } from 'puffy-core/error'
import { sortBy } from 'puffy-core/collection'
import { percentile } from 'puffy-core/math'
import qr from '../linalg/qr.mjs'
import backward from '../linalg/backward.mjs'
import { isZero, dot, transpose, min, add, mult, vectorNorm } from '../matrix/utils.mjs'

const LEARNING_RATE = 0.5

const _void = () => null

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
					throw e(`Expecting a list of ${lastIdx} coefficients in order to get the ${lastIdx == 1 ? '2nd' : lastIdx == 2 ? '3rd' : `${lastIdx+1}th`} coefficient. Received ${coeffs.length} coefficient(s) instead.`)
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
const nonlinearRegression = (points, options) => {
	const [errors, resp] = catchErrors('Failed to compute nonlinear regression', () => {
		const pointsSize = (points||[]).length
		if (!pointsSize)
			throw e('Missing required \'points\' argument.')

		const { deg:_deg=1, components:_components, getNextCoeff } = options || {}
		const compDeg = (_components||[]).length
		const deg = compDeg ? compDeg-1 : _deg
		const size = deg+1

		if (pointsSize < size)
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

		const coefficients = backward(R, dot(transpose(Q),Y))
		if (getNextCoeff)
			coefficients.push([getNextCoeff(coefficients)])

		return coefficients
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
 * @param	{Number}		[0]					x value
 * @param	{Number}		[1]					y value
 * @param	{Object}	options
 * @param	{Number}		.deg				Default 1
 * @param	{Boolean}		.exact				Default true. When true, an error is thrown if not enough points are provided to resolve the system.
 * @param	{[Function]}	.components			Equation components (1). When defined, it overides options.deg
 * @param	{Function}		.getNextCoeff		Gets the next coefficients if the system was simplified (same function as output 'getCoeff' of the 'decreaseLinearComplexity' function)
 * @param	{Function}		.onFit				Callback (fit,epoch) => ... Fired each time a fit is found.
 * @param	{[Object]}		.pointConstraints	Point that the linear equation MUST solve exactly.
 * @param	{Number}			[0]				
 * @param	{Number}			[1]				
 * 
 * @return	{Number}	bestFit
 * @return	{Number}		.err
 * @return	{[[Number]]}	.coeffs
 * @return	{[Function]}	.components
 * @return	{Function}		.fy
 *
 * (1) Equation's components examples
 * 	- Ax + B = y -> [x => x, x => 1]
 * 	- Ax^2 + Bx + c = y -> [x => x**2, x => x, , x => 1]
 * 	- Ax^3 + Bx^2 + cx + d = y -> [x => x**3, x => x**2, x => x, , x => 1]
 */
const nonlinearGradientDescentRegression = (_points, options) => {
	const [errors, resp] = catchErrors('Failed to compute nonlinear regression using iterative gradient descent', () => {
		// Validates the input
		const pointsSize = (_points||[]).length
		if (!pointsSize)
			throw e('Missing required \'points\' argument.')

		const { deg:_deg=1, components:_components, epochs=50, initEpochs=5, onFit, pointConstraints, learningRate:_learningRate } = options || {}
		const lr = _learningRate || LEARNING_RATE
		const compDeg = (_components||[]).length
		const deg = compDeg ? compDeg-1 : _deg
		let size = deg+1

		if (pointsSize < size)
			throw e(`Missing points, not enough data provided. To resolve nonlinear equation of degree ${deg}, at least ${size} points must be provided. Found ${pointsSize} instead.`)

		const __components = compDeg ? _components : getPolynomeComponents(deg)
		let components = __components

		const fyComponentsCoeffs = components => coeffs => {
			const s = coeffs.length
			return x => {
				let y = 0
				for(let i=0;i<s;i++)
					y += coeffs[i][0]*components[i](x)
				return y
			}
		}

		const computePointsLoss = points => fy => {
			let err = 0
			for (let i=0;i<pointsSize;i++) {
				const point = points[i]
				err += (fy(point[0]) - point[1])**2
			}
			return err/pointsSize
		}

		let points = [..._points],
			expandCoeffsFns = null
		if (pointConstraints && pointConstraints.length) {
			const l = pointConstraints.length
			const uniquePointConstraints = {}
			for (let i=0;i<l;i++) {
				if (!Array.isArray(pointConstraints[i]))
					throw e(`Invalid 'options.pointConstraints[${i}]'. Expecting an array, found ${typeof(pointConstraints[i])} instead.`)
				const [x,y] = pointConstraints[i]
				if (typeof(x) != 'number' || isNaN(x) || typeof(y) != 'number' || isNaN(y))
					throw e(`Invalid 'options.pointConstraints[${i}]'. Expecting an array [x,y] where x and y are both numbers. Found [${x},${y}] instead.`)

				const key = `${x}_${y}`
				if (!uniquePointConstraints[key])
					uniquePointConstraints[key] = [x,y]
			}
			let constraints = Object.values(uniquePointConstraints)
			const ll = constraints.length
			if (size == ll) {
				const computeLoss = computePointsLoss(points)
				const coeffs = nonlinearRegression(constraints, { components })
				const fy = fyComponentsCoeffs(components)(coeffs)
				const err = computeLoss(fy)
				return {
					err,
					coeffs,
					components,
					fy
				}
			} else if (ll > size)
				throw e(`Too many point constraints in 'options.pointConstraints'. The degree of the current nonlinear equation is ${deg}. A maximum of ${size} points fully resolve this system.`)
			else {
				for (let i=0;i<ll;i++) {
					const [x,y] = constraints[i]
					const { components:simplifiedComponents, remap, getCoeff } = decreaseLinearComplexity(components, [x,y])
					
					points = remap(points)
					constraints = remap(constraints)
					components = simplifiedComponents
					if (!expandCoeffsFns)
						expandCoeffsFns = []
					const previousExpandCoeffsFn = expandCoeffsFns.slice(-1)[0]
					expandCoeffsFns.push(previousExpandCoeffsFn 
						? coeffs => {
							const previousCoeffs = [...coeffs, [getCoeff(coeffs)]]
							return previousExpandCoeffsFn(previousCoeffs)
						}
						: coeffs => [...coeffs, [getCoeff(coeffs)]]
					)
					size = size-1
				}
			}
		}

		const fyCoeffs = fyComponentsCoeffs(components)
		const computeLoss = computePointsLoss(points)

		// Prepares the data so that we can pick stable random points for the next coefficients initialization step.
		// The procedure consists in sorting (asc) the points on the first axis (e.g., x-axis) and then grouping in 
		// 'size' zone based on the percentile (e.g., if size is 4, then take 25th, 50th, 75th and 100th percentiles).
		const xs = points.map(p => p[0])
		const sortedPoints = sortBy(points||[], p => p[0])
		const percentileStep = Math.round(100/size)
		const pointsZones = Array(size)
		let endIdx = 0
		for (let i=0;i<size;i++) {
			const p = percentile((i+1)*percentileStep)(xs)
			if (i+1 == size)
				pointsZones[i] = [endIdx, pointsSize-1]
			else {
				const idx = sortedPoints.findIndex(([x]) => x == p)
				pointsZones[i] = [endIdx, idx]
				endIdx = idx+1
			}
		}

		const getRandomPoints = () => pointsZones.map(([startIdx, endIdx]) => {
			const i = startIdx + Math.round(Math.random()*(endIdx - startIdx))
			const p = sortedPoints[i]
			return p
		})

		// Computes multiple exact fit using random points. This is done to initialize the coefficients vector 
		// so that the gradient descent (next step) starts as close as possible to a local minimum.
		let bestFit, secondBestFit
		for (let i=0;i<initEpochs;i++) {
			try {
				const randomPoints = getRandomPoints()
				const coeffs = nonlinearRegression(randomPoints, { components })

				const err = computeLoss(fyCoeffs(coeffs))
				const fit = { err, coeffs }
				if (!bestFit)
					bestFit = fit
				else if (bestFit.err > err) {
					secondBestFit = { ...bestFit }
					bestFit = fit
				} else if (!secondBestFit || secondBestFit.err > err)
					secondBestFit = fit
			} catch(err) {
				_void(err)
			}
		}

		if (!secondBestFit) { // Deals with the case where secondBestFit could not be set
			const newCoeffs = bestFit.coeffs.map(([c]) => ([1.05*c]))
			const err = computeLoss(fyCoeffs(newCoeffs))
			const fit = { err, coeffs:newCoeffs }
			if (bestFit.err > err) {
				secondBestFit = { ...bestFit }
				bestFit = fit
			} else
				secondBestFit = fit
		}

		if (onFit)
			onFit(bestFit, 0)

		const errDelta = secondBestFit.err-bestFit.err
		if (isZero(errDelta)) // We've found the best possible fit. No need to perform a gradient descent.
			return bestFit.coeffs

		let learningRate = lr
		for (let i=0;i<epochs;i++) {
			// Coeff amount that yielded an decrease of 'errDelta' error amount.
			// const gradient = min(bestFit.coeffs,secondBestFit.coeffs)
			const delta = mult(min(secondBestFit.coeffs,bestFit.coeffs), learningRate)
			const n = vectorNorm(delta)
			if (isZero(n))
				break

			let nextCoeffs = add(bestFit.coeffs, delta)
			let err = computeLoss(fyCoeffs(nextCoeffs))
			if (bestFit.err < err) {
				const nextCoeffs2 = min(bestFit.coeffs, delta)
				const err2 = computeLoss(fyCoeffs(nextCoeffs2))
				if (err2 < err) {
					err = err2
					nextCoeffs = nextCoeffs2
				}
			}
			const fit = { err, coeffs:nextCoeffs }

			if (bestFit.err > err) {
				secondBestFit = { ...bestFit }
				bestFit = fit
				if (onFit)
					onFit(bestFit, i+1)
				learningRate = lr
			} else {
				if (learningRate > 0.2)
					learningRate -= 0.1
				else if (learningRate > 0.05)
					learningRate -= 0.05
				else if (learningRate > 0.01)
					learningRate -= 0.01
				
				learningRate = Math.round(learningRate*100)/100
				if (secondBestFit.err > err)
					secondBestFit = fit
			}
		}

		if (expandCoeffsFns)
			bestFit.coeffs = expandCoeffsFns.slice(-1)[0](bestFit.coeffs)

		bestFit.components = __components
		bestFit.fy = fyComponentsCoeffs(__components)(bestFit.coeffs)

		return (bestFit)
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
	const { exact=true } = options || {}
	return exact ? nonlinearRegression(points, options) : nonlinearGradientDescentRegression(points, options)
}






