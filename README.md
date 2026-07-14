# Premium Facebook Text Styler

A lightweight Chrome Extension for styling text with Unicode characters and copying the result into Facebook, LinkedIn, Zalo, Threads, and other social platforms.

## Features

- Chrome Manifest V3 extension.
- Opens as a Chrome Side Panel.
- 16 Unicode text styles.
- Vietnamese Natural mode for better Vietnamese text handling.
- Prefix and suffix decoration controls.
- Clipboard copy with fallback.
- Offline-friendly, no CDN, no external font loading.

## Install Locally

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select this project folder.
6. Click the extension icon to open the side panel.

## Vietnamese Text Behavior

Unicode mathematical bold/italic alphabets do not include precomposed Vietnamese letters. This extension uses a practical approach:

- `Vietnamese Natural` keeps Vietnamese text readable when the input mixes Vietnamese with ASCII tokens such as `AI`, `247`, or hashtags.
- If the whole input is Vietnamese and would otherwise stay unchanged, the extension falls back to combining marks so the text still receives a visible style.
- `Fancy Unicode` applies the strongest stylized transform and is best for English or Vietnamese text without tone marks.

## Files

- `manifest.json` - Chrome Extension MV3 configuration.
- `background.js` - Side Panel behavior setup.
- `popup.html` - Extension UI.
- `popup.css` - UI styling.
- `popup.js` - Interaction and clipboard handling.
- `text-styles.js` - Unicode style transforms.
- `logo.png` and `icons/` - Extension brand assets.

## Website

Created by Tuyet Chinh: <https://tuyetchinh.com>
