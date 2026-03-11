import React from 'react';
import DialogueScreen from '../DialogueScreen';

interface Props { onNext: () => void; }

export default function Step19FlickerExcited({ onNext }: Props) {
  return (
    <DialogueScreen
      messages="I can't wait to get started! This is going to be amazing. Let's begin your journey to a calmer, more focused you."
      onAdvance={onNext}
    />
  );
}
