#!/usr/bin/env node
"use strict";

// Dr. Unslopovich's static detector. Reads mobile source (SwiftUI, UIKit,
// Jetpack Compose, Android XML, React Native, Expo, Flutter, Ionic) and flags
// patterns that make an app look generated or behave like a website.
// No dependencies, no network, no model. It reads code; it never runs the app.

const fs = require("fs");
const path = require("path");

const VERSION = 1;

const STACK_BY_EXT = {
  ".swift": "swift",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".dart": "dart",
  ".tsx": "js",
  ".jsx": "js",
  ".ts": "js",
  ".js": "js",
  ".mjs": "js",
  ".vue": "web",
  ".svelte": "web",
  ".astro": "web",
  ".html": "web",
  ".xml": "xml",
  ".css": "css",
  ".scss": "css",
};

const SKIP_DIRS = new Set([
  "node_modules", ".git", "Pods", "build", "dist", ".expo", ".dart_tool",
  "DerivedData", ".gradle", ".idea", ".vscode", "coverage", "vendor", ".next",
  "www", ".unslopovich", "Carthage", ".build", "generated", "__generated__",
]);

const TEST_FILE = /(^|[./_-])(test|tests|spec|stories|story|preview|previews|fixture|fixtures|mock|mocks)\.[a-z]+$|Tests?\.(swift|kt)$|_test\.dart$|PreviewParameterProvider\.kt$|Previews?\.(swift|kt)$/i;
const TEST_DIR = /^(?:__tests__|__mocks__|__fixtures__|test|tests|testing|fixtures|mocks|androidTest|testDebug|UITests|e2e)$/;

const SEVERITY_RANK = { critical: 0, noticeable: 1, minor: 2 };

// ---------- helpers ----------

function hexToHsl(hex) {
  const n = parseInt(hex, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

// Six-digit hex colors in a snippet: #RRGGBB, 0xFFRRGGBB, Color(0xRRGGBB).
function hexColors(snippet) {
  const out = [];
  const re = /#([0-9a-fA-F]{6})\b|0x[fF]{2}([0-9a-fA-F]{6})\b/g;
  let m;
  while ((m = re.exec(snippet))) out.push((m[1] || m[2]).toUpperCase());
  return out;
}

// The purple, indigo, violet and hot-pink band that default AI palettes live in.
function isSlopHue(hex) {
  const { h, s, l } = hexToHsl(hex);
  return s >= 0.4 && l >= 0.2 && l <= 0.85 && h >= 235 && h <= 340;
}

function isSaturated(hex) {
  const { s, l } = hexToHsl(hex);
  return s >= 0.35 && l >= 0.15 && l <= 0.9;
}

const SLOP_COLOR_NAME = /(?:\.|Colors\.|Color\.|\b)(purple|deepPurple|indigo|violet|pink|magenta|fuchsia)\b/i;

// Replace comments with spaces, keeping offsets and newlines, so rules never
// match commented-out code. Strings are kept.
function blankComments(text, stack) {
  const out = text.split("");
  const blank = (from, to) => {
    for (let i = from; i < to; i++) if (out[i] !== "\n") out[i] = " ";
  };
  if (stack === "xml" || stack === "web") {
    const re = /<!--[\s\S]*?-->/g;
    let m;
    while ((m = re.exec(text))) blank(m.index, m.index + m[0].length);
    if (stack === "xml") return out.join("");
  }
  let i = 0;
  let quote = null;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (quote) {
      if (c === "\\") { i += 2; continue; }
      if (c === quote || (c === "\n" && quote !== "`")) quote = null;
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      // Skip URLs such as https:// outside quotes.
      if (text[i - 1] === ":") { i++; continue; }
      const end = text.indexOf("\n", i);
      const stop = end === -1 ? text.length : end;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === "/" && stack === "js" && isRegexStart(text, i)) {
      i = skipRegex(text, i);
      continue;
    }
    if (c === '"' || c === "`" || (c === "'" && stack !== "swift")) {
      // An apostrophe between letters is prose (JSX text such as Don't), not a string.
      if (c === "'" && /[A-Za-z]/.test(text[i - 1] || "") && /[A-Za-z]/.test(next || "")) { i++; continue; }
      quote = c;
    }
    i++;
  }
  return out.join("");
}

// A slash starts a regex literal when it follows an operator, an opening
// bracket, a keyword such as return, or the start of the text.
function isRegexStart(text, i) {
  let j = i - 1;
  while (j >= 0 && (text[j] === " " || text[j] === "\t")) j--;
  if (j < 0 || text[j] === "\n") return true;
  // Not after <, > or }: those are JSX closing tags and text such as {a}/{b}.
  if ("(,=:[!&|?{;+-*%~^".includes(text[j])) return true;
  return /\b(?:return|typeof|case|do|else|in|of|void|yield|await)$/.test(text.slice(Math.max(0, j - 6), j + 1));
}

// Index just past a regex literal starting at i (flags included). Stops at
// the end of the line if the literal is not closed.
function skipRegex(text, i) {
  let inClass = false;
  for (let k = i + 1; k < text.length; k++) {
    const c = text[k];
    if (c === "\n") return k;
    if (c === "\\") { k++; continue; }
    if (c === "[") inClass = true;
    else if (c === "]") inClass = false;
    else if (c === "/" && !inClass) {
      k++;
      while (k < text.length && /[a-z]/i.test(text[k])) k++;
      return k;
    }
  }
  return text.length;
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1);
  return starts;
}

