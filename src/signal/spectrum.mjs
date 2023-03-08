import { range, fft } from 'mathjs'
import { catchErrors, wrapErrors as e } from 'puffy-core/error'

/**
 * Returns the frequencies and their magnitude for 'signal'.
 * 
 * @param	{[Number]}	signal			e.g., [1,2,3,4, ..., 3,2,1]	
 * @param	{Number}	sampleRate		Signal's sampling rate in Hz (e.g., 20)
 * 
 * @return	{Number}	idx			
 * @return	{Number}	magnitude			
 * @return	{Number}	frequency		Real frequency associated with the phasor (1).
 * @return	{Number}	fftFrequency	Frequency from the FFT associated with the phasor (2).
 * @return	{Object}	phasor			Complex number
 * @return	{Number}		.re			Real part
 * @return	{Number}		.im			Imaginary part
 *
 * (1) Except for the 0 and Nyquist frequencies, there are two phasors associated with this frequency: The complex number and its conjugate.
 * (2) The fftFrequency is associated to a single phasor.
 */
export default function (signal, sampleRate) { return catchErrors('Failed to compute the signal\'s frequency spectrum.', () => {
	if (!signal)
		throw e('Missing required 1st argument \'signal\'')
	if (!sampleRate)
		throw e('Missing required 2nd argument \'sampleRate\'')
	if (!Array.isArray(signal))
		throw e(`Wrong argument exception. 1st argument 'signal' is expected to be an array. Found ${typeof(signal)} instead.`)

	const notNumberIdx = signal.findIndex(s => typeof(s) != 'number' || isNaN(s))
	if (notNumberIdx >= 0)
		throw e(`Invalid signal data. signal[${notNumberIdx}] is not a number. Found ${signal[notNumberIdx]} instead.`)

	const N = signal.length

	if (!N)
		throw e('Wrong argument exception. 1st argument \'signal\' is expected to be a non-empty array. Found an empty instead.')

	// 'bandwidth' is the max index (inclusive) when the max frequence is reached (around or equal to Nyquist frequence).
	// 'offset' deals with odd size arrays. Because the frequencies array contains 0 (1stm element), the size of the sub-array
	// containing real frequencies is even when the array is odd. This means that there are no explicit central frequency 
	// (Nyquist frequence). We need that offset to manage this use case.
	const [bandwidth, offset] = N % 2 ? [Math.floor(N/2), 1] : [N/2, 0]

	const frequencies = range(0, sampleRate, sampleRate/N).toArray()
	let phasors = []
	let magnitudes = []
	try {
		phasors = fft(signal) || [] // Returns both the complex numbers and their conjugates. This array is the same size as 'signal'
	} catch (err) {
		throw e('mathjs.fft failed.', err)
	}

	try {
		magnitudes = phasors.map(({ re, im }) => Math.sqrt(re**2 + im**2)) || []
	} catch(err) {
		throw e('Failed to compute magnitudes from the FFT\'s phasors.', err)
	}

	return magnitudes.map((magnitude, idx) => { 
		const phasor = phasors[idx]
		const index = idx <= bandwidth ? idx : bandwidth - (idx - bandwidth - offset)
		const frequency = frequencies[index]
		return {
			idx,
			magnitude, 
			frequency,
			fftFrequency: frequencies[idx], 
			phasor
		}
	})
})}