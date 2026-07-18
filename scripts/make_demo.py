#!/usr/bin/env python3
"""
Generate a ~2 minute demo video for Cairn.

Renders warm-themed, high-fidelity mockups of the real product screens using
Pillow, with on-screen narration, and encodes them to cairn-demo.mp4 via
imageio-ffmpeg. No screen recording required — fully reproducible.

    pip install pillow imageio imageio-ffmpeg
    python scripts/make_demo.py
"""

import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import imageio.v2 as imageio

# ---------------------------------------------------------------- config
W, H = 1280, 720
FPS = 30
OUT = os.path.join(os.getcwd(), "cairn-demo.mp4")

# Warm palette (matches tailwind.config.ts)
CREAM   = (251, 246, 236)
CREAM50 = (254, 252, 248)
CREAM200= (243, 233, 214)
CREAM300= (233, 217, 188)
BARK    = (42, 33, 24)
BARK100 = (74, 61, 46)
BARK50  = (107, 93, 77)
FOREST  = (20, 80, 59)
FOREST100=(30, 90, 67)
MOSS    = (92, 138, 74)
AMBER   = (226, 148, 38)
AMBER50 = (242, 180, 84)
TERRA   = (201, 104, 63)
CLAY    = (228, 201, 168)

FONTS = r"C:\Windows\Fonts"
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

# Times New Roman family
def reg(s):  return font("times.ttf", s)
def bold(s): return font("timesbd.ttf", s)
def ital(s): return font("timesi.ttf", s)

# ---------------------------------------------------------------- helpers
def lerp(a, b, t):
    return a + (b - a) * t

def ease(t):
    # smoothstep
    return t * t * (3 - 2 * t)

def rounded(draw, box, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def text_center(draw, cx, y, s, fnt, fill):
    w = draw.textlength(s, font=fnt)
    draw.text((cx - w / 2, y), s, font=fnt, fill=fill)
    return w

def wrap(draw, s, fnt, max_w):
    words = s.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=fnt) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

def bg(draw):
    draw.rectangle([0, 0, W, H], fill=CREAM)

def vignette_dot(img, cx, cy, r, color, alpha):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    img.alpha_composite(overlay)

def logo(draw, cx, cy, s=1.0):
    # circle + stacked stones
    r = int(26 * s)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=FOREST)
    def stone(dy, rx, ry, col):
        draw.ellipse([cx - rx, cy + dy - ry, cx + rx, cy + dy + ry], fill=col)
    stone(int(11 * s), int(15 * s), int(6.3 * s), CLAY)
    stone(int(2 * s),  int(12 * s), int(5.3 * s), (218, 130, 90))
    stone(int(-6 * s), int(9 * s),  int(4.4 * s), AMBER50)
    stone(int(-12 * s),int(6.2 * s),int(3.3 * s), (239, 217, 189))

# panel that looks like a browser window
def browser(draw, x, y, w, h, title):
    rounded(draw, [x, y, x + w, y + h], 16, fill=CREAM50, outline=CREAM300, width=2)
    rounded(draw, [x, y, x + w, y + 34], 16, fill=CREAM200)
    draw.rectangle([x, y + 20, x + w, y + 34], fill=CREAM200)
    for i, c in enumerate([TERRA, AMBER, MOSS]):
        draw.ellipse([x + 16 + i * 20, y + 12, x + 28 + i * 20, y + 24], fill=c)
    tw = draw.textlength(title, font=reg(15))
    rounded(draw, [x + 90, y + 8, x + 90 + tw + 28, y + 27], 10, fill=CREAM50)
    draw.text((x + 104, y + 9), title, font=reg(15), fill=BARK50)

# ---------------------------------------------------------------- scene frame base
def new_frame():
    img = Image.new("RGBA", (W, H), CREAM + (255,))
    d = ImageDraw.Draw(img)
    vignette_dot(img, 150, 40, 420, AMBER, 20)
    vignette_dot(img, W - 60, 20, 380, FOREST, 16)
    d = ImageDraw.Draw(img)
    return img, d

def caption(d, lines, y=H - 96):
    # bottom narration band
    band_h = 20 + len(lines) * 30
    rounded(d, [40, y, W - 40, y + band_h], 16, fill=(42, 33, 24))
    for i, ln in enumerate(lines):
        d.text((64, y + 12 + i * 30), ln, font=reg(23), fill=CREAM)

