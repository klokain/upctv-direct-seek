# UPC TV Direct Seek

A small local Brave extension that adds direct seeking to the UPC TV web player on `upctv.sk`.

## Features

- **Right Arrow**: seek forward 30 seconds
- **Left Arrow**: seek backward 30 seconds
- **Shift + Right Arrow**: seek forward 2 minutes
- **Shift + Left Arrow**: seek backward 2 minutes
- On-screen **+30s** and **+2m** buttons during playback
- Works with UPC TV's archived-program player
- Runs only on `https://upctv.sk/*` and `https://*.upctv.sk/*`

The extension changes only the active HTML media element's playback position. It does not modify authentication, DRM, network requests, or stream data.

## Install on Omarchy/Brave

```bash
git clone https://github.com/klokain/upctv-direct-seek.git
cd upctv-direct-seek
./install.sh
```

Then completely close Brave and all Brave web apps before reopening UPC TV. Chromium reads `--load-extension` only when the browser profile process starts.

UPC TV also requires Widevine for protected playback. In Brave, enable Widevine when prompted or under `brave://settings/extensions`.

## Manual installation

1. Open `brave://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository's `extension/` directory.

Alternatively, add the absolute extension directory to Brave's `--load-extension` flag.

## Uninstall

From the cloned repository:

```bash
./uninstall.sh
```

Then restart Brave and its web apps.

## Notes

This is an unofficial client-side customization and is not affiliated with UPC or Liberty Global. Provider terms and applicable law may vary by jurisdiction.
