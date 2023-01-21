/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { catchErrors, wrapErrors as e, mergeErrors } from 'puffy-core/error'
import { reshape, inverseDiag, mult, transpose } from '../matrix/utils.mjs'
import svd from './svd.mjs'

export default function(data) {
	const [errors, resp] = catchErrors('Failed to compute matrix inverse', () => {
		if (!data)
			throw e('Missing required argument \'data\'')
		if ((!data.length))
			throw e('Wrong argument exception. \'data\' canot be empty')

		const matrix = Array.isArray(data[0]) ? data : reshape(data).matrix

		const [U,V,S] = svd(matrix)
		return mult(V).mult(inverseDiag(S,{ ignoreZero:true })).mult(transpose(U))
	})
	if (errors)
		throw mergeErrors(errors)
	else
		return resp
}




