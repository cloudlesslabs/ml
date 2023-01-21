/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { SVD } from 'svd-js'
import { reshape } from '../matrix/utils.mjs'

export default function(data) {
	if (!data)
		throw new Error('Missing required argument \'data\'')
	if ((!data.length))
		throw new Error('Wrong argument exception. \'data\' canot be empty')

	const matrix = Array.isArray(data[0]) ? data : reshape(data).matrix
	const { u, v, q } = SVD(matrix)
	const size = q.length
	const s = q.map((sv,i) => {
		const row = Array(size).fill(0)
		row[i] = sv
		return row
	})

	return [u, v, s, q]
}