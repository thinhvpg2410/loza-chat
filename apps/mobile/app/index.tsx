import { NavigationIndependentTree } from "@react-navigation/native";

import RootNavigator from "@/navigation/RootNavigator";

export default function Index() {
  return (
    <NavigationIndependentTree>
      <RootNavigator />
    </NavigationIndependentTree>
  );
}
