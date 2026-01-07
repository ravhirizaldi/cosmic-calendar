/**
 * Rigorous Cosmic Calendar Math Specification
 *
 * Definitions:
 * - Universe age Tu = 13_799_000_000 years.
 * - Length of a tropical year Ty = 365.242190 days = 31_556_925.216 seconds.
 * - The Cosmic Calendar compresses the entire age of the universe into exactly one tropical year.
 */

// 1) Fundamental constants
export const Tu = 13_799_000_000 // Universe age in years
export const Ty_days = 365.24219
export const Ty_seconds = Ty_days * 24 * 60 * 60 // 31,556,925.216

// 2) Scale Factors (for references)
// 1 cosmic second = X real years?
// "years_per_cosmic_second = Tu / Ty"
export const YEARS_PER_COSMIC_SECOND = Tu / Ty_seconds
// "seconds_per_cosmic_year = Ty / Tu" (unused usually but good to have)

// Scale factors for UI reference
export const COSMIC_SCALE = {
  day: YEARS_PER_COSMIC_SECOND * 86400,
  hour: YEARS_PER_COSMIC_SECOND * 3600,
  minute: YEARS_PER_COSMIC_SECOND * 60,
  second: YEARS_PER_COSMIC_SECOND
}

// 4) Calendar Constraints (Fractional Months)
// Sum must equal Ty_days
export const MONTH_DAYS = [
  31.0, 28.24219, 31.0, 30.0, 31.0, 30.0, 31.0, 31.0, 30.0, 31.0, 30.0, 31.0
]

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

// Helpers for cumulative days
// Precompute start day of each month
const MONTH_STARTS: number[] = [0]
let accum = 0
for (let i = 0; i < 11; i++) {
  accum += MONTH_DAYS[i]
  MONTH_STARTS.push(accum)
}

/**
 * Converts a normalized slider position [0, 1] to "Years Since Big Bang".
 */
export function getCosmicYears(x: number): number {
  return x * Tu
}

/**
 * Converts normalized slider position [0, 1] to Calendar Date components.
 * Returns { month, day, hour, minute, second }
 */
export function getCalendarDateComponents(xInput: number) {
  // Clamp to prevent overflow into "Next Year" (Month 12)
  // If x is exactly 1, we want "Dec 31 23:59:59.999..."
  const x = Math.min(xInput, 0.999999999999999)

  // 2) Slider mapping -> cosmic_seconds
  const cosmic_seconds = x * Ty_seconds

  // 5) Cosmic seconds -> calendar
  // total_days = cosmic_seconds / 86400
  const total_days = cosmic_seconds / 86400

  // Find month m
  // We need smallest m such that sum(month_days[0..m]) > total_days
  // Actually, simpler: iterate and subtract days
  let m = 0
  let days_remaining = total_days

  while (m < 11 && days_remaining >= MONTH_DAYS[m]) {
    days_remaining -= MONTH_DAYS[m]
    m++
  }

  // Now m is the month index (0-11)
  // day_of_month = floor(days_remaining) + 1
  const day = Math.floor(days_remaining) + 1

  // Fraction of the day for time
  const day_fraction = days_remaining - Math.floor(days_remaining)

  // hour
  const hour_val = day_fraction * 24
  const hour = Math.floor(hour_val)

  // minute
  const minute_val = (hour_val - hour) * 60
  const minute = Math.floor(minute_val)

  // second
  const second_val = (minute_val - minute) * 60
  const second = second_val // Keep fractional for smooth display? Or floor? Spec says "second s ∈ [0..59.999...]"
  // But usually we display floor. Let's return float, UI can format.

  return { m, day, hour, minute, second }
}

/**
 * Inverse: Calendar Date -> Normalized Progress [0, 1]
 *
 * @param m Month index 0-11
 * @param d Day 1-based
 * @param h Hour 0-23
 * @param min Minute 0-59
 * @param s Second 0-59.999
 */
export function getDateProgress(m: number, d: number, h: number, min: number, s: number): number {
  // Steps from spec 4)
  // days_before_month = sum(month_days[0..m-1]) -> We have MONTH_STARTS[m]
  const days_before_month = MONTH_STARTS[m]

  // total_days = days_before_month + (d - 1)
  // Note: d is 1-based, so d=1 represents start of month.
  // Wait, if d=1, time 00:00:00, then total_days should be exactly days_before_month.
  // Yes: days_before_month + (1 - 1) = days_before_month. Correct.
  const total_days = days_before_month + (d - 1)

  const cosmic_seconds = total_days * 86400 + h * 3600 + min * 60 + s

  // Normalize to [0, 1]
  const x = cosmic_seconds / Ty_seconds

  // Clamp for safety (though math should be exact)
  return Math.max(0, Math.min(1, x))
}

/**
 * Helper to calculate progress from "Years Since Big Bang"
 * "years_since_big_bang = x * Tu" -> x = years / Tu
 * But usually we handle "Events from real age Y years ago"
 */
export function getProgressFromYearsAgo(yearsAgo: number): number {
  // 6) Event placement from real age
  // years_since_big_bang = Tu - Y
  const years_since_big_bang = Tu - yearsAgo
  const slider = years_since_big_bang / Tu
  return Math.max(0, Math.min(1, slider))
}

