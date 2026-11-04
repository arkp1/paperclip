import { useFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ShareIntentProvider } from "expo-share-intent";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ShareIntentRouter } from "@/features/save-link/components/ShareIntentRouter";
import { DatabaseGate } from "@/shared/ui/DatabaseGate";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { ThemeProvider, useTheme } from "@/theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ ...MaterialCommunityIcons.font });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShareIntentProvider options={{ resetOnBackground: true }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <DatabaseGate>
              <ShareIntentRouter />
              <ThemedNavigator />
            </DatabaseGate>
          </ThemeProvider>
        </SafeAreaProvider>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
}

function ThemedNavigator() {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const baseTheme = theme.scheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      primary: theme.colors.primary,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: reduceMotion ? "none" : "slide_from_right",
            animationDuration: 120,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </View>
    </NavigationThemeProvider>
  );
}
