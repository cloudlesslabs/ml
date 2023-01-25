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
import { det, rank, inverse, dot, isIdentity, backward, qr, isUpperTriangular, transpose, apply, isZero } from '../src/linalg/index.mjs'
// import { default as Matrix } from '@rayyamhk/matrix'

describe('linalg', () => {
	describe('det', () => {
		it('Should compute the determinant of square marices', () => {
			const A = [1,2,3,4]
			const detA = -2
			const B = [1,2,3,4,5,6,7,8,9]
			const detB = 0
			const C = [
				1 , 2 , 3 , 4 , 5 , 6 ,
				11, 12, 33, 54, 3 , 4 ,
				3 , 9 , 17, 43, 61, 2 ,
				7 , 21, 21, 7 , 23, 2 ,
				21, 8 , 87, 3 , 34, 3 ,
				14, 5 , 0 , 1 , 9 , 18]
			const detC = -387953848

			assert.equal(det(A), detA)
			assert.equal(det(B), detB)
			assert.equal(det(C), detC)
		})
	})
	describe('rank', () => {
		it('Should compute the rank of a matrix', () => {
			const A = [1,2,3,4]
			const B = [1,2,3,4,5,6,7,8,9]
			const C = [
				1 , 2 , 3 , 4 , 5 , 6 ,
				11, 12, 33, 54, 3 , 4 ,
				3 , 9 , 17, 43, 61, 2 ,
				7 , 21, 21, 7 , 23, 2 ,
				21, 8 , 87, 3 , 34, 3 ,
				14, 5 , 0 , 1 , 9 , 18]

			assert.equal(rank(A), 2)
			assert.equal(rank(B), 2)
			assert.equal(rank(C), 6)
		})
	})
	describe('inverse', () => {
		it('Should compute the inverse of a matrix', () => {
			const A = [1,2,3,4]
			const B = [1,2,3,4,5,6,7,8,9]
			const C = [
				1 , 2 , 3 , 4 , 5 , 6 ,
				11, 12, 33, 54, 3 , 4 ,
				3 , 9 , 17, 43, 61, 2 ,
				7 , 21, 21, 7 , 23, 2 ,
				21, 8 , 87, 3 , 34, 3 ,
				14, 5 , 0 , 1 , 9 , 18]

			const A_1 = inverse(A)
			const B_1 = inverse(B)
			const C_1 = inverse(C)

			assert.isOk(isIdentity(dot(A_1,A)), true)
			assert.isNotOk(isIdentity(dot(B_1,B)), false)
			assert.isOk(isIdentity(dot(C_1,C)), true)
		})
	})
	describe('backward', () => {
		it('Should compute backward substitution on upper triangular matrix equation', () => {
			const A = [
				[1,2],
				[0,4]
			]
			const coeffsA = [[4],[5]]
			const yA = dot(A,coeffsA)
			const C = [
				[1, 2 , 3 , 4 , 5 , 6 ],
				[0, 12, 33, 54, 3 , 4 ],
				[0, 0 , 17, 43, 61, 2 ],
				[0, 0 , 0 , 7 , 23, 2 ],
				[0, 0 , 0 , 0 , 34, 3 ],
				[0, 0 , 0 , 0 , 0 , 18]]
			const coeffsC = [[4],[5],[1],[12],[7],[3]]
			const yC = dot(C,coeffsC)

			const coeffsAbis = backward(A, yA)
			const coeffsCbis = backward(C, yC)

			assert.deepEqual(coeffsAbis, coeffsA)
			assert.deepEqual(coeffsCbis, coeffsC)
		})
	})
	describe('qr', () => {
		it('Should decompose matrices in QR matrices', () => {
			const A = [[1,2],[3,4]]
			const B = [[1,2,3],[4,5,6],[7,8,9]]
			const C = [
				[1 , 2 , 3 , 4 , 5 , 6 ],
				[11, 12, 33, 54, 3 , 4 ],
				[3 , 9 , 17, 43, 61, 2 ],
				[7 , 21, 21, 7 , 23, 2 ],
				[21, 8 , 87, 3 , 34, 3 ],
				[14, 5 , 0 , 1 , 9 , 18]]

			const [Qa, Ra] = qr(A)
			const [Qb, Rb] = qr(B)
			const [Qc, Rc] = qr(C)

			assert.deepEqual(apply(dot(Qa, Ra), A, (a,b) => isZero(a-b) ? 0 : 1), apply(A,A,() => 0))
			assert.isOk(isUpperTriangular(Ra))
			assert.isOk(isIdentity(dot(Qa,transpose(Qa))))
			assert.deepEqual(apply(dot(Qb, Rb), B, (a,b) => isZero(a-b) ? 0 : 1), apply(B,B,() => 0))
			assert.isOk(isUpperTriangular(Rb))
			assert.isOk(isIdentity(dot(Qb,transpose(Qb))))
			assert.deepEqual(apply(dot(Qc, Rc), C, (a,b) => isZero(a-b) ? 0 : 1), apply(C,C,() => 0))
			assert.isOk(isUpperTriangular(Rc))
			assert.isOk(isIdentity(dot(Qc,transpose(Qc))))
		})
	})
})