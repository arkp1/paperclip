"use no memo";

import {
  FlexWidget,
  ImageWidget,
  ListWidget,
  TextWidget,
} from "react-native-android-widget";

import type { WidgetData } from "@/features/widgets/widgetData";

type WidgetTheme = "light" | "dark";

const palette = {
  light: {
    background: "#F7F4EE",
    surface: "#FFFEFA",
    text: "#1C1B1F",
    muted: "#625B71",
    primary: "#5B4B8A",
  },
  dark: {
    background: "#1B1922",
    surface: "#252331",
    text: "#E7E1E9",
    muted: "#B9B3C4",
    primary: "#CBBEFF",
  },
} as const;

const openUri = (id: string) => `paperclip://bookmarks/${encodeURIComponent(id)}`;

function EmptyState({ theme }: { theme: WidgetTheme }) {
  const colors = palette[theme];
  return (
    <FlexWidget
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
      }}
    >
      <TextWidget
        text="No saved links yet"
        style={{ fontSize: 13, color: colors.muted }}
      />
    </FlexWidget>
  );
}

export function PaperclipSmallWidget({
  data,
  theme,
}: {
  data: WidgetData;
  theme: WidgetTheme;
}) {
  const colors = palette[theme];
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.background,
        borderRadius: 22,
        padding: 14,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <FlexWidget style={{ flexDirection: "column" }}>
        <TextWidget
          text={String(data.total)}
          style={{ fontSize: 30, color: colors.text }}
        />
        <TextWidget
          text="saved links"
          style={{ fontSize: 12, color: colors.muted }}
        />
      </FlexWidget>
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: "paperclip://clipboard-save" }}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 18,
          paddingVertical: 7,
          paddingHorizontal: 10,
          alignItems: "center",
        }}
      >
        <TextWidget
          text="+ Paste link"
          style={{ fontSize: 12, color: theme === "dark" ? "#1B1922" : "#FFFFFF" }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export function PaperclipMediumWidget({
  data,
  theme,
}: {
  data: WidgetData;
  theme: WidgetTheme;
}) {
  const colors = palette[theme];
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.background,
        borderRadius: 22,
        padding: 14,
        flexDirection: "column",
      }}
    >
      <TextWidget
        text="Recent links"
        style={{ fontSize: 13, color: colors.primary }}
      />
      {data.bookmarks.length === 0 ? (
        <EmptyState theme={theme} />
      ) : (
        <ListWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            backgroundColor: colors.background,
          }}
        >
          {data.bookmarks.slice(0, 8).map((bookmark) => (
            <FlexWidget
              key={bookmark.id}
              clickAction="OPEN_URI"
              clickActionData={{ uri: openUri(bookmark.id) }}
              style={{
                width: "match_parent",
                height: 42,
                flexDirection: "column",
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              <TextWidget
                text={bookmark.title}
                maxLines={1}
                style={{ fontSize: 13, color: colors.text }}
              />
              <TextWidget
                text={bookmark.source}
                maxLines={1}
                style={{ fontSize: 11, color: colors.muted }}
              />
            </FlexWidget>
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}

export function PaperclipLargeWidget({
  data,
  theme,
}: {
  data: WidgetData;
  theme: WidgetTheme;
}) {
  const colors = palette[theme];
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.background,
        borderRadius: 22,
        padding: 12,
        flexDirection: "column",
      }}
    >
      <TextWidget
        text={`${data.total} saved links`}
        style={{ fontSize: 14, color: colors.primary, paddingBottom: 6 }}
      />
      {data.bookmarks.length === 0 ? (
        <EmptyState theme={theme} />
      ) : (
        <ListWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            backgroundColor: colors.background,
          }}
        >
          {data.bookmarks.map((bookmark) => (
            <FlexWidget
              key={bookmark.id}
              clickAction="OPEN_URI"
              clickActionData={{ uri: openUri(bookmark.id) }}
              style={{
                width: "match_parent",
                height: 54,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 2,
              }}
            >
              <FlexWidget
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10,
                }}
              >
                {bookmark.thumbnail ? (
                  <ImageWidget
                    image={bookmark.thumbnail}
                    imageWidth={34}
                    imageHeight={34}
                    radius={10}
                    resizeMode="cover"
                  />
                ) : (
                  <TextWidget
                    text={bookmark.title.slice(0, 1).toUpperCase()}
                    style={{ fontSize: 15, color: colors.primary }}
                  />
                )}
              </FlexWidget>
              <FlexWidget style={{ flex: 1, flexDirection: "column" }}>
                <TextWidget
                  text={bookmark.title}
                  maxLines={1}
                  style={{ fontSize: 13, color: colors.text }}
                />
                <TextWidget
                  text={bookmark.source}
                  maxLines={1}
                  style={{ fontSize: 11, color: colors.muted }}
                />
              </FlexWidget>
            </FlexWidget>
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