def progress_bar(d, t):
    # thin amber timeline at very top
    d.rectangle([0, 0, int(W * t), 5], fill=AMBER)

# ================================================================ SCENES
# Each scene is a function(frame_index, n_frames) -> PIL image.

def scene_title(i, n):
    img, d = new_frame()
    t = ease(min(1, i / (n * 0.4)))
    cy = int(lerp(-40, 250, t))
    logo(d, W // 2, cy, s=2.4 + 0.2 * math.sin(i / 8))
    if i > n * 0.22:
        a = ease(min(1, (i - n * 0.22) / (n * 0.3)))
        title = "Cairn"
        f = bold(96)
        text_center(d, W // 2, 300, title, f, BARK)
        sub = "your AI learning companion"
        text_center(d, W // 2, 410, sub, ital(38), FOREST)
        line = "Turn anything into a course you'll actually remember."
        text_center(d, W // 2, 470, line, reg(26), BARK100)
        # fade via overlay
        if a < 1:
            ov = Image.new("RGBA", img.size, CREAM + (int(255 * (1 - a)),))
            img.alpha_composite(ov)
    return img

def scene_create(i, n):
    img, d = new_frame()
    browser(d, 90, 70, W - 180, H - 230, "cairn.app/create")
    x, y = 130, 130
    d.text((x, y), "Create a course", font=bold(40), fill=BARK)
    d.text((x, y + 54), "Feed Cairn a source — it builds the rest.", font=reg(24), fill=BARK100)
    # source type chips
    chips = [("Paste text", True), ("A topic", False), ("A link", False), ("Upload", False)]
    cx = x
    for label, active in chips:
        w = d.textlength(label, font=reg(22)) + 46
        col = AMBER if active else CREAM50
        rounded(d, [cx, y + 104, cx + w, y + 150], 12,
                fill=(242, 232, 214) if active else CREAM50, outline=AMBER if active else CREAM300, width=2)
        d.text((cx + 23, y + 114), label, font=reg(22), fill=BARK)
        cx += w + 16
    # textarea with typing animation
    ta = [x, y + 170, W - 130, y + 330]
    rounded(d, ta, 14, fill=CREAM50, outline=CREAM300, width=2)
    sample = ("Spaced repetition is a learning technique that uses increasing "
              "intervals between reviews of material. Each successful recall "
              "strengthens the memory, so the next review can be spaced further out.")
    chars = int(lerp(0, len(sample), ease(min(1, i / (n * 0.7)))))
    lines = wrap(d, sample[:chars], reg(23), ta[2] - ta[0] - 40)
    for j, ln in enumerate(lines[:4]):
        d.text((x + 20, y + 190 + j * 32), ln, font=reg(23), fill=BARK100)
    # cursor
    if int(i / 4) % 2 == 0 and chars < len(sample):
        last = lines[-1] if lines else ""
        lw = d.textlength(last, font=reg(23))
        ny = y + 190 + (len(lines[:4]) - 1) * 32 if lines else y + 190
        d.line([x + 20 + lw + 2, ny, x + 20 + lw + 2, ny + 26], fill=BARK, width=2)
    # build button
    btn = [x, y + 350, x + 300, y + 400]
    rounded(d, btn, 12, fill=AMBER)
    text_center(d, (btn[0] + btn[2]) // 2, y + 361, "Build my course  →", bold(24), BARK)
    caption(d, ["Paste text, drop a link, upload a file, or just name a topic.",
                "Cairn reads your source and gets to work."])
    return img

def scene_generating(i, n):
    img, d = new_frame()
    browser(d, 90, 70, W - 180, H - 230, "cairn.app/create")
    text_center(d, W // 2, 200, "Structuring your course…", bold(40), BARK)
    # spinner
    cx, cy, r = W // 2, 330, 40
    for k in range(12):
        ang = (i / 3 + k) * (math.pi / 6)
        a = int(255 * (k / 12))
        x1 = cx + int((r - 14) * math.cos(ang)); y1 = cy + int((r - 14) * math.sin(ang))
        x2 = cx + int(r * math.cos(ang));        y2 = cy + int(r * math.sin(ang))
        d.line([x1, y1, x2, y2], fill=(226, 148, 38), width=6)
    steps = ["Reading your source", "Designing modules", "Writing lessons", "Adding quizzes & key terms"]
    done = int(lerp(0, len(steps) + 1, ease(min(1, i / (n * 0.9)))))
    sy = 410
    for j, s in enumerate(steps):
        col = FOREST if j < done else BARK50
        mark = "✓" if j < done else "•"
        text_center(d, W // 2, sy + j * 40, f"{mark}  {s}", reg(26), col)
    caption(d, ["Claude structures the material into modules and lessons —",
                "each with objectives, key terms, and time estimates."])
    return img

def scene_lesson(i, n):
    img, d = new_frame()
    browser(d, 60, 60, W - 120, H - 190, "cairn.app/courses/photosynthesis")
    # sidebar outline
    sx, sy = 90, 120
    rounded(d, [sx, sy, sx + 250, H - 160], 14, fill=(245, 238, 224))
    d.text((sx + 16, sy + 14), "MODULE 1 · CAPTURING LIGHT", font=bold(15), fill=BARK50)
    items = [("What plants actually do", True, MOSS),
             ("Light reactions", False, AMBER),
             ("The Calvin cycle", False, CREAM300)]
    for j, (lab, active, dot) in enumerate(items):
        yy = sy + 46 + j * 44
        if active:
            rounded(d, [sx + 8, yy - 6, sx + 242, yy + 30], 10, fill=(242, 232, 214))
        d.ellipse([sx + 18, yy + 6, sx + 30, yy + 18], fill=dot)
        d.text((sx + 40, yy), lab, font=reg(19), fill=BARK if active else BARK100)
    # main content reveals
    mx = sx + 280
    d.text((mx, sy), "Module 1 · Capturing light", font=reg(18), fill=BARK50)
    d.text((mx, sy + 26), "What plants actually do", font=bold(38), fill=BARK)
    d.text((mx, sy + 78), "⏱ 6 min      Familiar", font=reg(18), fill=FOREST)
    body = ("Plants are quiet chemists. Using sunlight, they combine water and "
            "carbon dioxide into glucose and oxygen. The green pigment chlorophyll "
            "captures the light that powers it all.")
    reveal = int(lerp(0, len(body), ease(min(1, i / (n * 0.6)))))
    for j, ln in enumerate(wrap(d, body[:reveal], reg(24), W - mx - 120)):
        d.text((mx, sy + 120 + j * 34), ln, font=reg(24), fill=BARK100)
    # explain-style chips appear
    if i > n * 0.5:
        cy2 = sy + 250
        d.text((mx, cy2), "Explain it to me…", font=bold(24), fill=BARK)
        styles = ["Simple", "In depth", "Analogy", "Visual", "Example"]
        cx = mx
        for k, s in enumerate(styles):
            appear = i > n * 0.5 + k * (n * 0.05)
            if not appear:
                continue
            w = d.textlength(s, font=reg(21)) + 36
            active = k == 0
            rounded(d, [cx, cy2 + 40, cx + w, cy2 + 80], 20,
                    fill=AMBER if active else CREAM50, outline=CREAM300, width=2)
            d.text((cx + 18, cy2 + 48), s, font=reg(21), fill=BARK)
            cx += w + 12
    caption(d, ["Every lesson is structured and readable. Stuck on an idea?",
                "Re-explain it five ways — simple, deep, by analogy, and more."])
    return img

def scene_quiz(i, n):
    img, d = new_frame()
    browser(d, 150, 60, W - 300, H - 190, "cairn.app/courses/…/practice")
    x, y = 200, 120
    d.text((x, y), "Light reactions — Quiz", font=bold(34), fill=BARK)
    q = "1.  Where do the light reactions take place?"
    d.text((x, y + 60), q, font=reg(26), fill=BARK100)
    opts = [("A.  In the stroma", False),
            ("B.  In the thylakoid membranes", True),
            ("C.  In the mitochondria", False),
            ("D.  In the nucleus", False)]
    reveal = i > n * 0.45
    for j, (o, correct) in enumerate(opts):
        yy = y + 110 + j * 62
        box = [x, yy, W - 200, yy + 50]
        if reveal and correct:
            rounded(d, box, 12, fill=(224, 240, 226), outline=MOSS, width=3)
        elif reveal and j == 2:
            rounded(d, box, 12, fill=(247, 233, 227), outline=TERRA, width=2)
        else:
            rounded(d, box, 12, fill=CREAM50, outline=CREAM300, width=2)
        d.text((x + 20, yy + 12), o, font=reg(24), fill=BARK)
        if reveal and correct:
            d.text((W - 240, yy + 12), "✓", font=bold(26), fill=FOREST)
    if reveal:
        ey = y + 110 + 4 * 62 + 6
        rounded(d, [x, ey, W - 200, ey + 60], 12, fill=(245, 238, 224))
        d.text((x + 16, ey + 8), "Why: the thylakoid membranes hold chlorophyll, where",
               font=ital(20), fill=BARK100)
        d.text((x + 16, ey + 32), "light is captured and water is split to release oxygen.",
               font=ital(20), fill=BARK100)
    caption(d, ["Auto-generated quizzes check understanding —",
                "and explain every answer, including why the wrong ones are wrong."])
    return img

def scene_chat(i, n):
    img, d = new_frame()
    browser(d, 200, 60, W - 400, H - 180, "cairn.app/courses/…/chat")
    x, y = 240, 120
    d.text((x, y), "Study chat", font=bold(32), fill=BARK)
    d.text((x, y + 44), "Grounded in your own course material", font=ital(20), fill=BARK50)
    # user bubble
    if i > n * 0.1:
        msg = "What does chlorophyll actually do?"
        w = d.textlength(msg, font=reg(22)) + 40
        bx = W - 240 - w
        rounded(d, [bx, y + 90, W - 240, y + 140], 16, fill=FOREST)
        d.text((bx + 20, y + 102), msg, font=reg(22), fill=CREAM)
    # assistant bubble types in
    if i > n * 0.3:
        ans = ("Chlorophyll is the green pigment in the thylakoid membranes. "
               "It absorbs light — mostly red and blue wavelengths — and uses "
               "that energy to split water, kicking off the whole process.")
        reveal = int(lerp(0, len(ans), ease(min(1, (i - n * 0.3) / (n * 0.55)))))
        lines = wrap(d, ans[:reveal], reg(22), 560)
        bh = 30 + len(lines) * 30
        rounded(d, [x, y + 160, x + 600, y + 160 + bh], 16, fill=CREAM50, outline=CREAM300, width=2)
        for j, ln in enumerate(lines):
            d.text((x + 20, y + 176 + j * 30), ln, font=reg(22), fill=BARK100)
    caption(d, ["Ask anything. A built-in retriever grounds every answer",
                "in your lessons — a tutor that actually read your material."])
    return img

def scene_dashboard(i, n):
    img, d = new_frame()
    browser(d, 60, 60, W - 120, H - 180, "cairn.app/dashboard")
    x, y = 100, 120
    d.text((x, y), "Hello, Demo", font=bold(38), fill=BARK)
    d.text((x, y + 52), "Here's where your learning stands.", font=reg(24), fill=BARK100)
    stats = [("2", "Courses"), ("7", "Lessons"), ("5", "Studied"), ("3", "Mastered")]
    cw = (W - 200) // 4
    for j, (num, lab) in enumerate(stats):
        bx = x + j * cw
        pop = ease(min(1, max(0, (i - j * n * 0.06) / (n * 0.3))))
        rounded(d, [bx, y + 100, bx + cw - 20, y + 210], 16, fill=CREAM50, outline=CREAM300, width=2)
        val = str(int(round(int(num) * pop)))
        d.text((bx + 20, y + 118), ["📚","📖","✍️","🌳"][j], font=reg(28), fill=AMBER)
        d.text((bx + 20, y + 150), val, font=bold(46), fill=FOREST)
        d.text((bx + 22, y + 205 - 0), lab, font=reg(20), fill=BARK50)
    # spaced repetition line
    d.text((x, y + 250), "Spaced repetition keeps it from fading", font=bold(26), fill=BARK)
    # simple forgetting curve vs spaced
    gx, gy, gw, gh = x, y + 290, W - 200, 120
    d.line([gx, gy + gh, gx + gw, gy + gh], fill=CREAM300, width=2)
    d.line([gx, gy, gx, gy + gh], fill=CREAM300, width=2)
    # forgetting curve (dashed, terra)
    pts = []
    for k in range(0, gw, 6):
        yy = gy + gh - int(gh * math.exp(-k / (gw * 0.22)))
        pts.append((gx + k, yy))
    for k in range(0, len(pts) - 1, 2):
        d.line([pts[k], pts[k + 1]], fill=TERRA, width=3)
    # spaced curve (sawtooth up, forest) grows with time
    prog = ease(min(1, i / (n * 0.9)))
    level = 0.0
    last = (gx, gy + gh - 10)
    for k in range(0, int(gw * prog), 4):
        phase = (k % (gw // 4)) / (gw / 4)
        base = min(1.0, 0.3 + k / gw)
        yy = gy + gh - int(gh * (base - 0.15 * math.exp(-phase * 4)))
        cur = (gx + k, yy)
        d.line([last, cur], fill=FOREST, width=3)
        last = cur
    d.text((gx + gw - 210, gy - 4), "— spaced review", font=reg(18), fill=FOREST)
    d.text((gx + gw - 210, gy + 18), "— without review", font=reg(18), fill=TERRA)
    caption(d, ["Cairn tracks mastery and schedules reviews at the right moment —",
                "so knowledge sticks instead of fading away."])
    return img

def scene_deploy(i, n):
    img, d = new_frame()
    text_center(d, W // 2, 90, "One product, two ways to run it", bold(42), BARK)
    # two cards
    cards = [
        ("☁  Cloud", "Vercel + Supabase", ["Postgres + Auth", "Row-level security", "Global edge deploy"], FOREST),
        ("🖥  Local", "Runs on your machine", ["Zero external services", "JSON data store", "Works fully offline"], TERRA),
    ]
    cw, chh = 440, 340
    for j, (title, sub, feats, col) in enumerate(cards):
        cx = W // 2 - cw - 20 + j * (cw + 40)
        pop = ease(min(1, max(0, (i - j * n * 0.12) / (n * 0.4))))
        oy = int(lerp(40, 0, pop))
        top = 170 + oy
        rounded(d, [cx, top, cx + cw, top + chh], 20, fill=CREAM50, outline=CREAM300, width=2)
        rounded(d, [cx, top, cx + cw, top + 70], 20, fill=col)
        d.rectangle([cx, top + 40, cx + cw, top + 70], fill=col)
        d.text((cx + 28, top + 16), title, font=bold(34), fill=CREAM)
        d.text((cx + 28, top + 90), sub, font=ital(26), fill=BARK)
        for k, ft in enumerate(feats):
            d.text((cx + 28, top + 140 + k * 46), f"✓  {ft}", font=reg(25), fill=BARK100)
    if i > n * 0.55:
        text_center(d, W // 2, 540, "The same code. Your choice.", ital(30), FOREST)
    caption(d, ["Deploy to Vercel + Supabase, or run it entirely on your own machine.",
                "Identical features, selected by one environment variable."])
    return img

def scene_outro(i, n):
    img, d = new_frame()
    t = ease(min(1, i / (n * 0.5)))
    logo(d, W // 2, int(lerp(180, 220, t)), s=2.2)
    text_center(d, W // 2, 300, "Cairn", bold(84), BARK)
    text_center(d, W // 2, 400, "Build your path. Stack your knowledge.", ital(34), FOREST)
    text_center(d, W // 2, 470, "AI-powered learning that actually sticks.", reg(26), BARK100)
    text_center(d, W // 2, 560, " July AI Challenge", reg(22), BARK50)
    return img

# ---------------------------------------------------------------- timeline
# (scene_fn, seconds)
TIMELINE = [
    (scene_title,      9),
    (scene_create,     18),
    (scene_generating, 12),
    (scene_lesson,     22),
    (scene_quiz,       16),
    (scene_chat,       17),
    (scene_dashboard,  16),
    (scene_deploy,     15),
    (scene_outro,      8),
]

def main():
    total_s = sum(s for _, s in TIMELINE)
    total_frames = total_s * FPS
    print(f"Rendering {total_s}s @ {FPS}fps = {total_frames} frames -> {OUT}")

    ffmpeg_params = ["-crf", "20", "-preset", "medium"]
    writer = imageio.get_writer(OUT, fps=FPS, codec="libx264",
                                quality=None, macro_block_size=None,
                                ffmpeg_params=ffmpeg_params)

    frame_no = 0
    elapsed = 0
    for fn, secs in TIMELINE:
        n = secs * FPS
        for i in range(n):
            img = fn(i, n)
            d = ImageDraw.Draw(img)
            progress_bar(d, (frame_no) / total_frames)
            writer.append_data(np.asarray(img.convert("RGB")))
            frame_no += 1
        elapsed += secs
        print(f"  [done] {fn.__name__:18s} {elapsed:3d}s / {total_s}s")

    writer.close()
    size = os.path.getsize(OUT) / 1e6
    print(f"Done -> {OUT}  ({size:.1f} MB, {total_s}s)")

if __name__ == "__main__":
    main()
