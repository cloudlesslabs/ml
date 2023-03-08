import { ifft, complex } from 'mathjs'
import { catchErrors, wrapErrors as e } from 'puffy-core/error'
import getSpectrum from '../spectrum.mjs'

/**
 * Creates a an output signal that does not contain the frequencies strictly higher than 'cutOffFreq'.
 * 
 * @param	{[Number]}	signal			e.g., [1,2,3,4, ..., 3,2,1]	
 * @param	{Number}	sampleRate		Signal's sampling rate in Hz (e.g., 20)
 * @param	{Number}	cutOffFreq		e.g., 20 (unit is Hz)
 * 
 * @return	{[Number]}	filteredSignal	This signal has the same size as 'signal'
 */
export default function(signal, sampleRate, cutOffFreq=0) { return catchErrors('Failed to filter the signal from its high-frequencies (low-pass)', () => {
	if (!signal)
		throw e('Missing required 1st argument \'signal\'')
	if (!sampleRate)
		throw e('Missing required 2nd argument \'sampleRate\'')

	const [errors, spectrum] = getSpectrum(signal, sampleRate)
	if (errors)
		throw e(errors)

	const updatedPhasors = spectrum.map(s => cutOffFreq > 0 && s.frequency > cutOffFreq ? complex(0, 0): s.phasor)

	let reconstructedSignal
	try {
		reconstructedSignal = ifft(updatedPhasors) || []
	} catch(err) {
		throw e('mathjs.ifft failed.', err)
	}

	return reconstructedSignal.map(s => (s||{}).re||0)
})}
