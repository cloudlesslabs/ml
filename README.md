# CLOUDLESS OPEN LABS - MACHINE LEARNING

This library implements common machine learning and linear algebra algorithms. It is built upon the following dependencies:
- [svd-js](https://github.com/danilosalvati/svd-js): A lightweight implementation of the SVD decomposition.
- [mathjs](https://mathjs.org): A general Math library. It is used for its FFT and IFFT APIs.
- [@rayyamhk/matrix (__NOT EXPLICIT__)](https://github.com/rayyamhk/Matrix.js): A lightweight implementation of matrix operations such as QR, LU, eigenvalues, rank... This library is not explicitly used, but bits and pieces of its codebase was used. The reason it could not be used as a dependency is that it did not support ES6 import/export APIs.

__ES6:__
```js
import { backward, det, inverse, lu, qr, rank, svd, matrix } from '@cloudlessopenlabs/ml/linalg'
import { bilinear } from '@cloudlessopenlabs/ml/interpolation'
import { nonlinear } from '@cloudlessopenlabs/ml/regression'
import { spectrum, filter } from '@cloudlessopenlabs/ml/signal'
// CommonJS:
// const { linalg, interpolation, regression, signal } = require('@cloudlessopenlabs/ml')

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
>	- [`signal`](#signal)
>		- [`spectrum`](#spectrum)
>		- [`filter`](#filter)
>			- [`lowpass`](#lowpass)

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

## `signal`
### `spectrum`

```js
import { spectrum } from '@cloudlessopenlabs/ml/signal'
// import spectrum from '@cloudlessopenlabs/ml/signal/spectrum'
// // CommonJS
// const { signal: { spectrum } } = require('@cloudlessopenlabs/ml')

import { range } from 'mathjs'

const SAMPLE_RATE_HZ = 10
const TIME_INTERVAL_SEC = 2
const SIGNAL_FREQ_HZ = 2

const timeSeries = range(0, TIME_INTERVAL_SEC, 1/SAMPLE_RATE_HZ).toArray()
// Creates 2Hz sinusoid
const sinusoid = timeSeries.map(t => Math.sin((t/SIGNAL_FREQ_HZ)*2*Math.PI))

const [errors, spect] = spectrum(sinusoid, SAMPLE_RATE_HZ)

console.log(spect)
// [{
//	idx: 0,
//	phasor: { re: 5.88418203051333e-15, im: 1.4660299807724221e-15 },
//	magnitude: 6.064061516239719e-15,
//	frequency: 0,
//	fftFrequency: 0
// }, ..., {
//	idx: 10,
//	phasor: Complex { re: -7.771561172376096e-16, im: -3.370020422758625e-17 },
//	magnitude: 7.778864533624546e-16,
//	frequency: 5,
//	fftFrequency: 5
//}, ..., {
//	idx: 19,
//	phasor: Complex { re: -4.6629367034256575e-15, im: 9.999999999999993 },
//	magnitude: 9.999999999999993,
//	frequency: 0.5,
//	fftFrequency: 9.5
//}]
```

Where:
- `spect` is an array of all the phasors including complex and their conjugate (1). 
- `phasor`: Complex number. The real part is the amplitude of the cosine component, while the imaginary part is the amplitude of the sine component.
- `magnitude` is the the magnitude of the frequency.
- `frequency` is the frequency.
- `fftFrequency` is the frequency represented by the FFT (2).

> (1) The FFT represents a signal in the frequency space using complex numbers (phasors). A single frequency is represented by two complex numbers (a complex number and its conjugate).
> (2) The FFT associates phasor's conjugate with a ever growing frequency number when it goes above the Nyquist value. In reality, those frequency are the same as the lower frequency associated with their conjugate.

### `filter`
#### `lowpass`

```js
import { filter } from '@cloudlessopenlabs/ml/signal'
// import filter from '@cloudlessopenlabs/ml/signal/filter'
// import lowpass from '@cloudlessopenlabs/ml/signal/filter/lowpass'
// // CommonJS
// const { signal: { filter: { lowpass } } } = require('@cloudlessopenlabs/ml')

const SAMPLE_RATE_HZ = 10
const TIME_INTERVAL_SEC = 2
const SIGNAL_FREQ_HZ = 2
const CUT_OFF_FREQ = 0.5

const timeSeries = range(0, TIME_INTERVAL_SEC, 1/SAMPLE_RATE_HZ).toArray()
// Creates 2Hz sinusoid
const sinusoid = timeSeries.map(t => Math.sin((t/SIGNAL_FREQ_HZ)*2*Math.PI))

// Removes the frequencies higher than 0.5Hz
const [errors, filteredSignal] = filter.lowpass(sinusoid, SAMPLE_RATE_HZ, CUT_OFF_FREQ)

console.log(filteredSignal)
```
