import type { Season } from '../../types';

export function getSeason(date: Date = new Date(), hemisphere: 'north' | 'south' = 'north'): Season {
  const month = date.getMonth();
  const northSeasons: Season[] = ['winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter', 'winter'];
  const southSeasons: Season[] = ['summer', 'fall', 'fall', 'fall', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer'];

  return hemisphere === 'north' ? northSeasons[month] : southSeasons[month];
}
