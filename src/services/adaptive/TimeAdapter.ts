import type { AdaptiveInputs, TimeOfDay } from '../../types';

const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 1) return 'night';
  return 'late-night';
};

export function getTimeOfDayInput(date: Date = new Date()): AdaptiveInputs['timeOfDay'] {
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const value = getTimeOfDay(hour);
  const phase = (hour + minutes / 60) / 24;

  return {
    value,
    hour,
    phase,
  };
}
