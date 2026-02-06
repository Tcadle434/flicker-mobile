import type { AdaptiveInputs, AdaptiveParameters } from '../types';
import { getTimeOfDayInput } from '../services/adaptive/TimeAdapter';
import { getSeason } from '../services/adaptive/SeasonAdapter';
import { getWeatherInput } from '../services/adaptive/WeatherAdapter';
import { getHeartRateInput } from '../services/adaptive/HeartRateAdapter';
import { mapAdaptiveParameters } from '../services/audio/parameterMapper';
import { getCurrentLocation } from '../services/sensors/location';

export type LocationProvider = () => Promise<{ latitude: number; longitude: number } | null>;

export interface AdaptiveControllerOptions {
  hemisphere?: 'north' | 'south';
  getLocation?: LocationProvider;
  baseBinauralFrequency?: number;
}

export interface AdaptiveUpdate {
  inputs: AdaptiveInputs;
  parameters: AdaptiveParameters;
}

export class AdaptiveController {
  private readonly hemisphere: 'north' | 'south';
  private readonly getLocation?: LocationProvider;
  private readonly baseBinauralFrequency: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(options: AdaptiveControllerOptions = {}) {
    this.hemisphere = options.hemisphere ?? 'north';
    this.getLocation = options.getLocation ?? getCurrentLocation;
    this.baseBinauralFrequency = options.baseBinauralFrequency ?? 10;
  }

  async collectInputs(): Promise<AdaptiveInputs> {
    const timeOfDay = getTimeOfDayInput();
    const season = getSeason(new Date(), this.hemisphere);

    let weather: AdaptiveInputs['weather'] = null;
    if (this.getLocation) {
      try {
        const location = await this.getLocation();
        if (location) {
          weather = await getWeatherInput(location.latitude, location.longitude);
        }
      } catch (error) {
        console.warn('[AdaptiveController] Weather fetch failed', error);
      }
    }

    let heartRate: AdaptiveInputs['heartRate'] = null;
    try {
      heartRate = await getHeartRateInput();
    } catch (error) {
      console.warn('[AdaptiveController] Heart rate fetch failed', error);
    }

    return {
      timeOfDay,
      weather,
      heartRate,
      season,
    };
  }

  async updateOnce(): Promise<AdaptiveUpdate> {
    const inputs = await this.collectInputs();
    const parameters = mapAdaptiveParameters(inputs, this.baseBinauralFrequency);
    return { inputs, parameters };
  }

  start(intervalMs: number, onUpdate: (update: AdaptiveUpdate) => void): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      try {
        const update = await this.updateOnce();
        onUpdate(update);
      } catch (error) {
        console.warn('[AdaptiveController] update failed', error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
}
