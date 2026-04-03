/**
 * DialogueScreen
 *
 * Full-screen dialogue layout: forest tilemap background with Flicker character,
 * and a dialogue box at the bottom with typewriter text.
 * Supports multiple messages — text swaps in place without screen transitions.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DialogueScene from './DialogueScene';
import DialogueBox from './DialogueBox';

interface Props {
  /** Speaker name (defaults to "Flicker") */
  name?: string;
  /** Single message or array of messages to show sequentially */
  messages: string | string[];
  /** Called when user advances past all messages */
  onAdvance: () => void;
  /** Typewriter speed (chars/sec) */
  speed?: number;
}

export default function DialogueScreen({ name, messages, onAdvance, speed }: Props) {
  const insets = useSafeAreaInsets();
  const msgArray = typeof messages === 'string' ? [messages] : messages;

  return (
    <View style={styles.container}>
      <DialogueScene />
      <View style={[styles.overlay, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.spacer} />
        <DialogueBox
          name={name}
          messages={msgArray}
          onComplete={onAdvance}
          speed={speed}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
});
