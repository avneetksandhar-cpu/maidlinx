#!/usr/bin/env bash
# Regenerate Capacitor iOS App Icon + Splash from real MaidLinx brand assets.
# Usage: from repo root → bash native/scripts/generate-ios-assets.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

mkdir -p native/assets native/www/assets \
  ios/App/App/Assets.xcassets/AppIcon.appiconset \
  ios/App/App/Assets.xcassets/Splash.imageset

# App Icon: mark-only (no wordmark) — Apple guideline friendly
sips -s format png -z 1024 1024 public/brand/icon-512.png \
  --out native/assets/AppIcon-1024.png >/dev/null
cp native/assets/AppIcon-1024.png \
  ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png

# Offline web assets
sips -z 512 512 public/brand/icon-512.png --out native/www/assets/icon-512.png >/dev/null
sips -z 180 180 public/brand/apple-touch-icon.png \
  --out native/www/assets/apple-touch-icon.png >/dev/null

# Splash: #003474 (logo navy) + centered mark
swift -e '
import AppKit
let size = NSSize(width: 2732, height: 2732)
let image = NSImage(size: size)
image.lockFocus()
NSColor(calibratedRed: 0/255, green: 52/255, blue: 116/255, alpha: 1).setFill()
NSRect(origin: .zero, size: size).fill()
if let mark = NSImage(contentsOfFile: "public/brand/maidlinx-mark.png") {
  let markSide: CGFloat = 720
  let rect = NSRect(
    x: (size.width - markSide)/2,
    y: (size.height - markSide)/2,
    width: markSide,
    height: markSide
  )
  mark.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1.0)
}
image.unlockFocus()
guard let tiff = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else {
  fatalError("splash png fail")
}
try png.write(to: URL(fileURLWithPath: "native/assets/splash-2732.png"))
print("splash ok")
'
cp native/assets/splash-2732.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png
cp native/assets/splash-2732.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png
cp native/assets/splash-2732.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png
echo "iOS brand assets regenerated."
