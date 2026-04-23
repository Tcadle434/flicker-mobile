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
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../src/stores";
import { theme } from "../../src/constants/theme";
import OverworldScene from "../../src/components/world/OverworldScene";
import { hydrateAuthenticatedUserData } from "../../src/services/app/userDataHydration";
import { resolveAuthEntryMode } from "../../src/services/auth/authEntryMode";
import { routeAfterAuth } from "../../src/services/auth/postAuthRouting";

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const params = useLocalSearchParams<{ mode?: string | string[] }>();
	const authMode = resolveAuthEntryMode(params.mode);
	const allowSignup = authMode === "postPaywallRequired";

	const { signIn, signInWithApple, signInWithGoogle, isLoading } = useAuthStore();

	const sceneOpacity = useRef(new Animated.Value(0)).current;

	const handleSceneReady = () => {
		Animated.timing(sceneOpacity, {
			toValue: 1,
			duration: 1200,
			useNativeDriver: true,
		}).start();
	};

	const validateForm = () => {
		const newErrors: { email?: string; password?: string } = {};
		if (!email) newErrors.email = "Email is required";
		else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
		if (!password) newErrors.password = "Password is required";
		else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSignIn = async () => {
		if (!validateForm()) return;
		setIsSubmitting(true);
		try {
			const { error } = await signIn(email, password);
			if (error) {
				Alert.alert("Sign In Failed", error.message);
				return;
			}

			try {
				await hydrateAuthenticatedUserData();
			} catch (hydrateError) {
				console.warn("[auth] Failed to hydrate user data after sign-in", hydrateError);
			}

			await routeAfterAuth();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAppleSignIn = async () => {
		setIsSubmitting(true);
		try {
			const { error } = await signInWithApple();
			if (error && error.message !== "CANCELED") {
				Alert.alert("Apple Sign In Failed", error.message);
				return;
			}
			if (!error) {
				try {
					await hydrateAuthenticatedUserData();
				} catch (hydrateError) {
					console.warn("[auth] Failed to hydrate after Apple sign-in", hydrateError);
				}
				await routeAfterAuth();
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsSubmitting(true);
		try {
			const { error } = await signInWithGoogle();
			if (error && error.message !== "CANCELED") {
				Alert.alert("Google Sign In Failed", error.message);
				return;
			}
			if (!error) {
				try {
					await hydrateAuthenticatedUserData();
				} catch (hydrateError) {
					console.warn("[auth] Failed to hydrate after Google sign-in", hydrateError);
				}
				await routeAfterAuth();
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
								<Text style={styles.v2Title}>Welcome back</Text>
								<Text style={styles.v2Subtitle}>
									{authMode === "postPaywallRequired"
										? "Sign in to continue into Flicker."
										: "Let the noise fade."}
								</Text>

								<View style={styles.fields}>
									<TextInput
										value={email}
										onChangeText={setEmail}
										placeholder="Email"
										placeholderTextColor="rgba(59,42,26,0.42)"
										keyboardType="email-address"
										autoCapitalize="none"
										autoCorrect={false}
										style={styles.v2Input}
									/>
									{errors.email && (
										<Text style={styles.errorText}>{errors.email}</Text>
									)}

									<TextInput
										value={password}
										onChangeText={setPassword}
										placeholder="Password"
										placeholderTextColor="rgba(59,42,26,0.42)"
										secureTextEntry
										style={styles.v2Input}
									/>
									{errors.password && (
										<Text style={styles.errorText}>{errors.password}</Text>
									)}

									<TouchableOpacity
										style={styles.forgotRow}
										onPress={() => router.push("/(auth)/forgot-password")}
										activeOpacity={0.7}
									>
										<Text style={styles.v2ForgotText}>Forgot Password?</Text>
									</TouchableOpacity>

									<TouchableOpacity
										onPress={handleSignIn}
										disabled={isLoading || isSubmitting}
										activeOpacity={0.75}
									>
										<View
											style={[
												styles.v2PrimaryBtn,
												(isLoading || isSubmitting) && styles.btnDisabled,
											]}
										>
											{isLoading || isSubmitting ? (
												<ActivityIndicator color="#3B2A1A" />
											) : (
												<Text style={styles.v2PrimaryBtnText}>Sign In</Text>
											)}
										</View>
									</TouchableOpacity>
								</View>

								<View style={styles.v2DividerRow}>
									<View style={styles.v2DividerLine} />
									<Text style={styles.v2DividerText}>or</Text>
									<View style={styles.v2DividerLine} />
								</View>

								<View style={styles.socialGroup}>
									<TouchableOpacity
										style={styles.v2SocialBtn}
										onPress={handleAppleSignIn}
										activeOpacity={0.75}
									>
										<Text style={styles.v2AppleIcon}>{"\uF8FF"}</Text>
										<Text style={styles.v2SocialBtnText}>
											Continue with Apple
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.v2SocialBtn}
										onPress={handleGoogleSignIn}
										activeOpacity={0.75}
									>
										<Text style={styles.googleG}>G</Text>
										<Text style={styles.v2SocialBtnText}>
											Continue with Google
										</Text>
									</TouchableOpacity>
								</View>

								{allowSignup && (
									<View style={styles.switchRow}>
										<Text style={styles.v2SwitchText}>Need an account? </Text>
										<TouchableOpacity
											onPress={() =>
												router.push("/(auth)/signup?mode=postPaywallRequired")
											}
											activeOpacity={0.7}
										>
											<Text style={styles.v2SwitchLink}>Create one</Text>
										</TouchableOpacity>
									</View>
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
	forgotRow: {
		alignSelf: "flex-end",
		paddingVertical: theme.spacing.xs,
	},
	btnDisabled: {
		opacity: 0.5,
	},
	socialGroup: {
		width: "100%",
		gap: theme.spacing.sm,
	},
	googleG: {
		fontSize: 16,
		fontWeight: "700",
		color: "#4285F4",
		lineHeight: 20,
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: theme.spacing.xs,
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
	v2ForgotText: {
		fontSize: theme.typography.fontSize.xs,
		color: "#8B7A6A",
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
	v2DividerRow: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.sm,
	},
	v2DividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: "rgba(59, 42, 26, 0.20)",
	},
	v2DividerText: {
		color: "#8B7A6A",
		fontSize: theme.typography.fontSize.xs,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	v2SocialBtn: {
		width: "100%",
		height: 48,
		borderRadius: 3,
		borderWidth: 1,
		borderColor: "rgba(59, 42, 26, 0.28)",
		backgroundColor: "rgba(59, 42, 26, 0.08)",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	v2AppleIcon: {
		fontSize: 18,
		color: "#3B2A1A",
		lineHeight: 22,
	},
	v2SocialBtnText: {
		fontSize: theme.typography.fontSize.sm,
		color: "#3B2A1A",
		fontWeight: theme.typography.fontWeight.medium,
	},
	v2SwitchText: {
		fontSize: theme.typography.fontSize.sm,
		color: "#8B7A6A",
	},
	v2SwitchLink: {
		fontSize: theme.typography.fontSize.sm,
		color: "#5C3E22",
		fontWeight: theme.typography.fontWeight.semibold,
	},
});
