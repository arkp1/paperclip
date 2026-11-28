import { Switch } from "@expo/ui/jetpack-compose";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";

import { appAlert as Alert } from "@/shared/ui/appAlert";

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
                Light, dark, or follow the system.
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
                Pick an accent colour.
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
                  Use pure black in dark mode.
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
                    Match native controls to your wallpaper.
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
                  Tint folder cards with their colour.
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
                Private links always use the protected reader.
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
              description="Lock folders from their menu. Private data stays in a secured vault."
            />
            <InfoRow
              icon="lock-outline"
              title="Session lock"
              description="Private folders lock when you leave the app."
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
              accessibilityRole="button"
              accessibilityLabel="Import and export. Back up or restore your public library."
            >
              <InfoRow
                icon="database-outline"
                title="Import & export"
                description="Back up or restore your public library."
                action
              />
            </ScalePressable>
            <InfoRow
              icon="information-outline"
              title="Local-first storage"
              description="Your library stays on this device."
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
  action?: boolean;
};

function InfoRow({ icon, title, description, action = false }: InfoRowProps) {
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
        color={action ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
      <View style={styles.rowCopy}>
        <AppText variant="bodyLarge">{title}</AppText>
        <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
          {description}
        </AppText>
      </View>
      {action ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.primary}
        />
      ) : null}
    </View>
  );
}
