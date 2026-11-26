import { Switch } from "@expo/ui/jetpack-compose";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { MaterialHost } from "@/shared/ui/MaterialHost";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { Screen } from "@/shared/ui/Screen";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
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

const THEME_SEGMENT_OPTIONS = THEME_OPTIONS.map((option) => ({
  value: option.mode,
  label: option.label,
  accessibilityLabel: `${option.label} theme`,
}));

const OPEN_LINK_OPTIONS = [
  { value: "reader" as const, label: "Reader", accessibilityLabel: "Open in reader" },
  { value: "browser" as const, label: "Browser", accessibilityLabel: "Open in browser" },
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
  const [openLinks, setOpenLinks] = useState<"reader" | "browser">("reader");

  useEffect(() => {
    void getSetting("reader_open_links")
      .then((value) => {
        setOpenLinks(value === "browser" ? "browser" : "reader");
      })
      .catch(() => setOpenLinks("reader"));
  }, []);

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

            <SegmentedControl
              options={THEME_SEGMENT_OPTIONS}
              value={mode}
              onChange={setMode}
            />
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

            <SegmentedControl
              options={OPEN_LINK_OPTIONS}
              value={openLinks}
              onChange={(option) => {
                const previous = openLinks;
                setOpenLinks(option);
                void setSetting("reader_open_links", option).catch(() => {
                  setOpenLinks(previous);
                });
              }}
            />
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
