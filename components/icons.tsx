import React from "react";

/**
 * Cairn icon set — inline SVG glyphs drawn with `currentColor`, so they inherit
 * the warm palette (forest / amber / terracotta) from surrounding text.
 *
 * These replace the colorful emoji that used to decorate the UI. Every glyph is
 * a single stroked path on a 24x24 canvas with rounded joins, matching the
 * book-like, restrained aesthetic of the rest of the product.
 *
 * Use the <Icon name="..." /> dispatcher, or the typed IconName keys below.
 */

export type IconName =
  | "rock"
  | "note"
  | "bulb"
  | "link"
  | "file"
  | "books"
  | "book-open"
  | "pen"
  | "tree"
  | "wave"
  | "plus"
  | "leaf"
  | "home"
  | "gear"
  | "chat"
  | "target"
  | "repeat"
  | "mirror"
  | "seed"
  | "image"
  | "pencil"
  | "clock"
  | "refresh"
  | "check"
  | "close"
  | "arrow-right"
  | "arrow-left"
  | "menu"
  | "sun"
  | "moon"
  | "trash"
  | "key"
  | "users";

const PATHS: Record<IconName, React.ReactNode> = {
  // A small cairn — stacked trail stones.
  rock: (
    <>
      <rect x="6" y="16" width="12" height="4" rx="2" />
      <rect x="8.5" y="11.5" width="7" height="4" rx="2" />
      <rect x="10.5" y="7" width="3" height="4" rx="1.5" />
    </>
  ),
  // Memo / note
  note: (
    <>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M8.5 12h7M8.5 15.5h5" />
    </>
  ),
  // Idea
  bulb: (
    <>
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />
      <path d="M9.5 18h5M10.5 21h3" />
    </>
  ),
  // Link
  link: (
    <>
      <path d="M10 14l4-4" />
      <path d="M9 11l-1.5-1.5a3.5 3.5 0 0 1 5-5L14 6" />
      <path d="M15 13l1.5 1.5a3.5 3.5 0 0 1-5 5L10 18" />
    </>
  ),
  // Document
  file: (
    <>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
    </>
  ),
  // Stacked books
  books: (
    <>
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2z" />
      <path d="M5 4v16" />
      <path d="M9 4v16" />
    </>
  ),
  // Open book
  "book-open": (
    <>
      <path d="M12 6c-2-1.4-4-1.9-6-1.9V19c2 0 4 .5 6 1.9 2-1.4 4-1.9 6-1.9V4.1c-2 0-4 .5-6 1.9z" />
      <path d="M12 6v14" />
    </>
  ),
  // Pen (writing)
  pen: (
    <>
      <path d="M4 20l4-1L17 10l-3-3L5 16l-1 4z" />
      <path d="M14 7l3 3" />
    </>
  ),
  // Tree (mastered)
  tree: (
    <>
      <path d="M12 21v-6" />
      <circle cx="12" cy="9" r="5" />
      <path d="M9.5 12.5l-2 2.5M14.5 12.5l2 2.5" />
    </>
  ),
  // Waving hand
  wave: (
    <>
      <path d="M8 13V6.5a1.3 1.3 0 0 1 2.6 0V12" />
      <path d="M10.6 12V5.5a1.3 1.3 0 0 1 2.6 0V12" />
      <path d="M13.2 12V6.5a1.3 1.3 0 0 1 2.6 0V14c0 3-2 5-5 5h-1.5c-2 0-3-1-4-2.5L6 14a1.3 1.3 0 0 1 2.2-1.3L9 14" />
      <path d="M4.5 7.5C3.5 8.2 3.5 9.2 3.5 10.2M4.5 4.8C3 5.8 3 7 3 8.4" />
    </>
  ),
  // Plus
  plus: <path d="M12 5v14M5 12h14" />,
  // Leaf
  leaf: (
    <>
      <path d="M5 19c0-7 5-12 14-12 0 9-5 14-14 12z" />
      <path d="M5 19c4-4 7-6 11-7" />
    </>
  ),
  // Home
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  // Gear
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </>
  ),
  // Chat bubble
  chat: (
    <>
      <path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  // Target
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  // Repeat / loop
  repeat: (
    <>
      <path d="M4 9a8 8 0 0 1 14-3l2 2" />
      <path d="M20 4v4h-4" />
      <path d="M20 15a8 8 0 0 1-14 3l-2-2" />
      <path d="M4 20v-4h4" />
    </>
  ),
  // Hand mirror (visual)
  mirror: (
    <>
      <circle cx="10" cy="9" r="5" />
      <path d="M13.2 12.2L19 18" />
      <path d="M8 7c1 1.3 1 2.6 0 3.6" />
    </>
  ),
  // Sprout (simple)
  seed: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13C12 9.5 9.5 7.5 5.5 7.5c0 4 2.5 6 6.5 5.5z" />
      <path d="M12 11.5C12 8.5 14.5 6.5 18.5 6.5c0 4-2.5 6-6.5 5.5z" />
    </>
  ),
  // Picture frame
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M5 17l4.5-4.5L13 16l3-3 3 3" />
    </>
  ),
  // Pencil
  pencil: (
    <>
      <path d="M4 20l3-1L19 7l-3-3L4 16l-1 4z" />
      <path d="M14 6l3 3" />
    </>
  ),
  // Clock
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  // Refresh (single arrow)
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2 5.4" />
      <path d="M20 5v6h-6" />
    </>
  ),
  // Check
  check: <path d="M5 12l5 5 9-11" />,
  // Close
  close: <path d="M6 6l12 12M18 6L6 18" />,
  // Arrow right (chevron)
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  // Arrow left (chevron)
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  // Menu (hamburger)
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  // Sun
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  // Moon
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" />,
  // Trash / delete
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  // Key
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l8 8" />
      <path d="M16 16l2-2M19 19l2-2" />
    </>
  ),
  // Users (friends)
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M16 5.4a3 3 0 0 1 0 5.8" />
      <path d="M17.5 15c2.6.5 4 2.1 4 5" />
    </>
  ),
};

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  /** Pixel size for width/height. Override with Tailwind h-/w- classes. */
  size?: number;
}

export function Icon({ name, size = 20, className = "", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`icon ${className}`}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

export default Icon;
