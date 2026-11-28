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
    surfaceMuted: "#ECE7DE",
    border: "#DED7CD",
    text: "#1C1B1F",
    muted: "#625B71",
    primary: "#5B4B8A",
    onPrimary: "#FFFFFF",
  },
  dark: {
    background: "#1B1922",
    surface: "#252331",
    surfaceMuted: "#302C3C",
    border: "#3A3547",
    text: "#E7E1E9",
    muted: "#B9B3C4",
    primary: "#CBBEFF",
    onPrimary: "#1B1922",
  },
} as const;

const openUri = (id: string) => `paperclip://bookmarks/${encodeURIComponent(id)}`;
const CLIPBOARD_SAVE_URI = "paperclip://clipboard-save";

function PasteButton({
  theme,
  compact = false,
}: {
  theme: WidgetTheme;
  compact?: boolean;
}) {
  const colors = palette[theme];
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: CLIPBOARD_SAVE_URI }}
      accessibilityLabel="Paste a link from the clipboard"
      style={{
        width: "match_parent",
        height: compact ? 30 : 34,
        backgroundColor: colors.primary,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexGap: 5,
        paddingHorizontal: 10,
      }}
    >
      <TextWidget
        text="+"
        style={{ fontSize: compact ? 14 : 16, fontWeight: "700", color: colors.onPrimary }}
      />
      <TextWidget
        text="Paste link"
        style={{
          fontSize: compact ? 10 : 11,
          fontWeight: "600",
          color: colors.onPrimary,
        }}
      />
    </FlexWidget>
  );
}

function EmptyState({
  theme,
  showPaste = true,
}: {
  theme: WidgetTheme;
  showPaste?: boolean;
}) {
  const colors = palette[theme];
  return (
    <FlexWidget
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexGap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <TextWidget
        text="Nothing saved yet"
        maxLines={1}
        style={{ fontSize: 12, fontWeight: "600", color: colors.text }}
      />
      <TextWidget
        text="Save a link from any app"
        maxLines={1}
        style={{ fontSize: 10, color: colors.muted, textAlign: "center" }}
      />
      {showPaste ? (
        <FlexWidget style={{ width: 128, marginTop: 2 }}>
          <PasteButton theme={theme} compact />
        </FlexWidget>
      ) : null}
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
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 22,
        padding: 12,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <FlexWidget style={{ flexDirection: "column", flexGap: 1 }}>
        <TextWidget
          text={String(data.total)}
          maxLines={1}
          style={{
            fontSize: 32,
            lineHeight: 34,
            fontWeight: "700",
            color: colors.text,
            adjustsFontSizeToFit: true,
          }}
        />
        <TextWidget
          text={data.total === 1 ? "saved link" : "saved links"}
          maxLines={1}
          style={{
            fontSize: 10,
            letterSpacing: 0.6,
            color: colors.muted,
          }}
        />
      </FlexWidget>
      <PasteButton theme={theme} />
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
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 22,
        padding: 12,
        flexDirection: "column",
      }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 7,
        }}
      >
        <TextWidget
          text="Recent links"
          maxLines={1}
          style={{ fontSize: 13, fontWeight: "700", color: colors.text }}
        />
        <TextWidget
          text={`${data.total} saved`}
          maxLines={1}
          style={{ fontSize: 10, color: colors.muted }}
        />
      </FlexWidget>
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
              accessibilityLabel={`${bookmark.title}, ${bookmark.source}`}
              style={{
                width: "match_parent",
                height: 48,
                backgroundColor: colors.surface,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 9,
                marginBottom: 4,
              }}
            >
              <FlexWidget
                style={{ flex: 1, flexDirection: "column", justifyContent: "center" }}
              >
                <TextWidget
                  text={bookmark.title}
                  maxLines={1}
                  truncate="END"
                  style={{
                    fontSize: 12,
                    lineHeight: 15,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                />
                <TextWidget
                  text={bookmark.source}
                  maxLines={1}
                  truncate="END"
                  style={{ fontSize: 9.5, lineHeight: 12, color: colors.muted }}
                />
              </FlexWidget>
              <TextWidget
                text="›"
                style={{ fontSize: 17, color: colors.muted, marginLeft: 6 }}
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
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 22,
        padding: 12,
        flexDirection: "column",
      }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="Recent links"
          maxLines={1}
          style={{ fontSize: 14, fontWeight: "700", color: colors.text }}
        />
        <TextWidget
          text={`${data.total} saved`}
          maxLines={1}
          style={{
            fontSize: 9.5,
            fontWeight: "600",
            color: colors.primary,
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        />
      </FlexWidget>
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
              accessibilityLabel={`${bookmark.title}, ${bookmark.source}`}
              style={{
                width: "match_parent",
                height: 58,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 4,
                marginBottom: 4,
              }}
            >
              <FlexWidget
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceMuted,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 9,
                  overflow: "hidden",
                }}
              >
                {bookmark.thumbnail ? (
                  <ImageWidget
                    image={bookmark.thumbnail}
                    imageWidth={38}
                    imageHeight={38}
                    radius={10}
                    resizeMode="cover"
                  />
                ) : (
                  <TextWidget
                    text={bookmark.title.slice(0, 1).toUpperCase()}
                    maxLines={1}
                    style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}
                  />
                )}
              </FlexWidget>
              <FlexWidget
                style={{ flex: 1, flexDirection: "column", justifyContent: "center" }}
              >
                <TextWidget
                  text={bookmark.title}
                  maxLines={2}
                  truncate="END"
                  style={{
                    fontSize: 12.5,
                    lineHeight: 15,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                />
                <TextWidget
                  text={bookmark.source}
                  maxLines={1}
                  truncate="END"
                  style={{ fontSize: 9.5, lineHeight: 12, color: colors.muted }}
                />
              </FlexWidget>
              <TextWidget
                text="›"
                style={{ fontSize: 17, color: colors.muted, marginLeft: 4 }}
              />
            </FlexWidget>
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
