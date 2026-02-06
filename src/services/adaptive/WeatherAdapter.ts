import type { AdaptiveInputs, WeatherCondition } from '../../types';

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    cloud_cover: number;
    weather_code: number;
  };
};

const codeToCondition = (code: number): WeatherCondition => {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
};

export async function getWeatherInput(
  latitude: number,
  longitude: number
): Promise<AdaptiveInputs['weather']> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,cloud_cover,weather_code`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const current = data.current;

  return {
    condition: codeToCondition(current.weather_code),
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    cloudCover: current.cloud_cover,
  };
}
