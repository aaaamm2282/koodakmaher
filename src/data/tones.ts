/**
 * Which paper colour belongs to which unit (design, not content: it stays in code).
 * The colours follow the path from 3 to 18 in the home hero: saffron for the kindergarten years (3 to 6),
 * vermilion for primary (6 to 12), turquoise for middle school (12 to 15), and a dashed outline for high school,
 * which opens later. The two schools beside the path take the logo's navy and the cypress green.
 * Text on each colour keeps at least 4.5:1 (ink on saffron and turquoise, white on the others).
 */
export type Tone = 'saffron' | 'red' | 'teal' | 'navy' | 'green' | 'soon';

export const unitTone: Record<string, Tone> = {
  kindergarten: 'saffron',
  primary: 'red',
  'middle-school': 'teal',
  'high-school': 'soon',
  language: 'navy',
  vocational: 'green',
};

/** The drawing of each unit in src/assets/art (unit-<slug>.svg) */
export const unitArt = (slug: string) => `unit-${slug}`;
