/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'.
// To only run a test, use 'it.only' instead of 'it'.
// Chai assert API: https://www.chaijs.com/api/assert/

import { assert } from 'chai'
import { nonlinear, getPolynomeComponents, decreaseLinearComplexity } from '../src/regression/index.mjs'
import { isZero } from '../src/linalg/index.mjs'

describe('regression', () => {
	describe('nonlinear', () => {
		it('Should compute coefficients for linear equation', () => {
			const A = 5
			const B = 4
			const fn = x => A*x + B
			const xs = [0,3]
			const points = xs.map(x => ([x,fn(x)]))
			const coeffs = nonlinear(points)
			
			assert.equal(coeffs.length, 2)
			assert.equal(coeffs[0][0], A)
			assert.equal(coeffs[1][0], B)
		})
		it('Should compute coefficients for quadratic equation', () => {
			const A = 5
			const B = -0.5
			const C = 4
			const fn = x => A*x**2 + B*x + C
			const xs = [0,3,7]
			const points = xs.map(x => ([x,fn(x)]))
			const coeffs = nonlinear(points, { deg:2 })
			
			assert.equal(coeffs.length, 3)
			assert.equal(Math.round(coeffs[0][0]*10)/10, A)
			assert.equal(Math.round(coeffs[1][0]*10)/10, B)
			assert.equal(Math.round(coeffs[2][0]*10)/10, C)
		})
		it('Should compute coefficients for cubic equation', () => {
			const A = -3
			const B = -0.5
			const C = 5.3
			const D = -7
			const fn = x => A*x**3 + B*x**2 + C*x + D
			const xs = [-5,0,3,7]
			const points = xs.map(x => ([x,fn(x)]))
			
			const coeffs = nonlinear(points, { deg:3 })
			
			assert.equal(coeffs.length, 4)
			assert.equal(Math.round(coeffs[0][0]*10)/10, A)
			assert.equal(Math.round(coeffs[1][0]*10)/10, B)
			assert.equal(Math.round(coeffs[2][0]*10)/10, C)
			assert.equal(Math.round(coeffs[3][0]*10)/10, D)
		})
		it('Should compute the best approximation based on minimizing the error using gradient descent', () => {
			const fy01 = x => -5*x + 10
			const fy02 = x => 3*x - 382
			const points = Array(100).fill(0).map((_,x) => ([x, x<50 ? fy01(x) : fy02(x)]))
			
			const errors = []
			const onFit = ({ err }, epoch) => errors.push({ err, epoch })
			const { err, coeffs } = nonlinear(points, { deg:3, exact:false, epochs:20, initEpochs:5, onFit })

			assert.equal(coeffs.length, 4)
			assert.isAtLeast(errors.length, 1)
			assert.equal(errors[0].epoch, 0)
			assert.isAbove(errors[0].err, err)
		})
		it('Should compute a gradient descent optimization while guaranteeing a point constraint', () => {
			const fy01 = x => -5*x + 10
			const fy02 = x => 3*x - 382
			const points = Array(100).fill(0).map((_,x) => ([x, x<50 ? fy01(x) : fy02(x)]))
			const pointConstraints = points.slice(0,1)
			
			const errors = []
			const onFit = acc => ({ err }, epoch) => acc.push({ err, epoch })
			const baseOptions = { deg:3, exact:false, epochs:20, initEpochs:10 }
			
			const { err, coeffs, fy } = nonlinear(points, { ...baseOptions, onFit:onFit(errors), pointConstraints })

			assert.equal(coeffs.length, 4)
			assert.isAtLeast(errors.length, 1)
			assert.equal(errors[0].epoch, 0)
			assert.isAtLeast(errors[0].err, err)
			assert.isOk(isZero(fy(pointConstraints[0][0]) - pointConstraints[0][1]))
		})
		it('Should compute a gradient descent optimization while guaranteeing multiple point constraints', () => {
			const fy01 = x => -5*x + 10
			const fy02 = x => 3*x - 382
			const points = Array(100).fill(0).map((_,x) => ([x, x<50 ? fy01(x) : fy02(x)]))
			const pointConstraints = [...points.slice(0,1), [200,0]]
			
			const errors = []
			const onFit = acc => ({ err }, epoch) => acc.push({ err, epoch })

			const baseOptions = { deg:3, exact:false, epochs:100, initEpochs:10 }
			
			const { err, fy, coeffs } = nonlinear(points, { 
				...baseOptions, 
				onFit:onFit(errors), 
				pointConstraints 
			})

			assert.equal(coeffs.length, 4)
			assert.isAtLeast(errors.length, 1)
			assert.equal(errors[0].epoch, 0)
			assert.isAtLeast(errors[0].err, err)
			assert.isOk(isZero(fy(pointConstraints[0][0]) - pointConstraints[0][1]))
			assert.isOk(isZero(fy(pointConstraints[1][0]) - pointConstraints[1][1]))
		})
		// it('Should compute a gradient descent optimization while guaranteeing a 1st derivative constraint', () => {
		// 	const fy01 = x => -5*x + 10
		// 	const fy02 = x => 3*x - 382
		// 	const points = Array(100).fill(0).map((_,x) => ([x, x<50 ? fy01(x) : fy02(x)]))
		// 	const slopeConstraints = [[...points.slice(0,1)[0],0]]
			
		// 	const errors = []
		// 	const onFit = acc => ({ err }, epoch) => acc.push({ err, epoch })

		// 	const baseOptions = { deg:3, exact:false, epochs:100, initEpochs:10 }
			
		// 	const { err, fy, coeffs } = nonlinear(points, { 
		// 		...baseOptions, 
		// 		onFit:onFit(errors), 
		// 		slopeConstraints 
		// 	})

		// 	assert.equal(coeffs.length, 4)
		// 	assert.isAtLeast(errors.length, 1)
		// 	assert.equal(errors[0].epoch, 0)
		// 	assert.isAtLeast(errors[0].err, err)
		// 	assert.isOk(isZero(fy(pointConstraints[0][0]) - pointConstraints[0][1]))
		// 	assert.isOk(isZero(fy(pointConstraints[1][0]) - pointConstraints[1][1]))
		// })
	})
	describe('decreaseLinearComplexity', () => {
		it('Should decreased the complexity of linear equations when an existing point is provided.', () => {
			const A = 5
			const B = -0.5
			const C = 4
			const fn = x => A*x**2 + B*x + C
			const xs = [0,3,7]
			const points = xs.map(x => ([x,fn(x)]))

			const degree3PolynomeComponents = getPolynomeComponents(2)
			const { components, remap, resolveCoeffs } = decreaseLinearComplexity(degree3PolynomeComponents, points.slice(-1)[0])
			const coeffs = nonlinear(remap(points).slice(0,-1), { components, resolveCoeffs })
			
			assert.equal(coeffs.length, 3)
			assert.equal(Math.round(coeffs[0][0]*10)/10, A)
			assert.equal(Math.round(coeffs[1][0]*10)/10, B)
			assert.equal(Math.round(coeffs[2][0]*10)/10, C)
		})
	})
})