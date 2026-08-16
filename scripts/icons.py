#!/usr/bin/env python3
"""Renders every favicon and web app icon from one vector master.

Run: python3 scripts/icons.py            (rewrites public/ in place)

The site's icons were a pale `#b9d98d` mark bleeding to the edges, on nothing.
The app's are a `#567A3D` plate with the mark in white. Two marks, one brand —
and the pale one is the worse of the pair anywhere it lands, because a light
green glyph on a light browser tab is a smudge.

**Full bleed here, unlike the desktop icon.** macOS puts an app icon on a grid
with a fifth of the canvas left empty around it; a favicon is sixteen pixels
and every one of them counts, and an installed web app is masked by the
platform. So the plate fills the canvas and the corner radius is the only thing
that carries the shape.

No dependencies, same as the desktop generator, and the mark path is the same
string. Kept as a copy rather than imported across repositories: these two ship
separately, and a build that reaches into a sibling checkout is a build that
works on one machine.
"""

import math
import os
import struct
import sys
import zlib

CANVAS = 1024

# The plate, and the mark on it. Both are the app's, so the tab and the Dock
# agree.
PLATE_RGB = (0x56, 0x7A, 0x3D)
MARK_RGB = (255, 255, 255)

# A tenth of the canvas. Enough to read as a rounded square at a favicon's size
# without turning into a circle when a platform masks it further.
RADIUS = CANVAS * 0.22

# How much of the plate the mark covers on its taller axis. Larger than the
# desktop's 0.68 because there is no empty margin to share the work.
MARK_FILL = 0.56

MARK = (
    "M523 175.238C523 218.564 487.877 253.688 444.55 253.688H359.763C316.437 253.688 281.313 288.811 "
    "281.313 332.137V425.238C281.313 468.564 316.437 503.688 359.763 503.688H480.656C504.042 503.688 "
    "523 522.645 523 546.031C523 569.417 504.042 588.375 480.656 588.375H78.45C35.123 588.375 0 553.252 "
    "0 509.925V78.45C0 35.123 35.123 0 78.45 0H444.55C487.877 0 523 35.123 523 78.45V175.238Z"
)

SAMPLES = 4  # per axis


def parse_path(d):
    """Flattens an absolute M/L/H/V/C/Z path into closed polygons."""
    import re

    tokens = re.findall(r"[MmLlHhVvCcZz]|-?\d*\.?\d+(?:e-?\d+)?", d)
    contours, current = [], []
    x = y = start_x = start_y = 0.0
    index = 0
    command = None

    def cubic(x0, y0, x1, y1, x2, y2, x3, y3, steps=48):
        for step in range(1, steps + 1):
            t = step / steps
            u = 1 - t
            yield (
                u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
                u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
            )

    while index < len(tokens):
        token = tokens[index]
        if token.isalpha():
            command = token
            index += 1

        if command in "Mm":
            nx, ny = float(tokens[index]), float(tokens[index + 1])
            index += 2
            if command == "m":
                nx, ny = x + nx, y + ny
            if current:
                contours.append(current)
            x, y = nx, ny
            start_x, start_y = x, y
            current = [(x, y)]
            command = "L" if command == "M" else "l"
        elif command in "Ll":
            nx, ny = float(tokens[index]), float(tokens[index + 1])
            index += 2
            if command == "l":
                nx, ny = x + nx, y + ny
            x, y = nx, ny
            current.append((x, y))
        elif command in "Hh":
            nx = float(tokens[index])
            index += 1
            x = x + nx if command == "h" else nx
            current.append((x, y))
        elif command in "Vv":
            ny = float(tokens[index])
            index += 1
            y = y + ny if command == "v" else ny
            current.append((x, y))
        elif command in "Cc":
            values = [float(tokens[index + offset]) for offset in range(6)]
            index += 6
            if command == "c":
                values = [
                    values[0] + x, values[1] + y,
                    values[2] + x, values[3] + y,
                    values[4] + x, values[5] + y,
                ]
            current.extend(cubic(x, y, *values))
            x, y = values[4], values[5]
        elif command in "Zz":
            index += 1
            if current:
                current.append((start_x, start_y))
                contours.append(current)
                current = []
            x, y = start_x, start_y
        else:
            raise ValueError(f"unsupported command {command}")

    if current:
        contours.append(current)
    return contours


