import { Redirect, useLocalSearchParams } from "expo-router";

import { FolderDetailsScreen } from "@/features/folders/screens/FolderDetailsScreen";

export default function FolderRoute() {
  const params = useLocalSearchParams<{ folderId?: string | string[] }>();
  const folderId = Array.isArray(params.folderId) ? params.folderId[0] : params.folderId;

  if (!folderId) {
    return <Redirect href="/folders" />;
  }

  return <FolderDetailsScreen folderId={folderId} />;
}
