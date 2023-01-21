/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const DIGIT = 8
export const EPSILON = 1 / ((10 ** DIGIT) * 2)

export const isZero = v => Math.abs(v) <= EPSILON

/**
 * Transforms an array of numbers into a squared matrix (i.e., an array of rows where a row is an array of numbers)
 * 
 * @param	{[Object]}	data			e.g., [1,1,1,2,2,2,3,3,3] or [[1,1,1],[2,2,2],[3,3,3]]
 * 
 * @return	{Object}	squareMatrix	
 * @return	{Number}		.size		e.g., 3
 * @return	{[Row]}			.matrix		e.g., [[1,1,1],[2,2,2],[3,3,3]]
 */
export const reshape = data => {
	if (!data || !Array.isArray(data))
		throw new Error('Invalid input. The input is expected to be a non-empty array.')
	const l = data.length
	if (!l)
		throw new Error('Invalid input. The input is expected to be a non-empty array.')

	const firstItem = data[0]
	if (Array.isArray(firstItem)) {
		for (let i=0;i<l;i++) {
			const row = data[i]
			if (!Array.isArray(row))
				throw new Error(`Malformed input. A squared matrix cannot contain inconsistent rows types. Row ${i} is not an array.`)
			const rl = row.length
			if (rl != l)
				throw new Error('Malformed input. The determinant can only be calculated for squared matrices.')
		}
		return { size:l, matrix:data }
	} else {
		const size = Math.sqrt(l)
		if (size%1)
			throw new Error(`Malformed input. The determinant can only be calculated for squared matrices. The current matrix contains ${l} values which do not fit any squared matrix.`)

		const matrix = []
		for (let i=0;i<size;i++) {
			const row = []
			let pointer = i*size
			for (let j=0;j<size;j++)
				row.push(data[pointer+j])
			matrix.push(row)
		}

		return { size, matrix }
	}
}

export const generate = (row, col, cb) => {
	if (!row || !col)
		return []
	
	const matrix = Array(row).fill(0).map(() => Array(col).fill(0))
	
	for (let i = 0; i < row; i++) {
		const r = matrix[i]
		for (let j = 0; j < col; j++)
			r[j] = cb ? cb(i, j) : null
	}
	
	return matrix
}

export const identity = size => generate(size, size, (i, j) => i === j ? 1 : 0)

const _mult = (A, B) => {
	if (!A)
		throw new Error('Missing required matrix \'A\'')

	if (!B) {
		A.mult = (...args) => mult(A, ...args)
		return A
	}

	const matrixA = Array.isArray(A[0]) ? A : reshape(A).matrix
	const matrixB = Array.isArray(B[0]) ? B : reshape(B).matrix
	const [Arow, Acol] = [matrixA.length, matrixA[0].length]
	const [Brow, Bcol] = [matrixB.length, matrixB[0].length]

	if (Acol !== Brow) 
		throw new Error(`Failed to multiply matrix A with matrix B. Their size is incompatible (A:${Arow} x ${Acol}, B:${Brow} x ${Bcol})`)

	const result = generate(Arow, Bcol)

	for (let i = 0; i < Arow; i++) {
		for (let j = 0; j < Bcol; j++) {
			result[i][j] = 0
			for (let k = 0; k < Brow; k++)
				result[i][j] += matrixA[i][k] * matrixB[k][j]
		}
	}

	result.mult = (...args) => mult(result, ...args)

	return result
}

export const mult = (...args) => {
	const l = args.length
	if (!l)
		return null
	if (l == 1)
		return _mult(args[0])
	if (l == 2)
		return _mult(args[0], args[1])

	let result = _mult(args[0])
	for (let i=1;i<l;i++)
		result = result.mult(args[i])

	return result
}


export const transpose = A => {
	const matrix = Array.isArray(A[0]) ? A : reshape(A).matrix
	const [row, col] = [matrix.length, matrix[0].length]

	return generate(col, row, (i, j) => matrix[j][i])
}

export const inverseDiag = (A, options) => {
	if (!A)
		throw new Error('Missing required matrix \'A\'')
	const { ignoreZero } = options || {}
	const matrix = Array.isArray(A[0]) ? A : reshape(A).matrix
	const size = Math.min(matrix.length, matrix[0].length)

	const clone = matrix.map(row => ([...row]))
	for (let i=0;i<size;i++) {
		const v = clone[i][i]
		if (ignoreZero && isZero(v))
			clone[i][i] = 0	
		else
			clone[i][i] = 1/v
	}

	return clone
}

export const isIdentity = A => {
	if (!A)
		throw new Error('Missing required matrix \'A\'')
	const matrix = Array.isArray(A[0]) ? A : reshape(A).matrix
	const [row, col] = [matrix.length, matrix[0].length]

	let yes = true
	for (let i=0;i<row;i++) {
		const r = matrix[i]
		for (let j=0;j<col;j++) {
			const ref = Math.abs(i == j ? r[j]-1 : r[j])
			if (!isZero(ref)) {
				yes = false
				break
			}
		}
		if (!yes)
			break
	}

	return yes
}

export const isUpperTriangular = A => {
	if (!A)
		throw new Error('Missing required matrix \'A\'')
	if (!A[0])
		return false
	const matrix = Array.isArray(A[0]) ? A : reshape(A).matrix

	const row = matrix.length
	const col = matrix[0].length
	if (row != col)
		throw new Error('Matrix is not square')
	const size = row
	
	if (size == 1)
		return true
	if (size == 2)
		return isZero(matrix[1][0])
	if (size == 3)
		return isZero(matrix[1][0]) 
		&& isZero(matrix[2][0]) &&  isZero(matrix[2][1])
	if (size == 4)
		return isZero(matrix[1][0]) 
		&& isZero(matrix[2][0]) &&  isZero(matrix[2][1])
		&& isZero(matrix[3][0]) &&  isZero(matrix[3][1]) &&  isZero(matrix[3][2])
	if (size == 5)
		return isZero(matrix[1][0]) 
		&& isZero(matrix[2][0]) &&  isZero(matrix[2][1])
		&& isZero(matrix[3][0]) &&  isZero(matrix[3][1]) &&  isZero(matrix[3][2])
		&& isZero(matrix[4][0]) &&  isZero(matrix[4][1]) &&  isZero(matrix[4][2]) &&  isZero(matrix[4][3])
	if (size == 6)
		return isZero(matrix[1][0]) 
		&& isZero(matrix[2][0]) &&  isZero(matrix[2][1])
		&& isZero(matrix[3][0]) &&  isZero(matrix[3][1]) &&  isZero(matrix[3][2])
		&& isZero(matrix[4][0]) &&  isZero(matrix[4][1]) &&  isZero(matrix[4][2]) &&  isZero(matrix[4][3])
		&& isZero(matrix[5][0]) &&  isZero(matrix[5][1]) &&  isZero(matrix[5][2]) &&  isZero(matrix[5][3]) &&  isZero(matrix[5][4])

	let yes = true
	for (let i=1;i<size;i++) {
		const r = matrix[i]
		for (let j=0;j<i;j++) {
			if (!isZero(r[j])) {
				yes = false
				break
			}
		}
		if (!yes)
			break
	}

	return yes
}












