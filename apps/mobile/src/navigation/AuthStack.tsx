import { ForgotPasswordScreen } from "@/screens/auth/ForgotPasswordScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { OTPScreen } from "@/screens/auth/OTPScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { ResetPasswordScreen } from "@/screens/auth/ResetPasswordScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Đăng nhập", headerBackTitle: "" }}
      />
      <Stack.Screen name="OTP" component={OTPScreen} options={{ title: "Xác thực OTP" }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Tạo tài khoản" }} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: "Quên mật khẩu" }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: "Đặt lại mật khẩu" }}
      />
    </Stack.Navigator>
  );
}
