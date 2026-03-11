import React from 'react';
import DialogueScreen from '../DialogueScreen';

interface Props { onNext: () => void; }

export default function Step12BestPart({ onNext }: Props) {
  return (
    <DialogueScreen
      messages="And the best part? Every session you complete earns you Light — a special currency you can use to decorate my home and unlock new things!"
      onAdvance={onNext}
    />
  );
}
