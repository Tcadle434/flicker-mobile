import React from "react";
import DialogueScreen from "../DialogueScreen";

interface Props {
	onNext: () => void;
}

export default function Step0Welcome({ onNext }: Props) {
	return (
		<DialogueScreen
			messages={[
				"Hey there! Welcome in and congratulations on taking an important step for your mental health.",
				"My name is Flicker. I'm your new wellness and productivity companion. Great to meet you!",
				"Before we get started, let's chat through an unfortunate truth regarding today's digital world 😔",
			]}
			onAdvance={onNext}
		/>
	);
}
