import type { MainStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export function useMainStackNavigation(): NativeStackNavigationProp<MainStackParamList> {
  const nav = useNavigation();
  const tabNav = nav.getParent();
  const stackNav = tabNav?.getParent();
  return (stackNav ?? nav) as unknown as NativeStackNavigationProp<MainStackParamList>;
}
