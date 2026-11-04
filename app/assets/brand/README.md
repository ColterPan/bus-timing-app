# SG BUS brand assets

- **Colour:** SG BUS green `#7AC70C`, the sunlit "lush green" of Singapore's public buses (sampled from bus photos). Light mode uses a deeper `#437A08` for text and icons so they stay readable on white (contrast 5.2:1). `app/src/__tests__/theme.test.ts` guards the contrast.
- **`sg-bus-glyph.svg`:** the white double-decker bus front. Windows and lights are cut-outs, so the background shows through. Edit this file to change the icon.
- **`sg-bus-icon.svg`:** the full app icon (green gradient + glyph), generated from the glyph.

The PNGs in `app/assets/` (`icon.png`, `android-icon-*.png`, `splash-icon.png`, `favicon.png`) and in `app/public/` (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) are exported from these SVGs by rendering them in a headless browser at each size.

| File | Size | Notes |
|---|---|---|
| `icon.png` | 1024 | full-bleed, the OS rounds the corners |
| `android-icon-foreground.png` / `-monochrome.png` | 1024 | transparent, bus inside the adaptive-icon safe zone |
| `android-icon-background.png` | 1024 | solid green |
| `splash-icon.png` | 1024 | transparent, shown on the green splash |
| `favicon.png` | 48 | rounded, for the browser tab |
| `public/icon-192.png`, `icon-512.png` | 192 / 512 | web app manifest (laptop or phone "Add to Home screen") |
| `public/apple-touch-icon.png` | 180 | iPhone home screen |

The "SGBUS" name and green livery are LTA's own public-bus branding. They're fine for personal testing; pick a distinct name before any public release (see `docs/PUBLISHING.md`).
