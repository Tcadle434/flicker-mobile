import React from 'react';
import DialogueScreen from '../DialogueScreen';

interface Props { onNext: () => void; }

export default function Step7ImagineReclaiming({ onNext }: Props) {
  return (
    <DialogueScreen
      messages="Imagine reclaiming that time... What would you do with hundreds of extra hours? More sleep? More creativity? More presence with the people you love?"
      onAdvance={onNext}
    />
  );
}
