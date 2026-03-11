import React from 'react';
import DialogueScreen from '../DialogueScreen';

interface Props { onNext: () => void; }

export default function Step4FlickerReacts({ onNext }: Props) {
  return (
    <DialogueScreen
      messages="That's a lot, right? But here's the thing... it doesn't have to be this way. You have more power than you think."
      onAdvance={onNext}
    />
  );
}
