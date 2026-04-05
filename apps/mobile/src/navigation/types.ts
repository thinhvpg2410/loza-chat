import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type AuthFlow = "login" | "forgot";

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  OTP: { flow: AuthFlow };
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Home: undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
