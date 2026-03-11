import React from 'react';
import DialogueScreen from '../DialogueScreen';

interface Props { onNext: () => void; }

export default function Step5bFlickerTransition({ onNext }: Props) {
  return (
    <DialogueScreen
      messages="Let's learn a bit more about you, and then I'll show you everything we can do together."
      onAdvance={onNext}
    />
  );
}
