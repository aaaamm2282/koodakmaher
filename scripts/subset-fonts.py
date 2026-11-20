#!/usr/bin/env python3
"""
One file per font family for the site: Persian and Arabic letters, Persian and Latin digits, the punctuation
Persian text uses («», ZWNJ, dashes) and basic Latin, with only the weights the design uses (400 to 600).
Before, every page loaded two to three files per family (fontsource's arabic and latin subsets, since the
space character lives in the latin one).

Run again only when a font is updated:
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/subset-fonts.py <Vazirmatn[wght].ttf> <NotoNaskhArabic[wght].ttf>
Sources (SIL Open Font License 1.1, no reserved font names; licences in src/assets/fonts/):
    Vazirmatn[wght].ttf          npm package "vazirmatn" 33.0.3, fonts/variable/
    NotoNaskhArabic[wght].ttf    github.com/google/fonts, ofl/notonaskharabic/
A character outside these ranges (an emoji, an accented Latin letter) is drawn by the next font in the stack.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

UNICODES = ','.join([
    'U+0020-007E',  # Basic Latin: space, digits, punctuation, letters
    'U+00A0-00FF',  # Latin-1: no-break space, « », ×, ÷
    'U+0600-06FF',  # Arabic block: all Persian and Arabic letters, Persian digits, ، ؛ ؟ ٪ ٫, harakat
    'U+200C-200F',  # ZWNJ (نیم‌فاصله), ZWJ, LRM, RLM
    'U+2010-2027',  # dashes, quotes, bullet, ellipsis
    'U+2030', 'U+2039-203A', 'U+2066-2069', 'U+2212',
    'U+FDFC',       # Rial sign
])
FONTS = {
    'vazirmatn-fa.woff2': 0,
    'noto-naskh-arabic-fa.woff2': 1,
}

def build(src: str, out: Path) -> None:
    font = TTFont(src)
    font = instancer.instantiateVariableFont(font, {'wght': (400, 600)})  # keep only 400 to 600
    with tempfile.NamedTemporaryFile(suffix='.ttf') as tmp:
        font.save(tmp.name)
        options = subset.Options()
        options.layout_features = ['*']           # every shaping feature: Persian letters join correctly
        options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # keep copyright and licence
        options.flavor = 'woff2'
        options.notdef_outline = True
        f = subset.load_font(tmp.name, options)
        s = subset.Subsetter(options)
        s.populate(unicodes=subset.parse_unicodes(UNICODES))
        s.subset(f)
        subset.save_font(f, str(out), options)
    print(f'{out}: {out.stat().st_size // 1024} KB')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    dest = Path(__file__).resolve().parent.parent / 'src' / 'assets' / 'fonts'
    for name, i in FONTS.items():
        build(sys.argv[1 + i], dest / name)
