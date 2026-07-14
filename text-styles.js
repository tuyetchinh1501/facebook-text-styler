const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const NATURAL_MODE = "natural";

function mapString(source, target) {
  const targetChars = Array.from(target);
  return Object.fromEntries(Array.from(source).map((char, index) => [char, targetChars[index]]));
}

function rangeMap(source, startCodePoint) {
  return Object.fromEntries(
    Array.from(source).map((char, index) => [char, String.fromCodePoint(startCodePoint + index)])
  );
}

function mergeMaps(...maps) {
  return Object.assign({}, ...maps);
}

function transformWithMap(text, map, options = {}) {
  if (options.mode === NATURAL_MODE) {
    return transformNaturalWithMap(text, map);
  }

  return transformAccentWithMap(text, map);
}

function transformAccentWithMap(text, map) {
  return segmentGraphemes(text)
    .map((segment) => transformSegmentWithMap(segment, map))
    .join("");
}

function transformNaturalWithMap(text, map) {
  const output = tokenizeText(text)
    .map((token) => {
      if (token.type === "word" && hasVietnameseMarks(token.value)) {
        return token.value;
      }

      return segmentGraphemes(token.value)
        .map((segment) => (map[segment] ? map[segment] : segment))
        .join("");
    })
    .join("");

  if (output === text && hasVietnameseMarks(text)) {
    return transformAccentWithMap(text, map);
  }

  return output;
}

function tokenizeText(text) {
  const tokens = [];
  let current = "";
  let currentType = null;

  for (const segment of segmentGraphemes(text)) {
    const type = isWordSegment(segment) ? "word" : "other";

    if (currentType && type !== currentType) {
      tokens.push({ type: currentType, value: current });
      current = "";
    }

    currentType = type;
    current += segment;
  }

  if (current) {
    tokens.push({ type: currentType, value: current });
  }

  return tokens;
}

