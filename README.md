# CLOUDLESS OPEN LABS - MACHINE LEARNING

This library implements common machine learning and linear algebra algorithms. It is built upon the following dependencies:
- [@rayyamhk/matrix](https://github.com/rayyamhk/Matrix.js): A lightweight implementation of matrix operations such as QR, LU, eigenvalues, rank... This library is not explicitly used, but bits and pieces of its codebase was used. The reason it could not be used as a dependency is that it did not support ES6 import/export APIs.
- [svd-js](https://github.com/danilosalvati/svd-js): A lightweight implementation of the SVD decomposition.

__ES6:__
```js
import { backward, det, inverse, lu, qr, rank, svd, matrix } from '@cloudlessopenlabs/ml/linalg'
import { bilinear } from '@cloudlessopenlabs/ml/interpolation'
import { nonlinear } from '@cloudlessopenlabs/ml/regression'
// CommonJS:
// const { linalg, interpolation, regression } = require('@cloudlessopenlabs/ml')

const interpolate = bilinear([
	{ x:0, y:0, z:0	},
	{ x:1, y:0, z:0	},
	{ x:1, y:1, z:1	},
	{ x:0, y:1, z:1	}
])

console.log(interpolate({ x:0.5, y:0.5 })) // 0.5
```

# Table of contents

> * [APIs](#apis)
> 	- [`linalg`](#linalg)
> 		- [`backward`](#backward)
> 		- [`det`](#det)
> 		- [`inverse`](#inverse)
> 		- [`lu`](#lu)
> 		- [`matrix`](#matrix)
> 		- [`qr`](#qr)
> 		- [`rank`](#rank)
> 		- [`svd`](#svd)
> 	- [`interpolation`](#interpolation)
> 		- [`bilinear`](#bilinear)
> 	- [`regression`](#regression)
> 		- [`nonlinear`](#nonlinear)

# APIs
## `linalg`

__ES6:__
```js
import { backward, det, inverse, lu, qr, rank, svd } from '@cloudlessopenlabs/ml/linalg'
```

__CommonJS:__
```js
const { linalg } = require('@cloudlessopenlabs/ml')
const { backward, det, inverse, lu, qr, rank, svd } = linalg
```

### `backward`

```js
import { backward } from '@cloudlessopenlabs/ml/linalg'
// import backward from '@cloudlessopenlabs/ml/linalg/backward'
// // CommonJS
// const { linalg:{ backward } } = require('@cloudlessopenlabs/ml')
```

### `det`

```js
import { det } from '@cloudlessopenlabs/ml/linalg'
// import det from '@cloudlessopenlabs/ml/linalg/det'
// // CommonJS
// const { linalg:{ det } } = require('@cloudlessopenlabs/ml')

const C = [
	[1 , 2 , 3 , 4 , 5 , 6],
	[11, 12, 33, 54, 3 , 4],
	[3 , 9 , 17, 43, 61, 2],
	[7 , 21, 21, 7 , 23, 2],
	[21, 8 , 87, 3 , 34, 3],
	[14, 5 , 0 , 1 , 9 , 18]
]

console.log(det(C)) // -387953848
```

### `inverse`

```js
import { inverse, dot } from '@cloudlessopenlabs/ml/linalg'
// import inverse from '@cloudlessopenlabs/ml/linalg/inverse'
// // CommonJS
// const { linalg:{ inverse } } = require('@cloudlessopenlabs/ml')

const C = [
	[1 , 2 , 3 , 4 , 5 , 6],
	[11, 12, 33, 54, 3 , 4],
	[3 , 9 , 17, 43, 61, 2],
	[7 , 21, 21, 7 , 23, 2],
	[21, 8 , 87, 3 , 34, 3],
	[14, 5 , 0 , 1 , 9 , 18]
]

const C_1 = inverse(C)

console.log(dot(C_1,C))
//[
//	[1 , 0, 0, 0, 0, 0],
//	[0 , 1, 0, 0, 0, 0],
//	[0 , 0, 1, 0, 0, 0],
//	[0 , 0, 0, 1, 0, 0],
//	[0 , 0, 0, 0, 1, 0],
//	[0 , 0, 0, 0, 0, 1]
//]
```

### `lu`

```js
import { lu } from '@cloudlessopenlabs/ml/linalg'
// import lu from '@cloudlessopenlabs/ml/linalg/lu'
// // CommonJS
// const { linalg:{ lu } } = require('@cloudlessopenlabs/ml')
```

### `matrix`

```js
import { matrix } from '@cloudlessopenlabs/ml/linalg'
// import matrix from '@cloudlessopenlabs/ml/linalg/matrix'
// // CommonJS
// const { linalg:{ matrix } } = require('@cloudlessopenlabs/ml')


```

### `qr`

```js
import { qr, dot } from '@cloudlessopenlabs/ml/linalg'
// import qr from '@cloudlessopenlabs/ml/linalg/qr'
// // CommonJS
// const { linalg:{ qr } } = require('@cloudlessopenlabs/ml')

const A = [
	[1,2],
	[3,4]
]

const [Q,R] = qr(A) // Where R is an upper-triangular matrix and Q is orthonormal (Q^T = Q^-1)
console.log(dot(Q,R))
//[
//	[1,2],
//	[3,4]
//]
```

### `rank`

```js
import { rank } from '@cloudlessopenlabs/ml/linalg'
// import rank from '@cloudlessopenlabs/ml/linalg/rank'
// // CommonJS
// const { linalg:{ rank } } = require('@cloudlessopenlabs/ml')

const B = [
	[1,2,3],
	[4,5,6],
	[7,8,9]
]

console.log(rank(B)) // 2
```

### `svd`

```js
import { svd } from '@cloudlessopenlabs/ml/linalg'
// import svd from '@cloudlessopenlabs/ml/linalg/svd'
// // CommonJS
// const { linalg:{ svd } } = require('@cloudlessopenlabs/ml')
```

## `interpolation`

__ES6:__
```js
import { bilinear } from '@cloudlessopenlabs/ml/interpolation'
```

__CommonJS:__
```js
const { interpolation } = require('@cloudlessopenlabs/ml')
const { bilinear } = interpolation
```

### `bilinear`

```js
import { bilinear } from '@cloudlessopenlabs/ml/interpolation'
// import bilinear from '@cloudlessopenlabs/ml/interpolation/bilinear'
// // CommonJS
// const { interpolation:{ bilinear } } = require('@cloudlessopenlabs/ml')

const interpolate = bilinear([
	{ x:0, y:0, z:0	},
	{ x:1, y:0, z:0	},
	{ x:1, y:1, z:1	},
	{ x:0, y:1, z:1	}
])

console.log(interpolate({ x:0.5, y:0.5 })) // 0.5
```

## `regression`

__ES6:__
```js
import { nonlinear } from '@cloudlessopenlabs/ml/regression'
```

__CommonJS:__
```js
const { regression } = require('@cloudlessopenlabs/ml')
const { nonlinear } = regression
```

### `nonlinear`

```js
import { nonlinear } from '@cloudlessopenlabs/ml/regression'
// import nonlinear from '@cloudlessopenlabs/ml/regression/nonlinear'
// // CommonJS
// const { regression:{ nonlinear } } = require('@cloudlessopenlabs/ml')
```




