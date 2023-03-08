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
import { range } from'mathjs'
import { spectrum as getSpectrum, filter } from '../src/signal/index.mjs'

const SAMPLE_RATE_HZ = 10
const TIME_INTERVAL_SEC = 2
const SIGNAL_FREQ_HZ = 2
const CUT_OFF_FREQ = 0.5
const SPECTRUM = [{'idx':0,'magnitude':6.064061516239719e-15,'frequency':0,'fftFrequency':0,'phasor':{'re':5.88418203051333e-15,'im':1.4660299807724221e-15}},{'idx':1,'magnitude':9.999999999999996,'frequency':0.5,'fftFrequency':0.5,'phasor':{'re':2.220446049250313e-15,'im':-9.999999999999996}},{'idx':2,'magnitude':3.1447875793875008e-15,'frequency':1,'fftFrequency':1,'phasor':{'re':1.039543809217806e-15,'im':2.968002289114149e-15}},{'idx':3,'magnitude':3.2154160066784456e-15,'frequency':1.5,'fftFrequency':1.5,'phasor':{'re':-1.6505073144158427e-15,'im':2.7594792445430284e-15}},{'idx':4,'magnitude':1.6647026617078327e-15,'frequency':2,'fftFrequency':2,'phasor':{'re':3.013207596137701e-16,'im':1.637205164822944e-15}},{'idx':5,'magnitude':1.6688304312079981e-15,'frequency':2.5,'fftFrequency':2.5,'phasor':{'re':-1.2434923059809213e-15,'im':1.1129788376658935e-15}},{'idx':6,'magnitude':1.4333251570673584e-15,'frequency':3,'fftFrequency':3,'phasor':{'re':-1.2020716845236538e-15,'im':7.806693737739637e-16}},{'idx':7,'magnitude':1.4892850012328582e-15,'frequency':3.5,'fftFrequency':3.5,'phasor':{'re':-1.4333248485241388e-15,'im':4.0441277613399947e-16}},{'idx':8,'magnitude':1.0403641213522625e-15,'frequency':4,'fftFrequency':4,'phasor':{'re':-9.800032991659456e-16,'im':3.4921488888781254e-16}},{'idx':9,'magnitude':2.220446049250313e-16,'frequency':4.5,'fftFrequency':4.5,'phasor':{'re':-2.220446049250313e-16,'im':0}},{'idx':10,'magnitude':7.778864533624546e-16,'frequency':5,'fftFrequency':5,'phasor':{'re':-7.771561172376096e-16,'im':-3.370020422758625e-17}},{'idx':11,'magnitude':1.2560739669470201e-15,'frequency':4.5,'fftFrequency':5.5,'phasor':{'re':-8.881784197001252e-16,'im':8.881784197001252e-16}},{'idx':12,'magnitude':1.423965630618001e-15,'frequency':4,'fftFrequency':6,'phasor':{'re':-1.3957499410981717e-15,'im':-2.820642109622763e-16}},{'idx':13,'magnitude':9.04959852845698e-16,'frequency':3.5,'fftFrequency':6.5,'phasor':{'re':-8.870110670716536e-16,'im':-1.7934241593921388e-16}},{'idx':14,'magnitude':7.625115705955922e-16,'frequency':3,'fftFrequency':7,'phasor':{'re':1.4276845023629252e-16,'im':-7.490267451228188e-16}},{'idx':15,'magnitude':1.8016233511322584e-15,'frequency':2.5,'fftFrequency':7.5,'phasor':{'re':-1.4210429531194544e-15,'im':-1.1074672115844196e-15}},{'idx':16,'magnitude':1.6739187381365583e-15,'frequency':2,'fftFrequency':8,'phasor':{'re':-1.301959450265341e-16,'im':-1.6688477934740889e-15}},{'idx':17,'magnitude':2.6845128272655953e-15,'frequency':1.5,'fftFrequency':8.5,'phasor':{'re':-1.0071138137474877e-15,'im':-2.488439447909575e-15}},{'idx':18,'magnitude':1.7685797421821645e-15,'frequency':1,'fftFrequency':9,'phasor':{'re':1.4183406507778736e-15,'im':-1.056496144246693e-15}},{'idx':19,'magnitude':9.999999999999993,'frequency':0.5,'fftFrequency':9.5,'phasor':{'re':-4.6629367034256575e-15,'im':9.999999999999993}}]
const FILTERED_SIGNAL = [1.2077927232873178e-16,0.3090169943749474,0.5877852522924729,0.8090169943749472,0.951056516295153,0.9999999999999997,0.9510565162951533,0.8090169943749469,0.5877852522924726,0.3090169943749471,4.676389307226012e-16,-0.3090169943749468,-0.5877852522924724,-0.8090169943749466,-0.9510565162951522,-0.9999999999999989,-0.9510565162951525,-0.8090169943749462,-0.587785252292472,-0.3090169943749465]

const timeSeries = range(0, TIME_INTERVAL_SEC, 1/SAMPLE_RATE_HZ).toArray()
const signal = timeSeries.map(t => Math.sin((t/SIGNAL_FREQ_HZ)*2*Math.PI))

describe('signal', () => {
	describe('spectrum', () => {
		it('Should compute the signal\'s frequency spectrum', () => {
			const [errors, spectrum] = getSpectrum(signal, SAMPLE_RATE_HZ)

			assert.isNotOk(errors)
			assert.isOk(spectrum)
			assert.equal(spectrum.length, SPECTRUM.length)
			const _spectrum = spectrum.map(s => ({
				idx: s.idx,
				magnitude:  s.magnitude,
				frequency:  s.frequency,
				fftFrequency:  s.fftFrequency,
				phasor: {
					re: s.phasor.re,
					im: s.phasor.im
				}
			}))
			assert.deepEqual(_spectrum, SPECTRUM)
		})
	})
	describe('filter', () => {
		describe('lowpass', () => {
			it('Should filter the high-frequencies of a signal using a cut-off frequency.', () => {
				const [errors, filteredSignal] = filter.lowpass(signal, SAMPLE_RATE_HZ, CUT_OFF_FREQ)

				assert.isNotOk(errors)
				assert.isOk(filteredSignal)
				assert.equal(filteredSignal.length, signal.length)
				assert.deepEqual(filteredSignal, FILTERED_SIGNAL)
			})
		})
	})
})