import React, { useRef, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	Alert,
	Animated,
	ActivityIndicator,
	TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuthStore } from "../../src/stores";
import { theme } from "../../src/constants/theme";
import OverworldScene from "../../src/components/world/OverworldScene";

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [emailError, setEmailError] = useState("");
	const [sent, setSent] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { resetPassword } = useAuthStore();
	const sceneOpacity = useRef(new Animated.Value(0)).current;

	const handleSceneReady = () => {
		Animated.timing(sceneOpacity, {
			toValue: 1,
			duration: 1200,
			useNativeDriver: true,
		}).start();
	};

	const handleSend = async () => {
		if (!email) {
			setEmailError("Email is required");
			return;
		}
		if (!/\S+@\S+\.\S+/.test(email)) {
			setEmailError("Email is invalid");
			return;
		}
		setEmailError("");
		setIsSubmitting(true);
		try {
			const { error } = await resetPassword(email);
			if (error) {
				Alert.alert("Error", error.message);
			} else {
				setSent(true);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<View style={styles.root}>
			<StatusBar style="light" />

			<Animated.View style={[StyleSheet.absoluteFill, { opacity: sceneOpacity }]}>
				<OverworldScene ambientEffect="rain" onReady={handleSceneReady} />
			</Animated.View>
			<View style={styles.screenOverlay} />

			<KeyboardAvoidingView
				style={styles.fill}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.v2Frame}>
						<View style={styles.v2Mid}>
							<View style={styles.v2Content}>
								{sent ? (
									<>
										<Text style={styles.v2Title}>Check your email</Text>
										<Text style={styles.v2Subtitle}>
											We sent a reset link to {email}. Tap the link in the
											email to set a new password.
										</Text>
										<TouchableOpacity
											onPress={() => router.back()}
											activeOpacity={0.75}
										>
											<View style={styles.v2PrimaryBtn}>
												<Text style={styles.v2PrimaryBtnText}>
													Back to Sign In
												</Text>
											</View>
										</TouchableOpacity>
									</>
								) : (
									<>
										<Text style={styles.v2Title}>Reset password</Text>
										<Text style={styles.v2Subtitle}>
											Enter your email and we'll send you a reset link.
										</Text>

										<View style={styles.fields}>
											<TextInput
												value={email}
												onChangeText={(t) => {
													setEmail(t);
													setEmailError("");
												}}
												placeholder="Email"
												placeholderTextColor="rgba(59,42,26,0.42)"
												keyboardType="email-address"
												autoCapitalize="none"
												autoCorrect={false}
												style={styles.v2Input}
											/>
											{emailError ? (
												<Text style={styles.errorText}>{emailError}</Text>
											) : null}

											<TouchableOpacity
												onPress={handleSend}
												disabled={isSubmitting}
												activeOpacity={0.75}
											>
												<View
													style={[
														styles.v2PrimaryBtn,
														isSubmitting && styles.btnDisabled,
													]}
												>
													{isSubmitting ? (
														<ActivityIndicator color="#3B2A1A" />
													) : (
														<Text style={styles.v2PrimaryBtnText}>
															Send Reset Link
														</Text>
													)}
												</View>
											</TouchableOpacity>
										</View>

										<TouchableOpacity
											onPress={() => router.back()}
											activeOpacity={0.7}
										>
											<Text style={styles.v2BackText}>Back to Sign In</Text>
										</TouchableOpacity>
									</>
								)}
							</View>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	fill: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.xxl,
	},
	screenOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(10, 10, 11, 0.72)",
	},
	fields: {
		width: "100%",
		gap: theme.spacing.xs,
	},
	errorText: {
		color: theme.colors.error,
		fontSize: 12,
		marginTop: -2,
	},
	btnDisabled: {
		opacity: 0.5,
	},
	v2Frame: {
		borderWidth: 3,
		borderColor: "#3D2810",
		borderRadius: 4,
		padding: 3,
		backgroundColor: "#3D2810",
		opacity: 0.65,
	},
	v2Mid: {
		borderWidth: 2,
		borderColor: "#7A5530",
		borderRadius: 2,
		padding: 2,
		backgroundColor: "#7A5530",
	},
	v2Content: {
		backgroundColor: "#EDD9B4",
		borderRadius: 1,
		paddingHorizontal: theme.spacing.xl,
		paddingTop: theme.spacing.xl,
		paddingBottom: theme.spacing.xxl,
		alignItems: "center",
		gap: theme.spacing.md,
	},
	v2Title: {
		fontSize: theme.typography.fontSize.xxxl,
		fontWeight: theme.typography.fontWeight.light,
		letterSpacing: 1,
		textAlign: "center",
		color: "#3B2A1A",
	},
	v2Subtitle: {
		fontSize: theme.typography.fontSize.sm,
		color: "#6B4C2A",
		textAlign: "center",
		marginBottom: theme.spacing.xs,
		lineHeight: 20,
	},
	v2Input: {
		width: "100%",
		height: 48,
		borderRadius: 3,
		backgroundColor: "rgba(59, 42, 26, 0.08)",
		borderWidth: 1,
		borderColor: "rgba(59, 42, 26, 0.28)",
		color: "#3B2A1A",
		fontSize: 15,
		paddingHorizontal: 14,
	},
	v2PrimaryBtn: {
		width: "100%",
		height: 46,
		borderRadius: 3,
		backgroundColor: "rgba(59, 42, 26, 0.18)",
		borderWidth: 1,
		borderColor: "rgba(59, 42, 26, 0.32)",
		alignItems: "center",
		justifyContent: "center",
		marginTop: theme.spacing.xs,
	},
	v2PrimaryBtnText: {
		fontSize: theme.typography.fontSize.md,
		fontWeight: theme.typography.fontWeight.bold,
		color: "#3B2A1A",
		letterSpacing: 0.5,
	},
	v2BackText: {
		fontSize: theme.typography.fontSize.sm,
		color: "#8B7A6A",
		marginTop: theme.spacing.xs,
	},
});
