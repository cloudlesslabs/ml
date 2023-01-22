/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'.
// To only run a test, use 'it.only' instead of 'it'.

import { assert } from 'chai'
import { nonlinear, getPolynomeComponents, decreaseLinearComplexity } from '../src/regression/index.mjs'

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
		it.only('Should compute the best approximation based on minimizing the error using gradient descent', () => {
			const fy01 = x => -5*x + 10
			const fy02 = x => 3*x - 382
			const points = Array(100).fill(0).map((_,x) => ([x, x<50 ? fy01(x) : fy02(x)]))

			nonlinear(points, { deg:3, exact:false })

		})
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
			const { components, remap, getCoeff } = decreaseLinearComplexity(degree3PolynomeComponents, points.slice(-1)[0])
			const coeffs = nonlinear(remap(points).slice(0,-1), { components, getNextCoeff:getCoeff})
			
			assert.equal(coeffs.length, 3)
			assert.equal(Math.round(coeffs[0][0]*10)/10, A)
			assert.equal(Math.round(coeffs[1][0]*10)/10, B)
			assert.equal(Math.round(coeffs[2][0]*10)/10, C)
		})
	})
})