import { Tabs } from "expo-router";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { FloatingBottomNavigation } from "@/shared/ui/FloatingBottomNavigation";
import { TabSwipeArea } from "@/shared/ui/TabSwipeArea";
import { useTheme } from "@/theme";

export default function MainLayout() {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <TabSwipeArea>
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          lazy: false,
          animation: reduceMotion ? "none" : "shift",
          transitionSpec: {
            animation: "timing",
            config: { duration: 120, useNativeDriver: true },
          },
          sceneStyle: { backgroundColor: theme.colors.background },
        }}
        tabBar={(props) => <FloatingBottomNavigation {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="folders" options={{ title: "Folders" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
    </TabSwipeArea>
  );
}
