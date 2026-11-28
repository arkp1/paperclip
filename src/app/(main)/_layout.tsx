import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, Easing, View } from "react-native";

import { SaveLinkSheet } from "@/features/save-link/components/SaveLinkSheet";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { FloatingBottomNavigation } from "@/shared/ui/FloatingBottomNavigation";
import { FloatingSaveButton } from "@/shared/ui/FloatingSaveButton";
import { TabSwipeArea } from "@/shared/ui/TabSwipeArea";
import { useTheme } from "@/theme";

export default function MainLayout() {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const [saveVisible, setSaveVisible] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (pathname === "/folders" || pathname === "/settings") {
          router.navigate("/");
          return true;
        }
        if (pathname === "/") {
          BackHandler.exitApp();
          return true;
        }
        if (!router.canGoBack()) {
          router.replace("/");
          return true;
        }
        return false;
      }
    );
    return () => subscription.remove();
  }, [pathname, router]);

  return (
    <View style={{ flex: 1 }}>
      <TabSwipeArea>
        <Tabs
          detachInactiveScreens={false}
          screenOptions={{
            headerShown: false,
            lazy: false,
            animation: reduceMotion ? "none" : "shift",
            sceneStyleInterpolator: ({ current }) => ({
              sceneStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-44, 0, 44],
                    }),
                  },
                ],
              },
            }),
            transitionSpec: reduceMotion
              ? undefined
              : {
                  animation: "timing",
                  config: {
                    duration: 240,
                    easing: Easing.bezier(0.2, 0, 0, 1),
                  },
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

      <FloatingSaveButton onPress={() => setSaveVisible(true)} />
      <SaveLinkSheet
        visible={saveVisible}
        onClose={() => setSaveVisible(false)}
        onSaved={() => {
          setSaveVisible(false);
        }}
      />
    </View>
  );
}
