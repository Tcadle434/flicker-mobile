import React from "react";
import DialogueScreen from "../DialogueScreen";

interface Props {
	onNext: () => void;
}

export default function Step0Welcome({ onNext }: Props) {
	return (
		<DialogueScreen
			messages={[
				"Hey there! Welcome in and congratulations on taking an important step for your mind.",
				"My name is Flicker. I’ll help you make a little more space for calm and focus each day. Great to meet you!",
				"Before we begin, I want you to know something. If you've felt overwhelmed lately, you’re not alone 😔",
			]}
			onAdvance={onNext}
		/>
	);
}