function isWordSegment(segment) {
  try {
    return /[\p{L}\p{N}_#@]/u.test(segment);
  } catch {
    return /[A-Za-z0-9_#@]/.test(segment);
  }
}

function hasVietnameseMarks(text) {
  return /[đĐ]/.test(text) || /[\u0300-\u036f]/.test(text.normalize("NFD"));
}

function transformSegmentWithMap(segment, map) {
  if (map[segment]) {
    return map[segment];
  }

  const normalized = normalizeBaseAndMarks(segment);
  if (!normalized) {
    return segment;
  }

  const mappedBase = map[normalized.base];
  if (!mappedBase) {
    return segment;
  }

  return `${mappedBase}${normalized.marks}`;
}

function normalizeBaseAndMarks(segment) {
  const strokedD = normalizeVietnameseStrokedD(segment);
  if (strokedD) {
    return strokedD;
  }

  const chars = Array.from(segment.normalize("NFD"));
  if (!chars.length || !isBasicLatinLetter(chars[0])) {
    return null;
  }

  const marks = chars.slice(1).join("");
  return marks && isOnlyCombiningMarks(marks)
    ? { base: chars[0], marks }
    : null;
}

function normalizeVietnameseStrokedD(segment) {
  if (segment === "đ") {
    return { base: "d", marks: "\u0335" };
  }

  if (segment === "Đ") {
    return { base: "D", marks: "\u0335" };
  }

  return null;
}

function isBasicLatinLetter(char) {
  return /^[A-Za-z]$/.test(char);
}

function isOnlyCombiningMarks(text) {
  return /^[\u0300-\u036f]+$/.test(text);
}

function addCombiningMark(text, mark) {
  return segmentGraphemes(text)
    .map((segment) => (isDecoratable(segment) ? `${segment}${mark}` : segment))
    .join("");
}

function isDecoratable(segment) {
  try {
    return /[\p{L}\p{N}]/u.test(segment);
  } catch {
    return /[A-Za-z0-9]/.test(segment);
  }
}

export function segmentGraphemes(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("vi", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }

  return Array.from(text);
}

const boldSerif = mergeMaps(
  rangeMap(UPPER, 0x1d400),
  rangeMap(LOWER, 0x1d41a),
  rangeMap(DIGITS, 0x1d7ce)
);

const boldSans = mergeMaps(
  rangeMap(UPPER, 0x1d5d4),
  rangeMap(LOWER, 0x1d5ee),
  rangeMap(DIGITS, 0x1d7ec)
);

const italicSerif = mergeMaps(
  mapString(UPPER, "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍"),
  mapString(LOWER, "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧")
);

const italicSans = mergeMaps(
  rangeMap(UPPER, 0x1d608),
  rangeMap(LOWER, 0x1d622)
);

const boldItalicSerif = mergeMaps(
  rangeMap(UPPER, 0x1d468),
  rangeMap(LOWER, 0x1d482)
);

const boldItalicSans = mergeMaps(
  rangeMap(UPPER, 0x1d63c),
  rangeMap(LOWER, 0x1d656)
);

const bubble = mergeMaps(
  rangeMap(UPPER, 0x24b6),
  rangeMap(LOWER, 0x24d0),
  mapString(DIGITS, "⓪①②③④⑤⑥⑦⑧⑨")
);

const blackBubbleUpper = mapString(UPPER, "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩");
const blackBubble = mergeMaps(blackBubbleUpper, mapLowerToUpper(blackBubbleUpper));

const gothic = mergeMaps(
  mapString(UPPER, "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ"),
  mapString(LOWER, "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷")
);

const gothicBold = mergeMaps(
  rangeMap(UPPER, 0x1d56c),
  rangeMap(LOWER, 0x1d586)
);

const doubleStruck = mergeMaps(
  mapString(UPPER, "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ"),
  mapString(LOWER, "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫"),
  rangeMap(DIGITS, 0x1d7d8)
);

const monospace = mergeMaps(
  rangeMap(UPPER, 0x1d670),
  rangeMap(LOWER, 0x1d68a),
  rangeMap(DIGITS, 0x1d7f6)
);

const upsideDown = {
  a: "ɐ",
  b: "q",
  c: "ɔ",
  d: "p",
  e: "ǝ",
  f: "ɟ",
  g: "ƃ",
  h: "ɥ",
  i: "ᴉ",
  j: "ɾ",
  k: "ʞ",
  l: "ʃ",
  m: "ɯ",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "ɹ",
  s: "s",
  t: "ʇ",
  u: "n",
  v: "ʌ",
  w: "ʍ",
  x: "x",
  y: "ʎ",
  z: "z",
  A: "∀",
  B: "𐐒",
  C: "Ɔ",
  D: "◖",
  E: "Ǝ",
  F: "Ⅎ",
  G: "⅁",
  H: "H",
  I: "I",
  J: "ſ",
  K: "⋊",
  L: "˥",
  M: "W",
  N: "N",
  O: "O",
  P: "Ԁ",
  Q: "Ό",
  R: "ᴚ",
  S: "S",
  T: "⊥",
  U: "∩",
  V: "Λ",
  W: "M",
  X: "X",
  Y: "⅄",
  Z: "Z",
  "0": "0",
  "1": "Ɩ",
  "2": "ᄅ",
  "3": "Ɛ",
  "4": "ㄣ",
  "5": "ϛ",
  "6": "9",
  "7": "ㄥ",
  "8": "8",
  "9": "6",
  ".": "˙",
  ",": "'",
  "'": ",",
  "\"": "„",
  "?": "¿",
  "!": "¡",
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
  "&": "⅋",
  "_": "‾"
};

function mapLowerToUpper(upperMap) {
  return Object.fromEntries(Array.from(LOWER).map((char, index) => [char, upperMap[UPPER[index]]]));
}

function transformUpsideDown(text, options = {}) {
  if (options.mode === NATURAL_MODE) {
    return tokenizeText(text)
      .map((token) => {
        if (token.type === "word" && hasVietnameseMarks(token.value)) {
          return token.value;
        }

        return segmentGraphemes(token.value)
          .reverse()
          .map((segment) => upsideDown[segment] ?? segment)
          .join("");
      })
      .join("");
  }

  return segmentGraphemes(text)
    .reverse()
    .map((segment) => upsideDown[segment] ?? segment)
    .join("");
}

export const textStyles = [
  {
    id: "bold-serif",
    name: "Bold Serif",
    transform: (text, options) => transformWithMap(text, boldSerif, options)
  },
  {
    id: "bold-sans",
    name: "Bold Sans",
    transform: (text, options) => transformWithMap(text, boldSans, options)
  },
  {
    id: "italic-serif",
    name: "Italic Serif",
    transform: (text, options) => transformWithMap(text, italicSerif, options)
  },
  {
    id: "italic-sans",
    name: "Italic Sans",
    transform: (text, options) => transformWithMap(text, italicSans, options)
  },
  {
    id: "bold-italic-serif",
    name: "Bold Italic Serif",
    transform: (text, options) => transformWithMap(text, boldItalicSerif, options)
  },
  {
    id: "bold-italic-sans",
    name: "Bold Italic Sans",
    transform: (text, options) => transformWithMap(text, boldItalicSans, options)
  },
  {
    id: "bubble",
    name: "Bubble",
    transform: (text, options) => transformWithMap(text, bubble, options)
  },
  {
    id: "black-bubble",
    name: "Black Bubble",
    transform: (text, options) => transformWithMap(text, blackBubble, options)
  },
  {
    id: "gothic",
    name: "Gothic",
    transform: (text, options) => transformWithMap(text, gothic, options)
  },
  {
    id: "gothic-bold",
    name: "Gothic Bold",
    transform: (text, options) => transformWithMap(text, gothicBold, options)
  },
  {
    id: "double-struck",
    name: "Double Struck",
    transform: (text, options) => transformWithMap(text, doubleStruck, options)
  },
  {
    id: "monospace",
    name: "Monospace",
    transform: (text, options) => transformWithMap(text, monospace, options)
  },
  {
    id: "upside-down",
    name: "Upside Down",
    transform: (text, options) => transformUpsideDown(text, options)
  },
  {
    id: "strike",
    name: "Strikethrough",
    transform: (text) => addCombiningMark(text, "\u0336")
  },
  {
    id: "underline",
    name: "Underline",
    transform: (text) => addCombiningMark(text, "\u0332")
  },
  {
    id: "double-underline",
    name: "Double Underline",
    transform: (text) => addCombiningMark(text, "\u0333")
  }
];
