import { SegmentedControl } from "@expo/ui/community/segmented-control";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Switch } from "@expo/ui/jetpack-compose";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import { ScrollView, View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { MaterialHost } from "@/shared/ui/MaterialHost";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { styles } from "@/styles/features/settings/SettingsScreen.styles";
import { accentOptions, accentSwatch, useTheme } from "@/theme";
import type { ThemeMode } from "@/theme/ThemeProvider";

const THEME_OPTIONS: { label: string; mode: ThemeMode }[] = [
  { label: "System", mode: "system" },
  { label: "Light", mode: "light" },
  { label: "Dark", mode: "dark" },
];

export function SettingsScreen() {
  const { theme, mode, setMode, accent, setAccent, amoled, setAmoled } = useTheme();
  const router = useRouter();
  const bottomInset = useFloatingNavigationInset();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const selectedIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((option) => option.mode === mode)
  );

  return (
    <Screen>
      <TopAppBar title="Settings" icon="cog-outline" />

      <View style={styles.subtitle}>
        <AppText variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
          Make Paperclip feel like yours.
        </AppText>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}>
        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Appearance
          </AppText>

          <View style={[styles.group, styles.themeGroup, { borderColor: theme.colors.outlineVariant }]}>
            <View style={styles.themeCopy}>
              <AppText variant="bodyLarge">Theme</AppText>
              <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                Choose how Paperclip looks.
              </AppText>
            </View>

            <SegmentedControl
              values={THEME_OPTIONS.map((option) => option.label)}
              selectedIndex={selectedIndex}
              onValueChange={(label) => {
                const option = THEME_OPTIONS.find((entry) => entry.label === label);
                if (option) {
                  setMode(option.mode);
                }
              }}
              tintColor={theme.colors.primary}
              appearance={theme.scheme}
              accessibilityLabel="Theme"
              style={styles.segmented}
            />
          </View>

          <View
            style={[styles.group, styles.themeGroup, { borderColor: theme.colors.outlineVariant }]}
          >
            <View style={styles.themeCopy}>
              <AppText variant="bodyLarge">Accent</AppText>
              <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
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
                <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                  Use a pure black background whenever the dark theme is active.
                </AppText>
              </View>
              <MaterialHost matchContents>
                <Switch
                  value={amoled}
                  onCheckedChange={setAmoled}
                  modifiers={[
                    semantics({ contentDescription: "AMOLED black background" }),
                  ]}
                />
              </MaterialHost>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Privacy &amp; security
          </AppText>

          <View style={[styles.group, { borderColor: theme.colors.outlineVariant }]}>
            <InfoRow
              icon="shield-lock-outline"
              title="Locked folders"
              description="Lock folders from their menu. Unlocking uses biometrics or your device PIN; database encryption is not enabled in this build."
            />
            <InfoRow
              icon="lock-outline"
              title="Session lock"
              description="Unlocked folders lock again when Paperclip leaves the foreground."
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Your data
          </AppText>

          <View style={[styles.group, { borderColor: theme.colors.outlineVariant }]}>
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

          <View style={[styles.group, { borderColor: theme.colors.outlineVariant }]}>
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
