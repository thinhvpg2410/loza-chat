import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type AuthFlow = "login" | "forgot";

export type AuthStackParamList = {
  Login: undefined;
  OTP: { flow: AuthFlow };
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type TabParamList = {
  Messages: undefined;
  Contacts: undefined;
  Discover: undefined;
  Moments: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Search: undefined;
  ChatDetail: { conversationId: string; title: string };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainNavigationProp = NativeStackNavigationProp<MainStackParamList>;
