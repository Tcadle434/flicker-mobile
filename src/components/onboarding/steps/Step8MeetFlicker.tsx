import React from 'react';
import DialogueScreen from '../DialogueScreen';

interface Props { onNext: () => void; }

export default function Step8MeetFlicker({ onNext }: Props) {
  return (
    <DialogueScreen
      messages="I'm Flicker! I'm your wellness and focus companion. This forest is my home, and I'd love for you to be a part of it. Let me show you what we can do together."
      onAdvance={onNext}
    />
  );
}
