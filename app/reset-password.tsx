import React, { useEffect, useRef, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../src/stores";
import { theme } from "../src/constants/theme";
import OverworldScene from "../src/components/world/OverworldScene";
import { supabase } from "../src/services/api/supabase";

export default function ResetPassword() {
	const { code } = useLocalSearchParams<{ code?: string }>();

	const [sessionReady, setSessionReady] = useState(false);
	const [sessionError, setSessionError] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { updatePassword } = useAuthStore();
	const sceneOpacity = useRef(new Animated.Value(0)).current;

	const handleSceneReady = () => {
		Animated.timing(sceneOpacity, {
			toValue: 1,
			duration: 1200,
			useNativeDriver: true,
		}).start();
	};

	useEffect(() => {
		console.log("[reset-password] code param:", code);

		if (!code) {
			setSessionError("Invalid or expired reset link. Please request a new one.");
			return;
		}

		supabase.auth.exchangeCodeForSession(String(code)).then(({ error }) => {
			if (error) {
				console.log("[reset-password] exchangeCodeForSession error:", error.message);
				setSessionError("This reset link has expired. Please request a new one.");
			} else {
				console.log("[reset-password] session established successfully");
				setSessionReady(true);
			}
		});
	}, [code]);

	const handleSetPassword = async () => {
		const newErrors: { password?: string; confirm?: string } = {};
		if (!newPassword) newErrors.password = "Password is required";
		else if (newPassword.length < 6)
			newErrors.password = "Password must be at least 6 characters";
		if (!confirmPassword) newErrors.confirm = "Please confirm your password";
		else if (newPassword !== confirmPassword) newErrors.confirm = "Passwords do not match";

		if (Object.keys(newErrors).length) {
			setErrors(newErrors);
			return;
		}
		setErrors({});

		setIsSubmitting(true);
		try {
			const { error } = await updatePassword(newPassword);
			if (error) {
				Alert.alert("Error", error.message);
				return;
			}
			router.replace("/(auth)/signin");
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
								{sessionError ? (
									<>
										<Text style={styles.v2Title}>Link expired</Text>
										<Text style={styles.v2Subtitle}>{sessionError}</Text>
										<TouchableOpacity
											onPress={() =>
												router.replace("/(auth)/forgot-password")
											}
											activeOpacity={0.75}
										>
											<View style={styles.v2PrimaryBtn}>
												<Text style={styles.v2PrimaryBtnText}>
													Request New Link
												</Text>
											</View>
										</TouchableOpacity>
									</>
								) : !sessionReady ? (
									<>
										<ActivityIndicator color="#3B2A1A" size="small" />
										<Text style={styles.v2Subtitle}>Verifying link…</Text>
									</>
								) : (
									<>
										<Text style={styles.v2Title}>Set new password</Text>
										<Text style={styles.v2Subtitle}>
											Choose a password at least 6 characters long.
										</Text>

										<View style={styles.fields}>
											<TextInput
												value={newPassword}
												onChangeText={setNewPassword}
												placeholder="New password"
												placeholderTextColor="rgba(59,42,26,0.42)"
												secureTextEntry
												style={styles.v2Input}
											/>
											{errors.password && (
												<Text style={styles.errorText}>
													{errors.password}
												</Text>
											)}

											<TextInput
												value={confirmPassword}
												onChangeText={setConfirmPassword}
												placeholder="Confirm new password"
												placeholderTextColor="rgba(59,42,26,0.42)"
												secureTextEntry
												style={styles.v2Input}
											/>
											{errors.confirm && (
												<Text style={styles.errorText}>{errors.confirm}</Text>
											)}

											<TouchableOpacity
												onPress={handleSetPassword}
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
															Update Password
														</Text>
													)}
												</View>
											</TouchableOpacity>
										</View>
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
});
