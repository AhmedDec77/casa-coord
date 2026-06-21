// Jours fériés légaux en Bavière (Munich — commune à majorité catholique,
// donc Mariä Himmelfahrt inclus). Les fêtes mobiles sont dérivées de la
// date de Pâques (algorithme de Gauss/Meeus), donc valable any année,
// pas seulement 2026.

// Calcule la date de Pâques (dimanche) pour une année donnée.
function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Retourne un Set des dates ISO (YYYY-MM-DD) fériées en Bavière pour l'année donnée.
function bavarianHolidaysForYear(year) {
  const easter = easterSunday(year)
  const dates = [
    new Date(year, 0, 1),       // Neujahr
    new Date(year, 0, 6),       // Heilige Drei Könige
    addDays(easter, -2),        // Karfreitag
    addDays(easter, 1),         // Ostermontag
    new Date(year, 4, 1),       // Tag der Arbeit
    addDays(easter, 39),        // Christi Himmelfahrt
    addDays(easter, 50),        // Pfingstmontag
    addDays(easter, 60),        // Fronleichnam
    new Date(year, 7, 15),      // Mariä Himmelfahrt (communes catholiques, dont Munich)
    new Date(year, 9, 3),       // Tag der Deutschen Einheit
    new Date(year, 10, 1),      // Allerheiligen
    new Date(year, 11, 25),     // 1. Weihnachtstag
    new Date(year, 11, 26),     // 2. Weihnachtstag
  ]
  return new Set(dates.map(isoDate))
}

// Cache par année pour éviter de recalculer à chaque appel.
const holidayCache = {}
function getHolidaySet(year) {
  if (!holidayCache[year]) {
    holidayCache[year] = bavarianHolidaysForYear(year)
  }
  return holidayCache[year]
}

export function isBavarianHoliday(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return getHolidaySet(d.getFullYear()).has(isoDate(d))
}

// Un jour est "ouvré" si : pas dimanche, pas férié, et (samedi seulement
// si includeSaturday est vrai).
export function isWorkingDay(date, includeSaturday) {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDay() // 0 = dimanche, 6 = samedi
  if (day === 0) return false
  if (day === 6 && !includeSaturday) return false
  if (isBavarianHoliday(d)) return false
  return true
}

// Compte le nombre de jours ouvrés entre startDate et endDate inclus (les deux bornes comptent).
export function countWorkingDays(startDate, endDate, includeSaturday) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  if (end < start) return 0
  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    if (isWorkingDay(cursor, includeSaturday)) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

// Calcule la date de fin en partant de startDate et en comptant
// `workingDays` jours ouvrés (le jour de début compte comme jour 1
// s'il est lui-même ouvré, sinon on avance jusqu'au premier jour ouvré).
export function addWorkingDays(startDate, workingDays, includeSaturday) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  if (workingDays <= 0) return isoDate(start)
  let count = 0
  const cursor = new Date(start)
  let result = new Date(start)
  while (count < workingDays) {
    if (isWorkingDay(cursor, includeSaturday)) {
      count++
      result = new Date(cursor)
    }
    if (count < workingDays) cursor.setDate(cursor.getDate() + 1)
  }
  return isoDate(result)
}

// Raccourci pratique : durée en jours ouvrés d'une tâche (start_date -> end_date inclus).
export function taskDurationWorkingDays(task) {
  if (!task?.start_date || !task?.end_date) return 0
  return countWorkingDays(task.start_date, task.end_date, task.include_saturday)
}
