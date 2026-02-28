/**
 * Notification Service
 *
 * Handles scheduling of local notifications for:
 * - Daily streak reminders (if no session completed today)
 * - Mood shift warnings (Flicker about to become overwhelmed)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STREAK_REMINDER_ID = 'streak_reminder';
const MOOD_NUDGE_ID = 'mood_nudge';

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a daily streak reminder at 8 PM local time.
 * The notification fires every day — the app will cancel it
 * each time a session is completed that day.
 */
export async function scheduleStreakReminder(): Promise<void> {
  // Cancel existing first
  await cancelStreakReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_ID,
    content: {
      title: 'Keep your streak alive',
      body: "Flicker misses you. Just a few minutes can make a difference.",
      ...(Platform.OS === 'ios' ? { sound: false } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelStreakReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID);
}

/**
 * Schedule a gentle nudge when Flicker is about to shift moods.
 * Called when the mood system detects we're approaching a threshold.
 *
 * @param hoursUntilShift - hours until the mood shifts to the next state
 * @param targetMood - the mood Flicker will shift to
 */
export async function scheduleMoodNudge(
  hoursUntilShift: number,
  targetMood: 'neutral' | 'overwhelmed',
): Promise<void> {
  await cancelMoodNudge();

  const message =
    targetMood === 'neutral'
      ? "It's been a while. A quick session will keep Flicker happy."
      : "Flicker is starting to feel overwhelmed. Take a moment to reset.";

  // Schedule for 1 hour before the shift (or immediately if < 1 hour)
  const delayHours = Math.max(0, hoursUntilShift - 1);
  const triggerSeconds = Math.max(60, delayHours * 3600);

  await Notifications.scheduleNotificationAsync({
    identifier: MOOD_NUDGE_ID,
    content: {
      title: targetMood === 'neutral' ? 'Check in with Flicker' : 'Flicker needs you',
      body: message,
      ...(Platform.OS === 'ios' ? { sound: false } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
      repeats: false,
    },
  });
}

export async function cancelMoodNudge(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MOOD_NUDGE_ID);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