def mark_placement(fill=MARK_FILL):
    """Scale and offset that put the mark at `fill` of the canvas, centred."""
    xs, ys = [], []
    for contour in parse_path(MARK):
        for x, y in contour:
            xs.append(x)
            ys.append(y)
    width = max(xs) - min(xs)
    height = max(ys) - min(ys)
    scale = (CANVAS * fill) / max(width, height)
    return scale, (
        (CANVAS - width * scale) / 2 - min(xs) * scale,
        (CANVAS - height * scale) / 2 - min(ys) * scale,
    )


def rounded_rect(left, top, size, radius, steps=64):
    right, bottom = left + size, top + size
    points = []
    corners = [
        (right - radius, bottom - radius, 0),
        (left + radius, bottom - radius, 90),
        (left + radius, top + radius, 180),
        (right - radius, top + radius, 270),
    ]
    for cx, cy, start in corners:
        for step in range(steps + 1):
            angle = math.radians(start + step * 90 / steps)
            points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    points.append(points[0])
    return [points]


def rasterize(contours, width, height, samples=SAMPLES):
    """Nonzero-winding scanline fill, supersampled on both axes."""
    edges = []
    for contour in contours:
        for (x0, y0), (x1, y1) in zip(contour, contour[1:]):
            if y0 != y1:
                edges.append((x0, y0, x1, y1))

    coverage = [[0.0] * width for _ in range(height)]
    for sub in range(height * samples):
        sample_y = (sub + 0.5) / samples
        crossings = []
        for x0, y0, x1, y1 in edges:
            if (y0 <= sample_y < y1) or (y1 <= sample_y < y0):
                t = (sample_y - y0) / (y1 - y0)
                crossings.append((x0 + t * (x1 - x0), 1 if y1 > y0 else -1))
        if not crossings:
            continue
        crossings.sort()

        row = coverage[sub // samples]
        winding = 0
        span_start = 0.0
        for position, direction in crossings:
            if winding == 0:
                span_start = position
            winding += direction
            if winding == 0:
                add_span(row, span_start, position, width, samples)
    return coverage


def add_span(row, x0, x1, width, samples):
    weight = 1.0 / samples
    x0 = max(0.0, min(float(width), x0))
    x1 = max(0.0, min(float(width), x1))
    if x1 <= x0:
        return
    first, last = int(x0), min(int(x1), width - 1)
    if first == last:
        row[first] += (x1 - x0) * weight
        return
    row[first] += (first + 1 - x0) * weight
    for column in range(first + 1, last):
        row[column] += weight
    row[last] += (x1 - last) * weight


def compose(radius=RADIUS):
    """The plate with the mark on it. `radius` 0 gives the bare square."""
    mark_scale, mark_offset = mark_placement()
    pixels = [[(0, 0, 0, 0.0)] * CANVAS for _ in range(CANVAS)]

    layers = [
        (rounded_rect(0, 0, CANVAS, radius) if radius > 0 else square(), PLATE_RGB),
        (
            [
                [
                    (x * mark_scale + mark_offset[0], y * mark_scale + mark_offset[1])
                    for x, y in contour
                ]
                for contour in parse_path(MARK)
            ],
            MARK_RGB,
        ),
    ]

    for contours, colour in layers:
        coverage = rasterize(contours, CANVAS, CANVAS)
        for y in range(CANVAS):
            row, out = coverage[y], pixels[y]
            for x in range(CANVAS):
                alpha = min(1.0, row[x])
                if alpha <= 0:
                    continue
                r, g, b, a = out[x]
                na = alpha + a * (1 - alpha)
                out[x] = (
                    int(round((colour[0] * alpha + r * a * (1 - alpha)) / na)),
                    int(round((colour[1] * alpha + g * a * (1 - alpha)) / na)),
                    int(round((colour[2] * alpha + b * a * (1 - alpha)) / na)),
                    na,
                )
    return pixels


def square():
    return [[(0.0, 0.0), (CANVAS, 0.0), (CANVAS, CANVAS), (0.0, CANVAS), (0.0, 0.0)]]


def resize(pixels, size):
    """Area-average resample, premultiplied so edges stay clean."""
    source = len(pixels)
    scale = source / size
    out = []
    for y in range(size):
        y0, y1 = y * scale, (y + 1) * scale
        row = []
        for x in range(size):
            x0, x1 = x * scale, (x + 1) * scale
            r = g = b = a = weight = 0.0
            for sy in range(int(y0), min(source, int(y1) + 1)):
                cover_y = min(y1, sy + 1) - max(y0, sy)
                if cover_y <= 0:
                    continue
                for sx in range(int(x0), min(source, int(x1) + 1)):
                    cover_x = min(x1, sx + 1) - max(x0, sx)
                    if cover_x <= 0:
                        continue
                    area = cover_x * cover_y
                    pr, pg, pb, pa = pixels[sy][sx]
                    r += pr * pa * area
                    g += pg * pa * area
                    b += pb * pa * area
                    a += pa * area
                    weight += area
            if a > 0:
                row.append((int(round(r / a)), int(round(g / a)), int(round(b / a)), a / weight))
            else:
                row.append((0, 0, 0, 0.0))
        out.append(row)
    return out


def png_bytes(pixels):
    size = len(pixels)
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw += bytes((r, g, b, int(round(max(0.0, min(1.0, a)) * 255))))

    def chunk(kind, payload):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def write_png(path, pixels):
    open(path, "wb").write(png_bytes(pixels))


def write_ico(path, images):
    """PNG-compressed ICO, which every browser since IE11 reads."""
    header = struct.pack("<HHH", 0, 1, len(images))
    entries, blobs = b"", b""
    offset = len(header) + 16 * len(images)
    for size, blob in images:
        entries += struct.pack(
            "<BBBBHHII",
            size if size < 256 else 0, size if size < 256 else 0, 0, 0, 1, 32, len(blob), offset,
        )
        offset += len(blob)
        blobs += blob
    open(path, "wb").write(header + entries + blobs)


def write_svg(path):
    """The one browsers prefer, and the only asset here that is not a raster."""
    scale, (dx, dy) = mark_placement()
    hex_plate = "#%02X%02X%02X" % PLATE_RGB
    hex_mark = "#%02X%02X%02X" % MARK_RGB
    open(path, "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS}" height="{CANVAS}" '
        f'viewBox="0 0 {CANVAS} {CANVAS}">\n'
        f'  <rect width="{CANVAS}" height="{CANVAS}" rx="{RADIUS:.1f}" ry="{RADIUS:.1f}" '
        f'fill="{hex_plate}"/>\n'
        f'  <g transform="translate({dx:.3f} {dy:.3f}) scale({scale:.6f})">\n'
        f'    <path d="{MARK}" fill="{hex_mark}"/>\n'
        f"  </g>\n"
        f"</svg>\n"
    )


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, "public")

    master = compose()
    cache = {CANVAS: master}

    def at(size):
        if size not in cache:
            cache[size] = resize(master, size)
        return cache[size]

    write_svg(os.path.join(public, "favicon.svg"))
    write_png(os.path.join(public, "favicon-16x16.png"), at(16))
    write_png(os.path.join(public, "favicon-32x32.png"), at(32))
    write_ico(
        os.path.join(public, "favicon.ico"),
        [(size, png_bytes(at(size))) for size in (16, 32, 48)],
    )
    write_png(os.path.join(public, "android-chrome-192x192.png"), at(192))
    write_png(os.path.join(public, "android-chrome-512x512.png"), at(512))

    # Square and opaque, because iOS rounds it itself. A pre-rounded icon gets
    # rounded twice and arrives with four grey notches.
    apple = compose(radius=0)
    write_png(os.path.join(public, "apple-touch-icon.png"), resize(apple, 180))

    print(f"wrote {public}")
