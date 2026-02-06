import { useMoodStore } from '../stores/moodStore';
import { moodThemes, MoodTheme } from '../constants/moodThemes';

export function useMoodTheme(): MoodTheme {
  const currentMood = useMoodStore((state) => state.currentMood);
  return moodThemes[currentMood];
}
