#!/usr/bin/env python3
"""Knock out the solid black field from the Wingman mark. Stdlib only."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

SRC = Path("/tmp/wingman-logo-src.png")
OUT_DIR = Path("/Users/avnee/website/wingman/public/brand")


def read_png(path: Path) -> tuple[int, int, int, list[int]]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Not a PNG")
    pos = 8
    width = height = bit_depth = color_type = 0
    idat = b""
    while pos + 8 <= len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        ctype = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + length]
        pos += 12 + length
        if ctype == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk[:10])
        elif ctype == b"IDAT":
            idat += chunk
        elif ctype == b"IEND":
            break
    if bit_depth != 8 or color_type not in (2, 6):
        raise ValueError(f"Unsupported PNG type depth={bit_depth} color={color_type}")
    raw = zlib.decompress(idat)
    bpp = 3 if color_type == 2 else 4
    stride = width * bpp
    rows: list[bytes] = []
    i = 0
    prev = bytearray(stride)
    for _ in range(height):
        filter_type = raw[i]
        i += 1
        scan = bytearray(raw[i : i + stride])
        i += stride
        recon = bytearray(stride)
        for x in range(stride):
            left = recon[x - bpp] if x >= bpp else 0
            up = prev[x]
            up_left = prev[x - bpp] if x >= bpp else 0
            filt = scan[x]
            if filter_type == 0:
                val = filt
            elif filter_type == 1:
                val = (filt + left) & 255
            elif filter_type == 2:
                val = (filt + up) & 255
            elif filter_type == 3:
                val = (filt + ((left + up) // 2)) & 255
            elif filter_type == 4:
                p = left + up - up_left
                pa, pb, pc = abs(p - left), abs(p - up), abs(p - up_left)
                pred = left if pa <= pb and pa <= pc else up if pb <= pc else up_left
                val = (filt + pred) & 255
            else:
                raise ValueError(f"Unknown filter {filter_type}")
            recon[x] = val
        rows.append(bytes(recon))
        prev = recon
    pixels: list[int] = []
    for row in rows:
        x = 0
        while x < stride:
            r, g, b = row[x], row[x + 1], row[x + 2]
            a = row[x + 3] if bpp == 4 else 255
            pixels.extend((r, g, b, a))
            x += bpp
    return width, height, 4, pixels


def write_png(path: Path, width: int, height: int, pixels: list[int]) -> None:
    def chunk(tag: bytes, payload: bytes) -> bytes:
        crc = zlib.crc32(tag)
        crc = zlib.crc32(payload, crc) & 0xFFFFFFFF
        return struct.pack(">I", len(payload)) + tag + payload + struct.pack(">I", crc)

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(max(0, min(255, int(v))) for v in pixels[start : start + stride])
    compressed = zlib.compress(bytes(raw), 9)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )


def knockout(pixels: list[int]) -> list[int]:
    out = pixels[:]
    for i in range(0, len(out), 4):
        r, g, b = out[i], out[i + 1], out[i + 2]
        mx = max(r, g, b)
        chroma = mx - min(r, g, b)
        # Solid black field (and the pin hole) — not the dark purple of the 3D mark.
        if mx <= 12 and chroma <= 10:
            out[i + 3] = 0
        elif mx <= 24 and chroma <= 12:
            out[i + 3] = int(255 * (mx - 12) / 12)
        # keep original RGB
    return out


def crop_alpha(width: int, height: int, pixels: list[int], pad: int = 24) -> tuple[int, int, list[int]]:
    min_x, min_y, max_x, max_y = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            if pixels[(y * width + x) * 4 + 3] > 8:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < min_x:
        return width, height, pixels
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(width - 1, max_x + pad)
    max_y = min(height - 1, max_y + pad)
    w = max_x - min_x + 1
    h = max_y - min_y + 1
    cropped: list[int] = []
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            i = (y * width + x) * 4
            cropped.extend(pixels[i : i + 4])
    return w, h, cropped


def scale_nearest(width: int, height: int, pixels: list[int], size: int) -> list[int]:
    out: list[int] = []
    for y in range(size):
        sy = min(height - 1, y * height // size)
        for x in range(size):
            sx = min(width - 1, x * width // size)
            i = (sy * width + sx) * 4
            out.extend(pixels[i : i + 4])
    return out


def main() -> None:
    width, height, _bpp, pixels = read_png(SRC)
    knocked = knockout(pixels)
    cw, ch, cropped = crop_alpha(width, height, knocked, pad=28)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_png(OUT_DIR / "logo.png", cw, ch, cropped)
    write_png(OUT_DIR / "wingman-logo.png", cw, ch, cropped)
    icon = scale_nearest(cw, ch, cropped, 512)
    write_png(OUT_DIR / "logo-icon.png", 512, 512, icon)
    fav = scale_nearest(cw, ch, cropped, 32)
    write_png(Path("/Users/avnee/website/wingman/public/favicon.png"), 32, 32, fav)
    apple = scale_nearest(cw, ch, cropped, 180)
    write_png(Path("/Users/avnee/website/wingman/public/apple-touch-icon.png"), 180, 180, apple)
    print(f"source {width}x{height} → cropped {cw}x{ch}")
    opaque = sum(1 for i in range(3, len(cropped), 4) if cropped[i] > 0)
    print(f"opaque pixels {opaque} / {cw * ch}")


if __name__ == "__main__":
    main()
