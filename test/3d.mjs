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
import interpolation from '../src/interpolation/index.mjs'
const { bilinear } = interpolation['3d']

describe('interpolation/3d', () => {
	describe('bilinear', () => {
		it('Should interpolate a point', () => {
			const interpolate = bilinear([
				{ x:0, y:0, z:0	},
				{ x:1, y:0, z:0	},
				{ x:1, y:1, z:1	},
				{ x:0, y:1, z:1	},
			])
			const interpolate2 = bilinear([
				{ x:0, y:0, z:0	},
				{ x:1, y:0, z:0	},
				{ x:1, y:2, z:1	},
				{ x:0, y:2, z:1	},
			])

			assert.equal(interpolate({ x:0.5, y:0.5 }), 0.5)
			assert.equal(interpolate2({ x:0.5, y:0.5 }), 0.25)
			assert.equal(interpolate({ x:0, y:0 }), 0)
			assert.equal(interpolate({ x:1, y:0 }), 0)
			assert.equal(interpolate({ x:1, y:1 }), 1)
			assert.equal(interpolate({ x:0, y:1 }), 1)
		})
	})
})









