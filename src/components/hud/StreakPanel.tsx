import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomPanel from './BottomPanel';
import { useStreakStore } from '../../stores/streakStore';
import { buildStreakRewardSummary } from '../../services/rewards/rewardMath';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

interface StreakPanelProps {
  visible: boolean;
  onClose: () => void;
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function isSameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );
}

function getCurrentWeekdayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function getStreakSupportCopy(overallStreak: number, lastSessionAt: number | null): string {
  if (overallStreak === 0 || lastSessionAt == null) {
    return 'Complete a session today to start your streak.';
  }

  const today = new Date();
  const lastSessionDate = new Date(lastSessionAt);
  if (isSameLocalDate(lastSessionDate, today)) {
    return "You're active today. Keep it going tomorrow.";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameLocalDate(lastSessionDate, yesterday)) {
    return 'Complete one session today to keep your streak alive.';
  }

  return 'Your streak resets when you miss a day.';
}

export default function StreakPanel({ visible, onClose }: StreakPanelProps) {
  const weeklyMarks = useStreakStore((state) => state.weeklyMarks);
  const overallStreak = useStreakStore((state) => state.overallStreak);
  const lastSessionAt = useStreakStore((state) => state.lastSessionAt);
  const isLoading = useStreakStore((state) => state.isLoading);
  const hasLoaded = useStreakStore((state) => state.hasLoaded);
  const error = useStreakStore((state) => state.error);
  const fetchStreak = useStreakStore((state) => state.fetchStreak);

  useEffect(() => {
    if (!visible || hasLoaded || isLoading || error) {
      return;
    }

    void fetchStreak().catch(() => undefined);
  }, [error, fetchStreak, hasLoaded, isLoading, visible]);

  const rewardSummary = useMemo(
    () => buildStreakRewardSummary(overallStreak),
    [overallStreak],
  );
  const currentWeekdayIndex = useMemo(() => getCurrentWeekdayIndex(), []);
  const supportCopy = useMemo(
    () => getStreakSupportCopy(overallStreak, lastSessionAt),
    [lastSessionAt, overallStreak],
  );

  const handleRetry = useCallback(() => {
    void fetchStreak({ force: true }).catch(() => undefined);
  }, [fetchStreak]);

  return (
    <BottomPanel visible={visible} onClose={onClose} panelTopFraction={0.16}>
      <Text style={styles.title}>Streaks</Text>
      <Text style={styles.subtitle}>
        Keep your rhythm going and earn more light from each completed session.
      </Text>

      {isLoading && !hasLoaded ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateText}>Loading streak...</Text>
        </View>
      ) : null}

      {!isLoading && !hasLoaded && error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateText}>Couldn't load your streak right now.</Text>
          <TouchableOpacity onPress={handleRetry} activeOpacity={0.7} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {hasLoaded ? (
        <>
          <SectionLabel>Current Streak</SectionLabel>
          <View style={styles.heroCard}>
            <Text style={styles.heroCount}>{overallStreak.toLocaleString()}</Text>
            <Text style={styles.heroLabel}>day streak</Text>
            <Text style={styles.heroCopy}>{supportCopy}</Text>
          </View>

          <SectionLabel>This Week</SectionLabel>
          <View style={styles.sectionCard}>
            <View style={styles.weekRow}>
              {DAY_LABELS.map((label, index) => {
                const isToday = index === currentWeekdayIndex;
                const isFilled = weeklyMarks[index];

                return (
                  <View key={`${label}-${index}`} style={styles.weekDay}>
                    <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>
                      {label}
                    </Text>
                    <View
                      style={[
                        styles.weekMark,
                        isFilled ? styles.weekMarkFilled : styles.weekMarkEmpty,
                        isToday && styles.weekMarkToday,
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <SectionLabel>Active Multiplier</SectionLabel>
          <View style={styles.multiplierCard}>
            <Text style={styles.multiplierValue}>
              x{rewardSummary.streakMultiplier.toFixed(1)}
            </Text>
            <Text style={styles.multiplierBonus}>
              +{rewardSummary.streakBonusPercent}% streak bonus
            </Text>
            <Text style={styles.multiplierHelper}>
              Streak bonus caps at 7 days (x1.7 max).
            </Text>
          </View>

          <SectionLabel>Effective Rates</SectionLabel>
          <View style={styles.sectionCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Reset</Text>
              <Text style={styles.rateValue}>
                {rewardSummary.effectiveRatesPerMinute.reset.toFixed(1)} light / min
              </Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Focus</Text>
              <Text style={styles.rateValue}>
                {rewardSummary.effectiveRatesPerMinute.focus.toFixed(1)} light / min
              </Text>
            </View>
          </View>
        </>
      ) : null}
    </BottomPanel>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#3B2A1A',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 6,
  },
  subtitle: {
    color: '#6E5A48',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: '#8B7A6A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: 'rgba(139, 100, 50, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 100, 50, 0.15)',
    padding: 14,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: 'rgba(139, 100, 50, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 100, 50, 0.18)',
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  heroCount: {
    color: '#3B2A1A',
    fontFamily: 'Toriko',
    fontSize: 48,
    lineHeight: 56,
  },
  heroLabel: {
    color: '#5D4531',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  heroCopy: {
    color: '#6E5A48',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    color: '#8B7A6A',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  weekLabelToday: {
    color: '#5D4531',
  },
  weekMark: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
  },
  weekMarkFilled: {
    backgroundColor: '#B57A4B',
    borderColor: '#8F5C34',
  },
  weekMarkEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(139, 100, 50, 0.25)',
  },
  weekMarkToday: {
    borderWidth: 2,
  },
  multiplierCard: {
    backgroundColor: 'rgba(139, 100, 50, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 100, 50, 0.18)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  multiplierValue: {
    color: '#3B2A1A',
    fontFamily: 'Toriko',
    fontSize: 34,
    lineHeight: 42,
  },
  multiplierBonus: {
    color: '#5D4531',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  multiplierHelper: {
    color: '#6E5A48',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rateLabel: {
    color: '#3B2A1A',
    fontSize: 15,
    fontWeight: '600',
  },
  rateValue: {
    color: '#5D4531',
    fontSize: 14,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(139, 100, 50, 0.15)',
  },
  stateCard: {
    backgroundColor: 'rgba(139, 100, 50, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 100, 50, 0.15)',
    paddingVertical: 28,
    paddingHorizontal: 18,
    marginTop: 24,
    alignItems: 'center',
  },
  stateText: {
    color: '#5D4531',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(139, 100, 50, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 100, 50, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  retryButtonText: {
    color: '#3B2A1A',
    fontSize: 13,
    fontWeight: '700',
  },
});
