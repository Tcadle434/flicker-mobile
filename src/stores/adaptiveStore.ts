import { create } from 'zustand';
import type { AdaptiveInputs, AdaptiveParameters } from '../types';
import { mapAdaptiveParameters } from '../services/audio/parameterMapper';
import { getTimeOfDayInput } from '../services/adaptive/TimeAdapter';
import { getSeason } from '../services/adaptive/SeasonAdapter';

interface AdaptiveStoreState {
  enabled: boolean;
  inputs: AdaptiveInputs;
  parameters: AdaptiveParameters;
  setInputs: (inputs: AdaptiveInputs) => void;
  setEnabled: (enabled: boolean) => void;
  recompute: () => void;
}

const defaultInputs: AdaptiveInputs = {
  timeOfDay: getTimeOfDayInput(),
  heartRate: null,
  season: getSeason(),
};

const defaultParameters = mapAdaptiveParameters(defaultInputs, 10);

export const useAdaptiveStore = create<AdaptiveStoreState>((set, get) => ({
  enabled: true,
  inputs: defaultInputs,
  parameters: defaultParameters,
  setInputs: (inputs) => {
    set({ inputs, parameters: mapAdaptiveParameters(inputs, get().parameters.binauralFrequency) });
  },
  setEnabled: (enabled) => set({ enabled }),
  recompute: () => {
    const inputs = get().inputs;
    set({ parameters: mapAdaptiveParameters(inputs, get().parameters.binauralFrequency) });
  },
}));
