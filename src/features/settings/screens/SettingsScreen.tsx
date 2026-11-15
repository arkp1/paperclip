import { Switch } from "@expo/ui/jetpack-compose";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { MaterialHost } from "@/shared/ui/MaterialHost";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { styles } from "@/styles/features/settings/SettingsScreen.styles";
import { accentOptions, accentSwatch, useTheme } from "@/theme";
import type { ThemeMode } from "@/theme/ThemeProvider";
import { resetPrivateVault } from "@/core/database/privateVault";
import { resetLegacyPrivateDataInPublicDatabase } from "@/core/database/vaultTransfers";
import { lockPrivateSpace } from "@/core/security/privateSpaceSession";
import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";

const THEME_OPTIONS: { label: string; mode: ThemeMode }[] = [
  { label: "System", mode: "system" },
  { label: "Light", mode: "light" },
  { label: "Dark", mode: "dark" },
];

export function SettingsScreen() {
  const {
    theme,
    mode,
    setMode,
    accent,
    setAccent,
    amoled,
    setAmoled,
    dynamic,
    setDynamic,
    folderTonal,
    setFolderTonal,
  } = useTheme();
  const router = useRouter();
  const bottomInset = useFloatingNavigationInset();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [openLinks, setOpenLinks] = useState<"reader" | "browser">("reader");
  const selectedIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((option) => option.mode === mode),
  );
  const selection = useSharedValue(selectedIndex);

  useEffect(() => {
    void getSetting("reader_open_links")
      .then((value) => {
        setOpenLinks(value === "browser" ? "browser" : "reader");
      })
      .catch(() => setOpenLinks("reader"));
  }, []);

  useEffect(() => {
    selection.value = withTiming(selectedIndex, {
      duration: 220,
      easing: Easing.bezier(0.2, 0, 0, 1),
    });
  }, [selectedIndex, selection]);

  const selectionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selection.value * (segmentWidth + 2) }],
  }));

  return (
    <Screen>
      <TopAppBar title="Settings" icon="cog-outline" />

      <View style={styles.subtitle}>
        <AppText variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
          Make Paperclip feel like yours.
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      >
        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Appearance
          </AppText>

          <View
            style={[
              styles.group,
              styles.themeGroup,
              { borderColor: theme.colors.outlineVariant },
            ]}
          >
            <View style={styles.themeCopy}>
              <AppText variant="bodyLarge">Theme</AppText>
              <AppText
                variant="bodySmall"
                color={theme.colors.onSurfaceVariant}
              >
                Choose how Paperclip looks.
              </AppText>
            </View>

            <View
              style={[
                styles.segmented,
                {
                  backgroundColor: theme.colors.surfaceContainer,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              onLayout={(event) => {
                const available = event.nativeEvent.layout.width - 6 - 4;
                setSegmentWidth(Math.max(0, available / 3));
              }}
            >
              {segmentWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.segmentPill,
                    {
                      width: segmentWidth,
                      backgroundColor: theme.colors.primaryContainer,
                    },
                    selectionStyle,
                  ]}
                />
              ) : null}
              {THEME_OPTIONS.map((option) => {
                const selected = option.mode === mode;
                return (
                  <ScalePressable
                    key={option.mode}
                    accessibilityRole="radio"
                    accessibilityLabel={`${option.label} theme`}
                    accessibilityState={{ checked: selected }}
                    onPress={() => setMode(option.mode)}
                    pressFeedback="scale"
                    scaleTo={0.97}
                    style={styles.segment}
                  >
                    <AppText
                      variant="labelLarge"
                      color={
                        selected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant
                      }
                    >
                      {option.label}
                    </AppText>
                  </ScalePressable>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.group,
              styles.themeGroup,
              { borderColor: theme.colors.outlineVariant },
            ]}
          >
            <View style={styles.themeCopy}>
              <AppText variant="bodyLarge">Accent</AppText>
              <AppText
                variant="bodySmall"
                color={theme.colors.onSurfaceVariant}
              >
                Choose the accent used across Paperclip.
              </AppText>
            </View>

            <View style={styles.accentRow}>
              {accentOptions.map((option) => {
                const selected = accent === option.key;
                return (
                  <ScalePressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityLabel={`${option.label} accent`}
                    accessibilityState={{ checked: selected }}
                    onPress={() => setAccent(option.key)}
                    scaleTo={0.92}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: accentSwatch(option.key),
                        borderColor: selected
                          ? theme.colors.onSurface
                          : "transparent",
                      },
                    ]}
                  >
                    {selected ? (
                      <View
                        style={[
                          styles.swatchCheck,
                          { backgroundColor: theme.colors.surface },
                        ]}
                      />
                    ) : null}
                  </ScalePressable>
                );
              })}
            </View>
          </View>

          <View
            style={[styles.group, { borderColor: theme.colors.outlineVariant }]}
          >
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <AppText variant="bodyLarge">AMOLED black</AppText>
                <AppText
                  variant="bodySmall"
                  color={theme.colors.onSurfaceVariant}
                >
                  Use a pure black background whenever the dark theme is active.
                </AppText>
              </View>
              <MaterialHost matchContents>
                <Switch
                  value={amoled}
                  onCheckedChange={setAmoled}
                  modifiers={[
                    semantics({
                      contentDescription: "AMOLED black background",
                    }),
                  ]}
                />
              </MaterialHost>
            </View>

            {Platform.OS === "android" && Number(Platform.Version) >= 31 ? (
              <View
                style={[
                  styles.row,
                  {
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.rowCopy}>
                  <AppText variant="bodyLarge">Dynamic colour</AppText>
                  <AppText
                    variant="bodySmall"
                    color={theme.colors.onSurfaceVariant}
                  >
                    Native Material controls follow your Android wallpaper. App
                    surfaces keep the selected accent.
                  </AppText>
                </View>
                <MaterialHost matchContents>
                  <Switch
                    value={dynamic}
                    onCheckedChange={setDynamic}
                    modifiers={[
                      semantics({ contentDescription: "Dynamic colour" }),
                    ]}
                  />
                </MaterialHost>
              </View>
            ) : null}
          </View>

          <View
            style={[styles.group, { borderColor: theme.colors.outlineVariant }]}
          >
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <AppText variant="bodyLarge">Folder Accent</AppText>
                <AppText
                  variant="bodySmall"
                  color={theme.colors.onSurfaceVariant}
                >
                  Tint each folder card from its assigned colour. Off keeps the
                  neutral card surface.
                </AppText>
              </View>
              <MaterialHost matchContents>
                <Switch
                  value={folderTonal}
                  onCheckedChange={setFolderTonal}
                  modifiers={[
                    semantics({ contentDescription: "Tonal folder cards" }),
                  ]}
                />
              </MaterialHost>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Reading
          </AppText>

          <View
            style={[
              styles.group,
              styles.themeGroup,
              { borderColor: theme.colors.outlineVariant },
            ]}
          >
            <View style={styles.themeCopy}>
              <AppText variant="bodyLarge">Open links in</AppText>
              <AppText
                variant="bodySmall"
                color={theme.colors.onSurfaceVariant}
              >
                Private links always open in the protected reader.
              </AppText>
            </View>

            <View
              style={[
                styles.segmented,
                {
                  backgroundColor: theme.colors.surfaceContainer,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              {(["reader", "browser"] as const).map((option) => {
                const selected = openLinks === option;
                return (
                  <ScalePressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityLabel={
                      option === "reader" ? "Open in reader" : "Open in browser"
                    }
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      setOpenLinks(option);
                      void setSetting("reader_open_links", option).catch(
                        () => undefined
                      );
                    }}
                    scaleTo={0.97}
                    style={[
                      styles.segment,
                      selected
                        ? { backgroundColor: theme.colors.primaryContainer }
                        : null,
                    ]}
                  >
                    <AppText
                      variant="labelLarge"
                      color={
                        selected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant
                      }
                    >
                      {option === "reader" ? "Reader" : "Browser"}
                    </AppText>
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Privacy &amp; security
          </AppText>

          <View
            style={[styles.group, { borderColor: theme.colors.outlineVariant }]}
          >
            <InfoRow
              icon="shield-lock-outline"
              title="Locked folders"
              description="Lock folders from their menu. Private data is stored in a SQLCipher vault unlocked with biometrics or your device PIN."
            />
            <InfoRow
              icon="lock-outline"
              title="Session lock"
              description="Unlocked folders lock again when Paperclip leaves the foreground."
            />
          </View>
          <Button
            label="Reset private vault"
            variant="text"
            onPress={() => {
              Alert.alert(
                "Reset private vault?",
                "This permanently deletes every private folder, saved link, article, annotation, and preview. Public data is not affected.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset vault",
                    style: "destructive",
                    onPress: () => {
                      lockPrivateSpace();
                      void resetLegacyPrivateDataInPublicDatabase()
                        .then(() => resetPrivateVault())
                        .then(() =>
                          Alert.alert(
                            "Private vault reset",
                            "The encrypted private vault and legacy private data were removed."
                          )
                        )
                        .catch((error: unknown) =>
                          Alert.alert(
                            "Reset incomplete",
                            __DEV__ && error instanceof Error
                              ? `Some private data may remain. Retry the reset. ${error.message}`
                              : "Some private data may remain. Retry the reset."
                          )
                        );
                    },
                  },
                ]
              );
            }}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Your data
          </AppText>

          <View
            style={[styles.group, { borderColor: theme.colors.outlineVariant }]}
          >
            <ScalePressable
              onPress={() => router.push("/backup")}
              scaleTo={0.99}
            >
              <InfoRow
                icon="database-outline"
                title="Import &amp; export"
                description="Export a public backup or merge one into this library."
              />
            </ScalePressable>
            <InfoRow
              icon="information-outline"
              title="Local-first storage"
              description="Folders and links live in this device's SQLite database. Uninstalling the app removes them unless you keep a backup."
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            About
          </AppText>

          <View
            style={[styles.group, { borderColor: theme.colors.outlineVariant }]}
          >
            <InfoRow
              icon="paperclip"
              title={`Paperclip ${version}`}
              description="A local-first library for links worth keeping."
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

type InfoRowProps = {
  icon: IconName;
  title: string;
  description: string;
};

function InfoRow({ icon, title, description }: InfoRowProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.row, { borderColor: theme.colors.outlineVariant }]}
      accessible
      accessibilityLabel={`${title}. ${description}`}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={theme.colors.onSurfaceVariant}
      />
      <View style={styles.rowCopy}>
        <AppText variant="bodyLarge">{title}</AppText>
        <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
          {description}
        </AppText>
      </View>
    </View>
  );
}
