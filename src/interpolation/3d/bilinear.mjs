/**
 * Copyright (c) 2019-2023, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { catchErrors, wrapErrors as e, mergeErrors } from 'puffy-core/error'
import { sortBy } from 'puffy-core/collection'

/**
 * Gets the functions that can express a coordinate value on a 3D line based on another coordinate.
 *
 * Based on the following parametric equation for a 3D line:
 *
 * x-x1   y-y1   z-z1
 * ---- = ---- = ----
 *  nx     ny     nz
 *
 * Where 
 * 	- nx = x2-x1
 * 	- ny = y2-y1
 * 	- nz = z2-z1
 * 
 * @param	{Point}		p1	 
 * @param	{Number}		.x	
 * @param	{Number}		.y	
 * @param	{Number}		.z	
 * @param	{Point}		p2	 
 * @param	{Number}		.x	
 * @param	{Number}		.y	
 * @param	{Number}		.z
 * 
 * @return	{Object}	functions
 * @return	{Object}		.x
 * @return	{Function}			.fy		F(y) to get X (if response is null, this means this axis is independant)
 * @return	{Function}			.fz		F(z) to get X (if response is null, this means this axis is independant)
 * @return	{Object}		.y
 * @return	{Function}			.fx		F(x) to get Y (if response is null, this means this axis is independant)
 * @return	{Function}			.fz		F(z) to get Y (if response is null, this means this axis is independant)
 * @return	{Object}		.z
 * @return	{Function}			.fx		F(x) to get Z (if response is null, this means this axis is independant)
 * @return	{Function}			.fy		F(y) to get Z (if response is null, this means this axis is independant)
 */
const _get3DlineFn = (p1,p2) => {
	const nx = p2.x-p1.x
	const ny = p2.y-p1.y
	const nz = p2.z-p1.z

	return {
		x: {
			fy: y => !ny ? null : ((y-p1.y)*nx/ny) + p1.x,
			fz: z => !nz ? null : ((z-p1.z)*nx/nz) + p1.x
		},
		y: {
			fx: x => !nx ? null : ((x-p1.x)*ny/nx) + p1.y,
			fz: z => !nz ? null : ((z-p1.z)*ny/nz) + p1.y
		},
		z: {
			fx: x => !nx ? null : ((x-p1.x)*nz/nx) + p1.z,
			fy: y => !ny ? null : ((y-p1.y)*nz/ny) + p1.z
		}
	}
}

const _notNumber = n => typeof(n) != 'number' || isNaN(n)

/**
 * Interpolates the z value given a new point (x,y) and 4 training 3D points.
 * 
 * @param	{[Object]}	points[]	
 * @param	{Number}		.x	
 * @param	{Number}		.y	
 * @param	{Number}		.z	
 * 
 * @return	{Function}	interpolate
 */
export default function interpolate(points) {
	const [errors, resp] = catchErrors('Failed to create bilinear interpolation function', () => {
		if (!points)
			throw e('Missing required \'points\' argument')
		const l = points.length
		if (!l)
			throw e('\'points\' argument cannot be empty')
		if (l < 4)
			throw e('\'points\' argument must be an array with at least 4 points')
		const invalidIndex = points.findIndex(({ x,y,z }) => _notNumber(x) || _notNumber(y) || _notNumber(z))
		if (invalidIndex >= 0)
			throw e(`Wrong argument exception. Training points[${invalidIndex}] does not define all required x,y,z properties (${JSON.stringify(points[invalidIndex])})`)

		// Re-arrange the points and validate the x,y coordinates are set up in a rectangle shape.
		const [p0, p1, p2, p3] = sortBy(points, p => p.x)
		const [py0,,, py3] = sortBy(points, p => p.y)

		if (p0.x != p1.x || p2.x != p3.x)
			throw e('Cannot perform bilinear interpolation if the training points do not form 2 vertical lines (y-axis).')
		if (p0.x == p2.x)
			throw e('Cannot perform bilinear interpolation if the training points do not form 2 different vertical lines (y-axis).')

		const [x0y0, x0y1] = p0.y < p1.y ? [p0, p1] : [p1, p0]
		const [x1y0, x1y1] = p2.y < p3.y ? [p2, p3] : [p3, p2]

		if (x0y0.y != x1y0.y || x0y1.y != x1y1.y)
			throw e('Cannot perform bilinear interpolation if the training points do not form 2 horizontal lines (x-axis).')
		if (x0y0.y == x0y1.y)
			throw e('Cannot perform bilinear interpolation if the training points do not form 2 different horizontal lines (x-axis).')

		const lineAlongYaxis01 = _get3DlineFn(x0y0, x0y1)
		const lineAlongYaxis02 = _get3DlineFn(x1y0, x1y1)
		const lineAlongXaxis01 = _get3DlineFn(x0y0, x1y0)
		const lineAlongXaxis02 = _get3DlineFn(x0y1, x1y1)

		/**
		 * [description]

		 * @param	{Object}	point	
		 * @param	{Number}		.x	
		 * @param	{Number}		.y	
		 * 
		 * @return	{Number}	z
		 */
		return point => {
			const [errors, resp] = catchErrors('Failed to compute bilinear interpolation', () => {
				if (!point)
					throw e('Missing required \'point\' argument')

				if (_notNumber(point.x) || _notNumber(point.y))
					throw e(`Wrong argument exception. 'point' does not define all required x,y properties (${JSON.stringify(point)})`)

				if (point.x < p0.x || point.x > p3.x || point.y < py0.y || point.y > py3.y)
					throw e('\'point\' is not contained in the 2D (x,y) surface defined by the \'points\' training data')

				let z01 = lineAlongYaxis01.z.fy(point.y)
				let z02 = lineAlongYaxis02.z.fy(point.y)

				if (z01 === null || z02 === null) {

					z01 = lineAlongXaxis01.z.fx(point.x)
					z02 = lineAlongXaxis02.z.fx(point.x)

					if (z01 === null || z02 === null) 
						throw new Error('Unstable data. Failed to determine the intermediate set of points that helps compute the second line in the bilinear interpolation.')

					return _get3DlineFn({
						x: point.x,
						y: x0y0.y,
						z: z01
					}, {
						x: point.x,
						y: x0y1.y,
						z: z02
					}).z.fy(point.y)
				} else {
					return _get3DlineFn({
						x: x0y0.x,
						y: point.y,
						z: z01
					}, {
						x: x1y0.x,
						y: point.y,
						z: z02
					}).z.fx(point.x)
				}	
			})
			if (errors)
				throw mergeErrors(errors)
			else
				return resp
		}
	})
	if (errors)
		throw mergeErrors(errors)
	else
		return resp
}