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
import { reshape } from '../src/matrix/utils.mjs'

describe('matrix', () => {
	describe('utils', () => {
		describe('reshape', () => {
			it('Should reshape numbers array into array of rows', () => {
				const A = reshape([1,2,3,4])
				const B = reshape([1,2,3,4,5,6,7,8,9])
				assert.equal(A.size, 2)
				assert.deepEqual(A.matrix, [[1,2],[3,4]])
				assert.equal(B.size, 3)
				assert.deepEqual(B.matrix, [[1,2,3],[4,5,6],[7,8,9]])
			})
		})
	})
})