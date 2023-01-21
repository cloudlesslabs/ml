/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import qr from './qr.mjs'

const DIGIT = 8
const EPSILON = 1 / ((10 ** DIGIT) * 2)

export default function (data) {
	const R = qr(data)[1]
	const row = R.length
	const col = R[0].length

	if (row === 0)
		return 1

	let rk = 0
	for (let i = 0; i < row; i++) {
		for (let j = i; j < col; j++) {
			if (Math.abs(R[i][j]) >= EPSILON) {
				rk++
				break
			}
		}
	}

	return rk
} 





