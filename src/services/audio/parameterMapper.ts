import type { AdaptiveInputs, AdaptiveParameters } from '../../types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const timeOfDayEnergy: Record<AdaptiveInputs['timeOfDay']['value'], number> = {
  morning: 0.4,
  afternoon: 0.7,
  evening: 0.2,
  night: -0.3,
  'late-night': -0.6,
};

const seasonBrightness = {
  spring: 0.6,
  summer: 0.8,
  fall: 0.4,
  winter: 0.2,
};

export function mapAdaptiveParameters(
  inputs: AdaptiveInputs,
  baseBinauralFrequency: number = 10
): AdaptiveParameters {
  const energyBase = timeOfDayEnergy[inputs.timeOfDay.value];
  const brightnessBase = seasonBrightness[inputs.season];

  const heartRateDelta = inputs.heartRate
    ? clamp((inputs.heartRate.bpm - 70) / 60, -0.3, 0.3)
    : 0;

  const energy = clamp(energyBase + heartRateDelta, -1, 1);
  const density = 0;
  const brightness = clamp(brightnessBase + energy * 0.1, 0, 1);
  const tempo = clamp(1 + heartRateDelta * 0.4, 0.8, 1.2);

  const binauralFrequency = clamp(baseBinauralFrequency + heartRateDelta * 2, 2, 14);

  return {
    energy,
    density,
    brightness,
    tempo,
    binauralFrequency,
  };
}
