# Visual Reference — Animo Studio UI

Claude Code cannot see images. This file describes every UI panel in precise
text so the implementation matches the visual design intent exactly.

---

## Overall Layout (Studio Workspace)

Three-column layout. Full viewport height. No scrolling on the outer shell.

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR (52px, dark #1A1714)                                    │
├──────────────┬──────────────────────────────┬───────────────────┤
│              │                              │                   │
│  LEFT        │   CANVAS AREA               │  RIGHT PANEL      │
│  SIDEBAR     │   (flex:1, dotted bg)        │  (260px, white)   │
│  (280px,     │                              │                   │
│  dark)       │   [Spine character centered] │                   │
│              │                              │                   │
│              ├──────────────────────────────┤                   │
│              │  TIMELINE (80px, white)      │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```

---

## Topbar

- Full-width, 52px height, background #1A1714
- Left: Logo group — orange square icon (28x28, rounded-lg, accent color #E8623A)
  containing a ✦ symbol in white, then "Animo" in Instrument Serif 18px white,
  then a small badge "Studio" in #4A4540 text on #2A2420 background, 10px uppercase
- Center: Three tab buttons — "Character", "Library", "Export"
  Tabs: 6px/14px padding, rounded-md, 13px DM Sans. Inactive: #8A8580 text,
  transparent bg. Active/hover: white text, #2A2420 bg
- Right: Icon button (32px square, #2A2420 bg, rounded-lg) for preview ▶
  Icon button for share ⇧
  Primary CTA button "⬇ Download All" — #E8623A bg, white text, 8px/18px padding,
  rounded-lg, 13px 500 weight. Hover: #d4542f, slight upward translate

---

## Left Sidebar (280px, background #1A1714)

Vertical stack of sections with 16px padding and 16px gap between sections.
Internal scroll if content overflows. Custom scrollbar: 4px wide, #2A2420 thumb.

### Section Labels
All section headings: 10px, 600 weight, 0.1em letter-spacing, uppercase, color #4A4540.
8px margin below.

### Describe Character Section
Card: background #231F1C, border 1px #2A2420, border-radius 10px, padding 12px.
Contains a textarea:
- Transparent background, no border, no outline
- Color #D8D0C8, DM Sans 13px, line-height 1.6
- Min-height 90px, no resize
- Placeholder color #4A4540

Footer bar inside card (separated by top border #2A2420, margin-top 8px):
- Left: character count "73 / 280" in 11px #4A4540
- Right: Generate button — #E8623A bg, white, 12px, rounded-md, with ✦ icon prefix
  Loading state: shows ⟳ spinning, reduced opacity, disabled

### Reference Section
Card showing the active character reference:
- Dark gradient preview area (80px height): linear-gradient(135deg, #1A2840, #2A3850)
  with a 🎭 emoji centered at 32px
- Footer: filename "max_character_v1" in 12px #8A8580, green dot (6px, #4CAF7D) right
- Border: 1px #2A2420, hover: 1px var(--accent)

### Settings Section
Four rows, each: background #231F1C, border 1px #2A2420, border-radius 8px,
padding 8px 10px, margin-bottom 6px, flex between label and value.

Label style: 12px #8A8580 with emoji prefix (🎨 🔧 🎬 🖼)
Value style: 12px #D8D0C8, background #1A1714, padding 3px 10px, border-radius 5px,
border 1px #2A2420, shows "Cartoon ▾" / "Spine2D ▾" / "4 loops ▾" / "2x ▾"

---

## Canvas Area (flex:1)

### Canvas Toolbar (44px, white, border-bottom 1px #E8E4DE)
- Left: Lesson name "Max — Idle Character" in 14px 500 weight #1A1714
  Badge "Spine 4.1 · 4 animations" in 11px #8A8580, background #F0EDE8, rounded
- Right: Zoom control "100% ▾" — same badge style, cursor pointer

### Canvas (flex:1)
Background: #F7F4EF with a dot-grid overlay.
Dot grid: `radial-gradient(circle, #D8D4CE 1px, transparent 1px)` at 24px/24px spacing.

The Spine player sits centered, 400px wide × 500px tall:
- White background
- border-radius 16px
- Box shadow: `0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)`

Character name tag (positioned absolute, bottom 40px, horizontally centered):
- White pill: background white, border 1px #E8E4DE, padding 8px 20px, border-radius 20px
- Contains a 6px green dot (animated pulse) + "Max · Active" in 13px 500 weight
- Box shadow: 0 4px 12px rgba(0,0,0,0.08)

Green dot pulse animation:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}
/* duration: 2s infinite */
```

Loading overlay (shown during generation):
- Absolute inset, background rgba(247,244,239,0.92)
- Centered column: spinner (40px, 3px border, top-color #E8623A, spinning 0.8s)
  + italic text "Generating character…" in 14px #8A8580
- Steps cycle through: "Analyzing prompt…" "Generating sprites…" "Rigging skeleton…"
  "Applying animations…" "Finalizing…"

---

## Timeline (80px, white, border-top 1px #E8E4DE)

### Timeline Header (40px, border-bottom 1px #E8E4DE)
- Play/pause button: 24px square, #1A1714 bg, white text ❚❚ or ▶, rounded-md
- Animation buttons (one per animation): padding 4px 10px, border-radius 5px,
  11px 500 weight. Default: #F0EDE8 bg, 1px #E8E4DE border, #8A8580 text.
  Active: #E8623A bg, white, border same. Hover: border #E8623A, color #E8623A
- Right: current animation label "left_idle · looping" in 11px #8A8580

### Timeline Track
Full-width track bar (24px height):
- Background: linear-gradient(90deg, #E8F4FF, #D0E8FF)
- Border: 1px #B8D8F8, border-radius 4px
- Progress fill: linear-gradient(90deg, #3ABDE8, #5CC8F0), animates width 0→100%

---

## Right Panel (260px, white, border-left 1px #E8E4DE)

Vertical sections with 16px padding each, border-bottom 1px #E8E4DE between.
Custom scrollbar: 4px, #E8E4DE thumb.

### Section Title Style
11px, 600 weight, 0.1em letter-spacing, uppercase, #8A8580. Margin-bottom 12px.

### Character Info Section
Five prop rows (flex between label and value):
- Label: 12px #8A8580
- Value: 12px #1A1714 500 weight, background #F0EDE8, padding 3px 10px,
  border-radius 5px, border 1px #E8E4DE

### Export Format Section
Chip group (flex wrap, 6px gap):
- Default chip: padding 4px 10px, background #F0EDE8, border 1px #E8E4DE,
  border-radius 20px, 11px #8A8580, cursor pointer
- Active chip: background #EDF8FD, border #3ABDE8, color #3ABDE8
- Hover: border #3ABDE8, color #3ABDE8

### Download Section
Primary button "⬇ All Spine Files":
- Full width, background #1A1714, white, border-none, padding 10px 16px,
  border-radius 8px, 13px 500, flex center with gap. Hover: background #E8623A

Secondary buttons (outline style):
- Full width, transparent bg, border 1px #E8E4DE, same padding/radius
- Hover: border #E8623A, color #E8623A

### Playback Section
Speed row: label + value badge showing "1.0×"
Range input: full width, accent-color #E8623A
Loop checkbox: accent-color #E8623A
BG color picker: 40px wide, 24px tall, border 1px #E8E4DE, rounded

---

## Toast Notification

Fixed position, bottom 24px, horizontally centered.
Background #1A1714, white text, padding 12px 24px, border-radius 10px, 13px 500.
Box shadow: 0 8px 24px rgba(0,0,0,0.2).

Entrance animation: translateY(80px → 0) with cubic-bezier(0.34, 1.56, 0.64, 1)
Auto-dismiss after 3 seconds.

---

## Landing Page (/)

Two-column layout, 50/50 split.
Left: Large Instrument Serif headline, subtext in DM Sans, two CTAs.
Right: Animated preview of the studio with the character visible.
Background: #F7F4EF. Accent block: small #E8623A pill badge above headline.

Headline: "Animate your lessons. Teach the world."
Subheadline: "Create 2D animated educational content in minutes.
              Teacher-led. Reviewer-approved. Export-ready."

Primary CTA: "Open Studio →" — #E8623A bg, white, rounded-lg, 16px, padding 14px 28px
Secondary CTA: "Browse Characters" — outline, #1A1714 border, same size

---

## Lessons Dashboard (/lessons)

Grid layout (3 columns, 24px gap).
Each LessonCard:
- White card, border 1px #E8E4DE, border-radius 12px, overflow hidden
- Top: 160px thumbnail area (warm gradient bg + character emoji centered)
- Body (padding 16px): title in 15px 600, subject + grade in 12px #8A8580
- Footer: status badge (color-coded) + duration + quick action icons
Status badge colors:
  draft: #8A8580 bg muted, "Draft"
  review: #FFF3E0 bg / #F57C00 text, "In Review"
  approved: #E8F5E9 bg / #2E7D32 text, "Approved"
  published: #E3F2FD bg / #1565C0 text, "Published"