function lineAt(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

function* matches(re, text) {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m;
  while ((m = g.exec(text))) {
    yield m;
    if (m[0] === "") g.lastIndex++;
  }
}

// Index just past the bracket that closes the one at `open`.
function closeOf(text, open) {
  const pairs = { "(": ")", "{": "}", "[": "]" };
  const opener = text[open];
  const closer = pairs[opener];
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === opener) depth++;
    else if (text[i] === closer) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return text.length;
}

// ---------- rules ----------
// Each rule gets ctx { code, stack, file } and returns indexes into code.

const rules = [
  {
    id: "slop-gradient",
    family: "looks-generated",
    severity: "noticeable",
    stacks: null,
    message: "Purple, indigo, or pink gradient: the default AI palette.",
    fix: "Use a flat surface from the theme. Keep a gradient only if it comes from the brand (logo, icon) and record that in .unslopovich/decisions.md.",
    find({ code, file }) {
      if (/icon|logo|brand/i.test(path.basename(file))) return [];
      const hits = [];
      for (const m of matches(/(?<!<\/)(?:LinearGradient|linearGradient|RadialGradient|radialGradient|AngularGradient|Brush\.(?:linear|radial|horizontal|vertical|sweep)Gradient|linear-gradient|radial-gradient|GradientDrawable|<gradient\b)/, code)) {
        const lineStart = code.lastIndexOf("\n", m.index) + 1;
        if (/^\s*(?:import|export\s+\{|from)\b/.test(code.slice(lineStart, m.index))) continue;
        const snippet = code.slice(m.index, m.index + 400);
        if (hexColors(snippet).some(isSlopHue) || SLOP_COLOR_NAME.test(snippet.slice(0, 250))) hits.push(m.index);
      }
      // Tailwind: bg-gradient-to-r from-violet-600 to-fuchsia-500
      for (const m of matches(/["'`][^"'`\n]*\bbg-(?:gradient|linear|radial|conic)-[^"'`\n]*["'`]/, code)) {
        if (/\b(?:from|via|to)-(?:purple|violet|indigo|fuchsia|pink)-\d{2,3}\b/.test(m[0])) hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "gradient-text",
    family: "looks-generated",
    severity: "noticeable",
    stacks: null,
    message: "Gradient-filled text.",
    fix: "Emphasize with weight or size from the type scale, in a solid theme color.",
    find({ code }) {
      const re = /<MaskedView|\bShaderMask\s*\(|\.foregroundStyle\(\s*(?:LinearGradient|\.linearGradient)|\.foregroundStyle\([^)]*Gradient|brush\s*=\s*Brush\.\w+Gradient|background-clip:\s*text|-webkit-background-clip:\s*text|\bbg-clip-text\b/;
      return [...matches(re, code)].map((m) => m.index);
    },
  },
  {
    id: "template-theme",
    family: "looks-generated",
    severity: "noticeable",
    stacks: null,
    message: "The project template's default color is still the theme.",
    fix: "Pick the brand's own accent and define semantic roles (background, surface, text, accent, destructive). Ask first if that purple has become the brand.",
    find({ code }) {
      const re = /seedColor:\s*Colors\.deepPurple|0x[fF]{2}(?:6650[aA]4|[dD]0[bB][cC][fF][fF]|6200[eE][eE]|3700[bB]3|[bB][bB]86[fF][cC])\b|#(?:6200[eE][eE]|3700[bB]3|[bB][bB]86[fF][cC])\b/;
      return [...matches(re, code)].map((m) => m.index);
    },
  },
  {
    id: "glow-shadow",
    family: "looks-generated",
    severity: "minor",
    stacks: null,
    message: "Colored glow shadow.",
    fix: "Shadows carry depth, not color: use the platform elevation or a soft neutral shadow, or remove it.",
    find({ code }) {
      const hits = [];
      for (const m of matches(/\.shadow\(\s*color:\s*([^,)]+)|shadowColor\s*[:=]\s*([^,;\n}]+)|(?:ambientColor|spotColor)\s*=\s*([^,)\n]+)|BoxShadow\(\s*color:\s*([^,)\n]+)|box-shadow:\s*([^;\n]+)/, code)) {
        const value = m.slice(1).find(Boolean) || "";
        if (/black|gray|grey|shadow|\.primary\b|label|0x[0-9a-f]{2}000000|#000|rgba?\(\s*0\s*,\s*0\s*,\s*0/i.test(value)) continue;
        const named = /(?:\.|Colors\.|Color\.|\b)(purple|deepPurple|indigo|violet|pink|magenta|fuchsia|blue|cyan|teal|mint|accentColor|accent)\b/i.test(value);
        const hex = hexColors(value).some(isSaturated);
        const rgb = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
        const rgbSat = rgb && Math.max(+rgb[1], +rgb[2], +rgb[3]) - Math.min(+rgb[1], +rgb[2], +rgb[3]) > 60;
        if (named || hex || rgbSat) hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "status-dot",
    family: "looks-generated",
    severity: "minor",
    stacks: null,
    message: "Small colored dot. Decorative dots next to labels are a common generated tell.",
    fix: "Keep it only if it shows a real status the user acts on, with a text label or shape, never color alone. Otherwise delete it.",
    find({ code, stack }) {
      const hits = [];
      const small = (n) => n >= 3 && n <= 12;
      if (stack === "js" || stack === "web") {
        for (const m of matches(/\bwidth:\s*(\d{1,2})\b/, code)) {
          const n = +m[1];
          if (!small(n)) continue;
          const around = code.slice(Math.max(0, m.index - 120), m.index + 160);
          const radius = /borderRadius:\s*(\d+)/.exec(around);
          if (new RegExp(`height:\\s*${n}\\b`).test(around) && radius && +radius[1] >= n / 2) hits.push(m.index);
        }
        for (const m of matches(/["'`][^"'`\n]*\b(?:[wh]|size)-(?:1|1\.5|2|2\.5|3)\b[^"'`\n]*["'`]/, code)) {
          const dim = "(?:1|1\\.5|2|2\\.5|3)\\b";
          const both = new RegExp(`\\bw-${dim}`).test(m[0]) && new RegExp(`\\bh-${dim}`).test(m[0]);
          if (/\brounded-full\b/.test(m[0]) && (both || new RegExp(`\\bsize-${dim}`).test(m[0]))) hits.push(m.index);
        }
      }
      if (stack === "swift") {
        for (const m of matches(/\bCircle\(\)/, code)) {
          const f = /^[\s\S]{0,200}?\.frame\(\s*width:\s*(\d+(?:\.\d+)?)\s*,\s*height:\s*(\d+(?:\.\d+)?)/.exec(code.slice(m.index, m.index + 260));
          if (f && small(+f[1]) && +f[1] === +f[2]) hits.push(m.index);
        }
      }
      if (stack === "kotlin") {
        for (const m of matches(/\.size\(\s*(\d+)\.dp\s*\)/, code)) {
          const around = code.slice(Math.max(0, m.index - 160), m.index + 160);
          if (small(+m[1]) && /CircleShape/.test(around)) hits.push(m.index);
        }
      }
      if (stack === "dart") {
        for (const m of matches(/BoxShape\.circle/, code)) {
          const around = code.slice(Math.max(0, m.index - 220), m.index + 120);
          const w = /width:\s*(\d+(?:\.\d+)?)/.exec(around);
          if (w && small(+w[1])) hits.push(m.index);
        }
      }
      return hits;
    },
  },
  {
    id: "nested-cards",
    family: "looks-generated",
    severity: "noticeable",
    stacks: ["js", "kotlin", "dart", "web"],
    message: "A card inside a card.",
    fix: "Keep one container level. Group inner content with spacing, a divider, or a list section instead.",
    find({ code, stack }) {
      const hits = [];
      if (stack === "js" || stack === "web") {
        for (const m of matches(/<(Card|ion-card)\b[^>]*?(\/?)>/, code)) {
          if (m[2] === "/") continue;
          const tag = m[1];
          const close = code.indexOf(`</${tag}>`, m.index);
          if (close === -1) continue;
          const inner = code.slice(m.index + m[0].length, close);
          if (new RegExp(`<${tag}\\b`).test(inner)) hits.push(m.index);
        }
      } else {
        const card = /\b(?:Elevated|Outlined|Filled)?Card\s*[({]/;
        for (const m of matches(card, code)) {
          const open = m.index + m[0].length - 1;
          let end = closeOf(code, open);
          const lambda = /^\s*\{/.exec(code.slice(end));
          if (code[open] === "(" && lambda) end = closeOf(code, end + lambda[0].length - 1);
          if (card.test(code.slice(open + 1, end - 1))) hits.push(m.index);
        }
      }
      return hits;
    },
  },
  {
    id: "glass-everywhere",
    family: "looks-generated",
    severity: "minor",
    stacks: null,
    message: "Blur and glass used on several surfaces in one file.",
    fix: "Keep system materials behind bars and sheets. Make content surfaces opaque.",
    find({ code }) {
      const all = [...matches(/\.(?:ultraThin|thin|regular|thick|ultraThick)Material\b|<BlurView\b|backdrop-filter|BackdropFilter\(|ImageFilter\.blur|\.glassEffect\(/, code)];
      return all.length >= 3 ? [all[0].index] : [];
    },
  },
  {
    id: "sparkle-icon",
    family: "looks-generated",
    severity: "minor",
    stacks: null,
    message: "Sparkle icon. It usually marks an AI feature or stands in for meaning.",
    fix: "Use an icon that names the action, or a text label. If it marks an AI feature, make sure that feature is not in the way of the core task.",
    find({ code }) {
      const re = /["']sparkles?["']|["']wand\.and\.stars|\bauto_awesome\b|\bAutoAwesome\b|\bSparkles\b|\bSparklesIcon\b|✨/;
      return [...matches(re, code)].map((m) => m.index);
    },
  },
  {
    id: "emoji-icon",
    family: "looks-generated",
    severity: "minor",
    stacks: ["swift", "kotlin", "dart", "js", "web", "xml"],
    message: "Emoji in interface text, often standing in for an icon.",
    fix: "Use the platform icon set (SF Symbols, Material Symbols) with an accessibility label, or drop it.",
    find({ code }) {
      // Only emoji sitting beside a word, as in "🚀 Fast" or "Video 📺". Emoji
      // pickers, reactions and user content are left alone.
      const re = /(?<!\p{L})(\p{Emoji_Presentation}|\p{Extended_Pictographic}️)[  ]?\p{L}{2,}|\p{L}{2,}[  ]?(\p{Emoji_Presentation}|\p{Extended_Pictographic}️)/u;
      const hits = [];
      for (const m of matches(re, code)) {
        if ((m[1] || m[2]) === "✨") continue; // reported by sparkle-icon
        const lineStart = code.lastIndexOf("\n", m.index) + 1;
        if (/\b(?:console|logger|log)\.\w+\(|new Response\(|throw new/.test(code.slice(lineStart, m.index))) continue;
        hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "unvirtualized-list",
    family: "performance",
    severity: "noticeable",
    stacks: ["js", "swift", "kotlin", "dart"],
    message: "A list built by mapping items inside a plain scroll container. Every row renders up front.",
    fix: "Use the virtualized list: FlatList or FlashList, List or LazyVStack, LazyColumn, ListView.builder. Then profile scrolling on a real device.",
    find({ code, stack }) {
      const hits = [];
      if (stack === "js") {
        for (const m of matches(/(?<![\w.])<(?:Animated\.)?ScrollView\b/, code)) {
          const end = code.slice(m.index).search(/<\/(?:Animated\.)?ScrollView>/);
          if (end === -1) continue;
          const body = code.slice(m.index, m.index + end);
          // Horizontal scrollers are usually short chip rows and carousels.
          const props = body.slice(0, body.indexOf(">") + 1);
          if (/\bhorizontal\b(?!\s*=\s*\{\s*false\s*\})/.test(props)) continue;
          if (/\.map\(/.test(body)) hits.push(m.index);
        }
      }
      if (stack === "swift") {
        for (const m of matches(/\bScrollView\b[^{\n]*\{\s*VStack\b/, code)) {
          const open = code.indexOf("{", m.index);
          if (/\bForEach\b/.test(code.slice(open, closeOf(code, open)))) hits.push(m.index);
        }
      }
      if (stack === "kotlin") {
        for (const m of matches(/\bColumn\s*\(/, code)) {
          const head = code.slice(m.index, closeOf(code, m.index + m[0].length - 1));
          if (!/verticalScroll/.test(head)) continue;
          const bodyOpen = code.indexOf("{", m.index + head.length);
          if (bodyOpen === -1 || bodyOpen - (m.index + head.length) > 5) continue;
          if (/\.forEach\b|\bfor\s*\(/.test(code.slice(bodyOpen, closeOf(code, bodyOpen)))) hits.push(m.index);
        }
      }
      if (stack === "dart") {
        for (const m of matches(/\bSingleChildScrollView\s*\(|\bListView\s*\(/, code)) {
          const open = m.index + m[0].length - 1;
          const body = code.slice(open, closeOf(code, open));
          if (/children:/.test(body) && /\.map\(|\bfor\s*\(/.test(body)) hits.push(m.index);
        }
      }
      return hits;
    },
  },
  {
    id: "fixed-text-size",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["swift", "js", "dart", "xml"],
    message: "Text that ignores the user's text size setting.",
    fix: "Use platform text styles (.body, MaterialTheme.typography, textTheme) or scale custom sizes (relativeTo:, UIFontMetrics, sp). Then check the screen at the largest size.",
    find({ code, stack }) {
      if (stack === "swift") {
        const hits = [...matches(/\.system\(\s*size:|\.custom\(\s*"[^"]*"\s*,\s*size:\s*[\d.]+\s*\)/, code)].map((m) => m.index);
        if (!/UIFontMetrics|adjustsFontForContentSizeCategory/.test(code)) {
          for (const m of matches(/UIFont\.(?:systemFont|boldSystemFont)\(\s*ofSize:|UIFont\(\s*name:/, code)) hits.push(m.index);
        }
        return hits;
      }
      const re = {
        js: /allowFontScaling\s*[=:]\s*\{?\s*false|maxFontSizeMultiplier\s*[=:]\s*\{?\s*1(?:\.0+)?(?![\d.])/,
        dart: /textScaleFactor:\s*1(?:\.0+)?(?![\d.])|TextScaler\.noScaling|textScaler:\s*(?:const\s+)?TextScaler\.linear\(\s*1(?:\.0)?\s*\)/,
        xml: /android:textSize="\d+(?:\.\d+)?(?:dp|px|dip)"/,
      }[stack];
      return [...matches(re, code)].map((m) => m.index);
    },
  },
  {
    id: "back-gesture",
    family: "native-fit",
    severity: "noticeable",
    stacks: ["swift", "js", "kotlin", "dart", "xml"],
    message: "System back gesture disabled, hidden, or handled the deprecated way.",
    fix: "Keep edge-swipe back on iOS and predictive back on Android. Guard only real data loss (PopScope, OnBackPressedCallback, usePreventRemove) and say why.",
    find({ code, stack }) {
      const re = {
        swift: /interactivePopGestureRecognizer\??\.isEnabled\s*=\s*false|\.navigationBarBackButtonHidden\(\s*(?:true)?\s*\)/,
        js: /gestureEnabled\s*[:=]\s*\{?\s*false|fullScreenGestureEnabled\s*[:=]\s*\{?\s*false/,
        kotlin: /override\s+fun\s+onBackPressed\s*\(/,
        dart: /\bWillPopScope\s*\(/,
        xml: /android:enableOnBackInvokedCallback="false"/,
      }[stack];
      return [...matches(re, code)].map((m) => m.index);
    },
  },
  {
    id: "drawer-nav",
    family: "native-fit",
    severity: "noticeable",
    stacks: null,
    platforms: ["mobile", "universal"],
    message: "Hamburger menu or navigation drawer. It hides the top destinations behind a tap.",
    fix: "Ask first. Use tabs for three to five peer destinations; keep a drawer only for many destinations or a large-screen rail.",
    find({ code }) {
      const re = /["']line\.3\.horizontal["']|\bIcons\.(?:Default\.|Filled\.|Outlined\.|Rounded\.|Sharp\.)?Menu\b|\bIcons\.menu\b|name=["']menu(?:-outline)?["']|\bcreateDrawerNavigator\b|from\s+["']expo-router\/drawer["']|\bModalNavigationDrawer\b|\bdrawer:\s*(?:const\s+)?\w*Drawer\b|<ion-menu\b/;
      const first = matches(re, code).next();
      return first.done ? [] : [first.value.index];
    },
  },
  {
    id: "hover-only",
    family: "native-fit",
    severity: "minor",
    stacks: ["js", "web", "css"],
    platforms: ["mobile"],
    message: "Hover behavior in a touch app. Nobody hovers on a phone.",
    fix: "Make the information or control visible without hover, or guard it with @media (hover: hover) for pointer devices only.",
    find({ code }) {
      if (/hover:\s*hover/.test(code)) return [];
      return [...matches(/\bonHoverIn\b|\bonMouseEnter\b|\bonMouseOver\b|:hover\b/, code)].map((m) => m.index);
    },
  },
  {
    id: "keyboard-cover",
    family: "interaction",
    severity: "minor",
    stacks: ["js"],
    message: "Screen with a text input and no keyboard handling. The keyboard may cover the field.",
    fix: "Use KeyboardAvoidingView, automaticallyAdjustKeyboardInsets, or the project's keyboard library, and set keyboardShouldPersistTaps on the scroll view. Check it on a small phone.",
    find({ code }) {
      const input = /<TextInput\b/.exec(code);
      if (!input) return [];
      if (!/<(?:ScrollView|FlatList|FlashList|SafeAreaView|KeyboardAwareScrollView)\b/.test(code)) return [];
      if (/KeyboardAvoidingView|KeyboardAware|KeyboardProvider|KeyboardStickyView|KeyboardController|automaticallyAdjustKeyboardInsets|keyboardShouldPersistTaps/.test(code)) return [];
      return [input.index];
    },
  },
  {
    id: "safe-area-off",
    family: "native-fit",
    severity: "minor",
    stacks: ["swift"],
    message: "Safe area ignored. Content may sit under the notch or home indicator.",
    fix: "Ignore the safe area for backgrounds only, e.g. .background(Color.surface.ignoresSafeArea()).",
    find({ code }) {
      const hits = [];
      for (const m of matches(/\.ignoresSafeArea\(\s*\)|\.edgesIgnoringSafeArea\(\s*\.all\s*\)/, code)) {
        const lineStart = code.lastIndexOf("\n", m.index) + 1;
        if (/background|Color\(|Color\.|Image\(|Gradient|Rectangle\(\)|Divider\(\)/.test(code.slice(lineStart, m.index))) continue;
        hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "tracked-caps-label",
    family: "looks-generated",
    severity: "minor",
    stacks: ["js", "web", "css", "swift"],
    message: "Small label in tracked capitals, the eyebrow above every section.",
    fix: "Use sentence case in the body face, one step smaller, without letter spacing. Or delete the label and let the heading carry the section.",
    find({ code, stack }) {
      const hits = [];
      for (const m of matches(/["'`][^"'`\n]*\buppercase\b[^"'`\n]*["'`]/, code)) {
        if (/\btracking-(?:wide|wider|widest|\[\d)/.test(m[0])) hits.push(m.index);
      }
      if (stack === "js") {
        for (const m of matches(/textTransform:\s*["']uppercase["']/, code)) {
          const around = code.slice(Math.max(0, m.index - 160), m.index + 160);
          const ls = /letterSpacing:\s*(\d+(?:\.\d+)?)/.exec(around);
          if (ls && +ls[1] >= 0.8) hits.push(m.index);
        }
      }
      if (stack === "css" || stack === "web") {
        for (const m of matches(/text-transform:\s*uppercase/, code)) {
          const open = code.lastIndexOf("{", m.index);
          const close = code.indexOf("}", m.index);
          const block = code.slice(open, close === -1 ? undefined : close);
          if (/letter-spacing:\s*(?:0?\.(?:0[5-9]|[1-9])\d*em|[1-9][\d.]*px)/.test(block)) hits.push(m.index);
        }
      }
      if (stack === "swift") {
        for (const m of matches(/\.textCase\(\s*\.uppercase\s*\)/, code)) {
          const around = code.slice(Math.max(0, m.index - 160), m.index + 160);
          if (/\.(?:tracking|kerning)\(\s*[1-9]/.test(around)) hits.push(m.index);
        }
      }
      return hits;
    },
  },
  {
    id: "icon-tile",
    family: "looks-generated",
    severity: "minor",
    stacks: ["js", "web"],
    message: "Icon in a tinted rounded square, the generated default for every row and feature card.",
    fix: "Put the icon inline in the text color, or drop it. Keep a tile only where the shape carries meaning, like an app icon.",
    find({ code }) {
      const hits = [];
      for (const m of matches(/["'`][^"'`\n]{0,300}["'`]/, code)) {
        const c = m[0];
        if (!/\brounded-(?:md|lg|xl|2xl|3xl|full)\b/.test(c)) continue;
        if (!/\bbg-(?:[a-z]+-(?:50|100)|[a-z]+(?:-\d{3})?\/(?:5|10|15|20)|primary\/\d+|accent)\b/.test(c)) continue;
        if (!/\b(?:size|h|w)-(?:8|9|10|11|12|14)\b/.test(c)) continue;
        if (!/\b(?:items-center|place-items-center|justify-center)\b/.test(c)) continue;
        hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "transition-all",
    family: "motion",
    severity: "minor",
    stacks: ["js", "web", "css"],
    message: "Transition on every property (first use in this file).",
    fix: "Name the properties: transition-colors, or transition-[transform,opacity]. Never animate width, height, top, or left.",
    find({ code }) {
      // Reported once per file: it is usually a habit, not a one-off.
      const first = matches(/\btransition-all\b|transition(?:-property)?:\s*all\b/, code).next();
      return first.done ? [] : [first.value.index];
    },
  },
  {
    id: "hover-scale",
    family: "motion",
    severity: "minor",
    stacks: ["js", "web", "css"],
    message: "Cards that grow on hover.",
    fix: "Show hover with a quick color or surface change. Keep scale for a small press-down on buttons.",
    find({ code }) {
      return [...matches(/\b(?:group-)?hover:(?:-translate-y-\d|scale-1(?:0[2-9]|[1-9]\d))\b|:hover\s*\{[^}]*transform:\s*scale\(1\.(?:0[2-9]|[1-9])/, code)].map((m) => m.index);
    },
  },
  {
    id: "decorative-pulse",
    family: "motion",
    severity: "minor",
    stacks: ["js", "web"],
    message: "Pulsing or pinging element that is not a loading skeleton.",
    fix: "Animate only what is live or loading. Remove looping motion from badges, dots, and buttons.",
    find({ code }) {
      const hits = [];
      for (const m of matches(/["'`][^"'`\n]*\banimate-(?:pulse|ping)\b[^"'`\n]*["'`]/, code)) {
        if (/\banimate-pulse\b/.test(m[0]) && /\bbg-(?:gray|slate|zinc|neutral|stone|muted)\b|skeleton/i.test(m[0])) continue;
        hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "unverified-claim",
    family: "truthfulness",
    severity: "noticeable",
    stacks: null,
    message: "Social proof or speed claim that the page does not back up.",
    fix: "Use a real, sourced number with what it compares to, or remove it. Never ship invented customer counts, logo walls, or testimonials.",
    find({ code }) {
      const re = /\b(?:trusted|loved|used) by (?:over |more than )?[\d,.]+\s*[kKM]?\+?\s*(?:teams|companies|developers|users|customers|people|businesses)|\bjoin (?:over |more than )?[\d,.]+\s*[kKM]?\+?\s+(?:teams|companies|developers|users|customers|people|others|creators)|\b\d+x (?:faster|better|more productive|cheaper)\b/i;
      return [...matches(re, code)].map((m) => m.index);
    },
  },
  {
    id: "clickable-div",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["js", "web"],
    message: "Click handler on a div or span. Keyboard and screen reader users cannot reach it.",
    fix: "Use a <button> for actions and an <a href> for navigation. They come with focus, Enter and Space, and the right role.",
    find({ code }) {
      const hits = [];
      for (const m of matches(/<(?:div|span|li|td|img)\b[^<>]*?\s(?:onClick|@click|v-on:click|on:click)\s*=/, code)) {
        const tagEnd = code.indexOf(">", m.index + m[0].length);
        const tag = code.slice(m.index, tagEnd === -1 ? undefined : tagEnd);
        if (/\brole\s*=|\btab[iI]ndex\s*=/.test(tag)) continue;
        hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "focus-removed",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["js", "web", "css"],
    message: "Focus outline removed with nothing in its place.",
    fix: "Keep a visible :focus-visible style in the palette: a 2px outline or ring with an offset.",
    find({ code, stack }) {
      const hits = [];
      for (const m of matches(/["'`][^"'`\n]*\b(?:focus:)?outline-none\b[^"'`\n]*["'`]/, code)) {
        // Focus styles often sit in another string of the same cn(...) call.
        const around = code.slice(Math.max(0, m.index - 400), m.index + m[0].length + 400);
        if (/\b(?:focus|focus-visible|focus-within|group-focus-visible|peer-focus-visible):|data-\[(?:highlighted|selected|focus|focused)|aria-selected:|data-\[state=/.test(around)) continue;
        hits.push(m.index);
      }
      if ((stack === "css" || stack === "web") && !/focus-visible/.test(code)) {
        for (const m of matches(/outline:\s*(?:none|0)\b/, code)) hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "img-no-alt",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["js", "web"],
    message: "Image without alt text.",
    fix: "Describe what the image shows, or use alt=\"\" for pure decoration.",
    find({ code }) {
      const hits = [];
      for (const m of matches(/<img(?=[\s/>])/, code)) {
        const end = code.indexOf(">", m.index);
        const tag = code.slice(m.index, end === -1 ? undefined : end);
        if (!/[\s:]alt\s*=|\{\s*\.\.\./.test(tag)) hits.push(m.index);
      }
      return hits;
    },
  },
  {
    id: "zoom-disabled",
    family: "accessibility",
    severity: "noticeable",
    stacks: ["js", "web"],
    message: "Pinch zoom disabled in the viewport settings.",
    fix: "Remove maximum-scale and user-scalable from the viewport. If inputs zoom on focus in iOS, give them a 16px font size instead.",
    find({ code }) {
      return [...matches(/user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*1(?:\.0+)?(?![\d.])|userScalable:\s*false|maximumScale:\s*1(?:\.0+)?(?![\d.])/, code)].map((m) => m.index);
    },
  },
  {
    id: "oops-error",
    family: "copy",
    severity: "noticeable",
    stacks: null,
    message: "\"Oops\" or \"Something went wrong\": no cause, no next step.",
    fix: "Say what failed in the product's words and what the user can do: retry, check the connection, contact support.",
    find({ code }) {
      return [...matches(/\boops\b|something went wrong/i, code)].map((m) => m.index);
    },
  },
  {
    id: "buzzword-copy",
    family: "copy",
    severity: "minor",
    stacks: null,
    message: "Marketing filler in the interface.",
    fix: "Say what the screen does in plain words, or delete the line.",
    find({ code }) {
      const re = /unlock (?:your|the) (?:full )?potential|\bseamless(?:ly)?\b|\beffortless(?:ly)?\b|\bsupercharg\w*|all in one place|\bnext[- ]level\b|\belevate your\b|\bgame[- ]?changer\b|\brevolutioni[sz]\w*|\bunleash\b|\bempower(?:s|ing)? you/i;
      return [...matches(re, code)].map((m) => m.index);
    },
  },
  {
    id: "welcome-back",
    family: "copy",
    severity: "minor",
    stacks: null,
    message: "\"Welcome back!\" spending prime screen space on a greeting.",
    fix: "Use that space for what a returning user came to do.",
    find({ code }) {
      return [...matches(/welcome back\s*(?:,[^"'<\n]*)?!/i, code)].map((m) => m.index);
    },
  },
  {
    id: "vague-button",
    family: "copy",
    severity: "minor",
    stacks: null,
    message: "Button label that does not say what happens.",
    fix: "Use a verb and an object: \"Save address\", \"Send invoice\", \"Book table\".",
    find({ code }) {
      return [...matches(/(?:title|label|text)\s*[=:]\s*\{?\s*["'](?:Submit|Click here|Tap here)["']|>\s*(?:Submit|Click here|Tap here)\s*</i, code)].map((m) => m.index);
    },
  },
  {
    id: "invented-stat",
    family: "truthfulness",
    severity: "minor",
    stacks: ["swift", "kotlin", "dart", "js", "web"],
    message: "Hard-coded statistic in the interface.",
    fix: "Compute it from real data, or mark it as placeholder content. Stat tiles with invented numbers mislead users.",
    find({ code }) {
      // A number with %, k, M or + shown as text: JSX text, Text("..."), or a
      // value/stat field in a data literal. Widths and other style values are not text.
      const stat = String.raw`[+↑↓]?\d{1,3}(?:[.,]\d{1,3})*\s*(?:%|[kKM]\+?|\+)`;
      const re = new RegExp(
        String.raw`>\s*${stat}\s*<|\bText\(\s*(?:text\s*=\s*)?["']${stat}["']|\b(?:value|stat|metric|count|total|number|figure)\s*:\s*["']${stat}["']`,
        "g",
      );
      return [...matches(re, code)].map((m) => m.index);
    },
  },
];

// ---------- scanning ----------

function loadConfig(root) {
  // The nearest project config above the scan target wins; the current
  // directory's config is the last fallback.
  const candidates = [];
  for (let dir = path.resolve(root); ; dir = path.dirname(dir)) {
    candidates.push(path.join(dir, ".unslopovich", "config.json"));
    if (path.dirname(dir) === dir) break;
  }
  candidates.push(path.join(process.cwd(), ".unslopovich", "config.json"));
  for (const file of candidates) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      return { ignoreRules: raw.ignoreRules || [], ignorePaths: raw.ignorePaths || [] };
    } catch {
      // No config, or unreadable: use defaults.
    }
  }
  return { ignoreRules: [], ignorePaths: [] };
}

// What the nearest package.json says the code ships to: "mobile", "universal"
// (mobile and web), "web", or "unknown". Some rules only apply to one of them.
const kindCache = new Map();
function projectKind(dir) {
  if (kindCache.has(dir)) return kindCache.get(dir);
  let kind = "unknown";
  let pkg = null;
  try {
    pkg = fs.readFileSync(path.join(dir, "package.json"), "utf8");
  } catch {
    // No package.json here.
  }
  if (pkg !== null) {
    const deps = (() => {
      try {
        const j = JSON.parse(pkg);
        return Object.keys({ ...j.dependencies, ...j.devDependencies, ...j.peerDependencies });
      } catch {
        return [];
      }
    })();
    const has = (re) => deps.some((d) => re.test(d));
    const mobile = has(/^(?:react-native|expo|@capacitor\/|@ionic\/|nativescript|@nativescript\/)/);
    const universal = has(/^(?:react-native-web|@expo\/metro-runtime)$/);
    const web = has(/^(?:react-dom|next|vue|nuxt|svelte|@sveltejs\/kit|astro|@angular\/core|solid-js|@remix-run\/|vite|preact|gatsby)$/);
    kind = mobile ? (universal ? "universal" : "mobile") : web ? "web" : "unknown";
  }
  // A package.json that names no platform (a tooling or workspace package)
  // says nothing, so keep looking upward.
  if (kind === "unknown" && path.dirname(dir) !== dir) kind = projectKind(path.dirname(dir));
  kindCache.set(dir, kind);
  return kind;
}

function walk(target, opts, out = []) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    throw new Error(`Cannot read ${target}`);
  }
  if (stat.isFile()) {
    if (STACK_BY_EXT[path.extname(target).toLowerCase()]) out.push(target);
    return out;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      if (!opts.includeTests && TEST_DIR.test(entry.name)) continue;
      walk(full, opts, out);
    } else if (entry.isFile()) {
      if (!STACK_BY_EXT[path.extname(entry.name).toLowerCase()]) continue;
      if (!opts.includeTests && TEST_FILE.test(entry.name)) continue;
      if (/\.(?:min|d)\.(?:js|ts)$/.test(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

// A trailing comment silences its own line; a comment on a line of its own
// silences the next line.
function ignoredByComment(lines, line, ruleId) {
  const previous = lines[line - 2];
  const own = previous && /^\s*(?:\/\/|\/\*|\*|<!--|#)/.test(previous) ? previous : null;
  for (const l of [lines[line - 1], own]) {
    if (!l) continue;
    const m = /unslopovich-ignore(?:\s+([\w-]+(?:\s*,\s*[\w-]+)*))?/.exec(l);
    if (m && (!m[1] || m[1].split(/\s*,\s*/).includes(ruleId))) return true;
  }
  return false;
}

function scanSource(text, file, options = {}) {
  const stack = options.stack || STACK_BY_EXT[path.extname(file).toLowerCase()];
  if (!stack) return [];
  if (stack === "xml" && !/<(?:LinearLayout|ConstraintLayout|TextView|FrameLayout|RelativeLayout|manifest|application|shape|gradient|resources|androidx\.)/.test(text)) return [];
  const code = blankComments(text, stack);
  const starts = lineStarts(text);
  const lines = text.split("\n");
  const ignoreRules = new Set(options.ignoreRules || []);
  const kind = options.kind || "unknown";
  const findings = [];
  for (const rule of rules) {
    if (ignoreRules.has(rule.id)) continue;
    if (rule.stacks && !rule.stacks.includes(stack)) continue;
    if (rule.platforms && kind !== "unknown" && !rule.platforms.includes(kind)) continue;
    const seen = new Set();
    for (const index of rule.find({ code, stack, file })) {
      const line = lineAt(starts, index);
      if (seen.has(line) || ignoredByComment(lines, line, rule.id)) continue;
      seen.add(line);
      findings.push({
        rule: rule.id,
        family: rule.family,
        severity: rule.severity,
        file,
        line,
        snippet: lines[line - 1].trim().slice(0, 120),
        message: rule.message,
        fix: rule.fix,
      });
    }
  }
  return findings;
}

function scan(targets, opts = {}) {
  const findings = [];
  const unreadable = [];
  let filesScanned = 0;
  for (const target of targets) {
    const root = path.resolve(target);
    const config = loadConfig(fs.statSync(root).isDirectory() ? root : path.dirname(root));
    const ignoreRules = [...config.ignoreRules, ...(opts.ignoreRules || [])];
    for (const file of walk(root, opts)) {
      const rel = path.relative(process.cwd(), file) || file;
      if (config.ignorePaths.some((p) => rel.split(path.sep).join("/").includes(p))) continue;
      let text;
      try {
        text = fs.readFileSync(file, "utf8");
      } catch {
        unreadable.push(rel);
        continue;
      }
      if (text.length > 1_000_000) continue;
      filesScanned++;
      const kind = opts.platform || projectKind(path.dirname(file));
      findings.push(...scanSource(text, rel, { ignoreRules, kind }));
    }
  }
  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
  return { version: VERSION, filesScanned, unreadable, findings };
}

// ---------- output ----------

function formatText(result) {
  const { findings, filesScanned } = result;
  const out = [];
  if (findings.length === 0) {
    out.push(`Dr. Unslopovich found nothing in ${filesScanned} files. Suspicious, but fine.`);
  } else {
    const count = (s) => findings.filter((f) => f.severity === s).length;
    const files = new Set(findings.map((f) => f.file)).size;
    const parts = ["critical", "noticeable", "minor"].filter((s) => count(s)).map((s) => `${count(s)} ${s}`);
    out.push(`${findings.length} findings in ${files} of ${filesScanned} files (${parts.join(", ")})`);
    let current = null;
    for (const f of findings.slice().sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
      if (f.file !== current) {
        current = f.file;
        out.push("", f.file);
      }
      out.push(`  ${String(f.line).padStart(4)}  ${f.severity.padEnd(10)}  ${f.rule.padEnd(18)}  ${f.message}`);
    }
    out.push("", "Fixes: npx unslopovich detect --list-rules");
  }
  out.push("Static checks only. Nothing was run, profiled, or tapped. A clean scan is not a clean bill of health.");
  return out.join("\n");
}

function listRules() {
  return rules
    .map((r) => `${r.id.padEnd(18)}  ${r.severity.padEnd(10)}  ${r.family.padEnd(15)}  ${r.message}\n${" ".repeat(20)}Fix: ${r.fix}`)
    .join("\n");
}

const USAGE = `Usage: unslopovich detect [paths...] [--json] [--platform mobile|web] [--ignore rule,rule] [--include-tests] [--list-rules]

Scans mobile and web source for generated-looking UI, website-in-a-phone patterns,
and accessibility and motion defaults. The platform comes from the nearest
package.json; --platform overrides it.
Exit code: 0 clean, 2 findings, 1 error.
Silence one line with a comment: unslopovich-ignore <rule-id>
Project config: .unslopovich/config.json  { "ignoreRules": [], "ignorePaths": [] }`;

function main(argv) {
  const args = argv.slice();
  if (args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    return 0;
  }
  if (args.includes("--list-rules")) {
    console.log(listRules());
    return 0;
  }
  const json = args.includes("--json");
  const includeTests = args.includes("--include-tests");
  let platform = null;
  const ignoreRules = [];
  const targets = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--platform") {
      platform = args[++i];
      if (!["mobile", "web", "universal"].includes(platform)) {
        console.error(USAGE);
        return 1;
      }
    } else if (a === "--ignore") {
      if (!args[i + 1]) {
        console.error(USAGE);
        return 1;
      }
      ignoreRules.push(...args[++i].split(","));
    } else if (!a.startsWith("--")) targets.push(a);
    else if (!["--json", "--include-tests"].includes(a)) {
      console.error(`Unknown option ${a}\n\n${USAGE}`);
      return 1;
    }
  }
  const known = new Set(rules.map((r) => r.id));
  const unknown = ignoreRules.filter((r) => !known.has(r));
  if (unknown.length) {
    console.error(`Unknown rule: ${unknown.join(", ")}. See --list-rules.`);
    return 1;
  }
  let result;
  try {
    result = scan(targets.length ? targets : ["."], { includeTests, ignoreRules, platform });
  } catch (err) {
    console.error(err.message);
    return 1;
  }
  console.log(json ? JSON.stringify(result, null, 2) : formatText(result));
  if (result.unreadable.length) {
    console.error(`Could not read ${result.unreadable.length} file(s): ${result.unreadable.join(", ")}. The scan is incomplete.`);
    return 1;
  }
  return result.findings.length ? 2 : 0;
}

module.exports = { rules, scan, scanSource, blankComments, isSlopHue, main };

if (require.main === module) process.exitCode = main(process.argv.slice(2));