// Events
// Recalculating with new math
export interface CosmicEvent {
  id: string
  title: string
  description?: string
  icon?: string
  timestampLine: string // The display string "Month Day HH:MM:SS"
  progress: number
}

// Helper to easy create
function createEvent(
  title: string,
  m: number,
  d: number,
  h: number,
  min: number,
  s: number,
  id: string,
  description?: string,
  icon?: string
): CosmicEvent {
  const p = getDateProgress(m, d, h, min, s)
  // Format timestamp manually since we have the inputs
  const monthName = MONTH_NAMES[m]
  // Pad function
  const pad = (n: number) => Math.floor(n).toString().padStart(2, '0')
  const secFixed = s.toFixed(3).padStart(6, '0')

  return {
    id,
    title,
    description,
    icon,
    timestampLine: `${monthName} ${pad(d)} ${pad(h)}:${pad(min)}:${secFixed}`,
    progress: p
  }
}

// "Now" is exactly the end
const nowProgress = 1.0

export const KEY_EVENTS: CosmicEvent[] = [
  createEvent(
    'Big Bang',
    0,
    1,
    0,
    0,
    0,
    'big-bang',
    'The moment of rapid inflation where space, time, and energy burst into existence.',
    'Sparkles'
  ),
  createEvent(
    'First Galaxies',
    0,
    15,
    0,
    0,
    0,
    'galaxies',
    'Gravity pulls gas clouds together to form the first island universes of stars.',
    'Orbit'
  ),
  createEvent(
    'Sun & Solar System',
    8,
    1,
    0,
    0,
    0,
    'sun',
    'Our star is born from the debris of dead generations of earlier stars.',
    'Sun'
  ),
  createEvent(
    'Earth Forms',
    8,
    2,
    0,
    0,
    0,
    'earth',
    'Dust and rocks accrete to form our home planet, initially a molten hellscape.',
    'Globe'
  ),
  createEvent(
    'First Life',
    8,
    15,
    0,
    0,
    0,
    'life',
    'Single-celled microbes begin the long chain of evolution in the primal oceans.',
    'Dna'
  ),
  createEvent(
    'Dinosaurs Appear',
    11,
    13,
    0,
    0,
    0,
    'dinos-start',
    'Great reptiles evolve to dominate the land ecosystem.',
    'Footprints' // approximate icon
  ),
  createEvent(
    'Dinosaurs Extinct',
    11,
    26,
    0,
    0,
    0,
    'dinos-end',
    'An asteroid impact ends the reign of the dinosaurs, opening the door for mammals.',
    'Skull'
  ),

  // Homo Sapiens: Dec 31 23:58:00
  createEvent(
    'Homo Sapiens',
    11,
    31,
    23,
    58,
    0,
    'humans',
    'Anatomically modern humans emerge in Africa.',
    'User'
  ),

  // Agriculture: Dec 31 23:59:38
  createEvent(
    'Agriculture',
    11,
    31,
    23,
    59,
    38,
    'agri',
    'Humans learn to cultivate crops and tame animals, settling into communities.',
    'Sprout'
  ),

  // Written History: Dec 31 23:59:48
  createEvent(
    'Written History',
    11,
    31,
    23,
    59,
    48,
    'writing',
    'The recording of human knowledge begins with Sumerian cuneiform and others.',
    'Scroll'
  ),

  {
    id: 'now',
    title: 'Now',
    description: 'The present moment. Everything we know exists here.',
    timestampLine: 'Dec 31 23:59:59',
    progress: nowProgress,
    icon: 'Clock'
  }
]

export interface CosmicEra {
  name: string
  startProgress: number
  endProgress: number
  color: string // CSS color or hex
  description: string
}

// Defining Eras based on Key Events
// 1. Primordial: Big Bang (0) -> First Galaxies (Jan 15)
// 2. Stellar: First Galaxies -> Sun (Aug 31 approx - wait, Sun is Aug 30? let's check)
//    Sun (Aug 31) is ~0.66
// 3. Planetary: Sun -> First Life (Sep 21)
// 4. Biotic: First Life -> Now (Dec 31)

// Let's get exact progress from events if we can, or just hardcode based on dates
// Jan 15 is ~14/365 = 0.038
// Sun (Aug something)
// Life (Sep something)

export const COSMIC_ERAS: CosmicEra[] = [
  {
    name: 'Primordial Era',
    startProgress: 0,
    endProgress: 0.04, // ~Jan 15
    color: '#ef4444', // red-500
    description: 'The early universe: Inflation, cooling, and the Dark Ages.'
  },
  {
    name: 'Stellar Era',
    startProgress: 0.04,
    endProgress: 0.66, // ~Aug 31 (Sun)
    color: '#8b5cf6', // violet-500
    description: 'Structure formation: Galaxies and stars light up the cosmos.'
  },
  {
    name: 'Planetary Era',
    startProgress: 0.66,
    endProgress: 0.72, // ~Sep 21 (First Life)
    color: '#06b6d4', // cyan-500
    description: 'The Solar System forms and Earth cools.'
  },
  {
    name: 'Biotic Era',
    startProgress: 0.72,
    endProgress: 1.0,
    color: '#10b981', // emerald-500
    description: 'Life emerges and evolves into complex forms.'
  }
]

export function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(3)} Billion`
  if (num >= 1e6) return `${(num / 1e6).toFixed(3)} Million`
  if (num >= 1e3) return `${(num / 1e3).toLocaleString()}`
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
