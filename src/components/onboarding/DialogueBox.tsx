/**
 * DialogueBox
 *
 * RPG-style dialogue box with glowing border, dark transparent background,
 * glowing white typewriter text, and bouncing >> advance indicator.
 * Supports multiple messages — swaps text in place without re-rendering the screen.
 * Tap to complete text instantly, then tap again to advance to next message or finish.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { playSound } from '../../services/audio/uiSounds';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';

interface Props {
  /** Speaker name shown above the box */
  name?: string;
  /** Array of messages to show sequentially */
  messages: string[];
  /** Called when user advances past the last message */
  onComplete: () => void;
  /** Characters per second for typewriter */
  speed?: number;
}

export default function DialogueBox({ name = 'Flicker', messages, onComplete, speed = 40 }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentText = messages[msgIndex] ?? '';

  // Bouncing >> indicator
  const bounceY = useSharedValue(0);
  useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      true,
    );
  }, [bounceY]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }, { translateX: bounceY.value * 0.5 }],
  }));

  // Typewriter effect — restarts when msgIndex changes
  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);

    const ms = 1000 / speed;
    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= currentText.length) {
        setDisplayedText(currentText);
        setIsComplete(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setDisplayedText(currentText.slice(0, indexRef.current));
      }
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentText, speed, msgIndex]);

  const handleTap = useCallback(() => {
    if (!isComplete) {
      // Skip to end of current message
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(currentText);
      setIsComplete(true);
    } else if (msgIndex < messages.length - 1) {
      // Next message — just swap text, no screen transition
      playSound('dialogueContinue');
      setMsgIndex(msgIndex + 1);
    } else {
      // Last message done — advance to next screen
      playSound('dialogueContinue');
      onComplete();
    }
  }, [isComplete, currentText, msgIndex, messages.length, onComplete]);

  return (
    <Pressable onPress={handleTap} style={styles.wrapper}>
      <View style={styles.outerBorder}>
        <View style={styles.innerBox}>
          {name && (
            <Text style={styles.nameTag}>{name}</Text>
          )}
          <Text style={styles.dialogueText}>
            {displayedText}
            {!isComplete && <Text style={styles.cursor}>|</Text>}
          </Text>

          {isComplete && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={[styles.advanceContainer, chevronStyle]}
            >
              <Text style={styles.advanceChevron}>{'>>'}</Text>
            </Animated.View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  outerBorder: {
    borderRadius: 16,
    padding: 2,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(125, 211, 252, 0.5)',
    // Aggressive glow
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  innerBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    minHeight: 120,
  },
  nameTag: {
    color: '#B4A0DC',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dialogueText: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 30,
    textShadowColor: 'rgba(255, 255, 255, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cursor: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  advanceContainer: {
    position: 'absolute',
    bottom: 16,
    right: 20,
  },
  advanceChevron: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(125, 211, 252, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
