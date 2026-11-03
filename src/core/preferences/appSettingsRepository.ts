import { getDatabase } from "@/core/database/database";

export type AppSettingKey = "theme_mode" | "bookmark_view" | "bookmark_sort";

export async function getSetting(key: AppSettingKey): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: AppSettingKey, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    Date.now()
  );
}
