# Paperclip Backup Format

**Format:** `paperclip-backup`  
**Version:** `1`  
**Scope:** public library only

Private folders, private bookmarks, private article text, annotations, and
private preview assets are intentionally excluded.

## Document

```json
{
  "format": "paperclip-backup",
  "version": 1,
  "exportedAt": "ISO-8601 timestamp",
  "scope": "public",
  "folders": [],
  "bookmarks": [],
  "images": []
}
```

- `folders` and `bookmarks` are arrays of validated records.
- `images` contains cached public preview images:

```json
{
  "bookmarkId": "safe-id",
  "extension": "jpg",
  "base64": "..."
}
```

## Import rules

- Import is merge-only; existing folder and bookmark IDs are skipped.
- Duplicate folder names are skipped case-insensitively.
- Invalid HTTP(S) bookmark URLs, unsafe IDs, reserved folder names, and
  overlong folder names are skipped.
- Images are content-signature checked against their declared extension.
- Per-image Base64 is capped at 12 million characters; a backup document is
  capped at 50 million characters.
- Preview files are staged before the database transaction. A failed
  transaction deletes staged files; successfully inserted rows keep their
  staged preview asset.
- A bookmark with an invalid image is still imported with a fallback preview
  and queued for refresh.

## Limits and known gaps

- Import currently runs in one database transaction; very large backups should
  be split by the user.
- Process death between file staging and database commit can leave an
  unreferenced `.import-*` preview file. Startup reconciliation is a planned
  follow-up.
- The format does not include private vault data or a recovery key.
