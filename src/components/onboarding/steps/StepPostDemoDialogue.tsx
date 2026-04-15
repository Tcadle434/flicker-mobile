import React from 'react';
import DialogueScreen from '../DialogueScreen';

interface Props { onNext: () => void; }

export default function StepPostDemoDialogue({ onNext }: Props) {
  return (
    <DialogueScreen
      messages="Pretty cool right? I just need to request a couple permissions from you and then we can hop right in."
      onAdvance={onNext}
    />
  );
}
