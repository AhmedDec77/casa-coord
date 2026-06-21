// Libellés des groupes de coûts (Kostengruppen) connus, utilisés pour
// regrouper les tâches dans le Gantt et la table. Le code est déduit du
// préfixe du titre de la tâche (ex: "300.01 – ..." -> groupe "300").
// Si un préfixe n'est pas dans cette liste, on affiche juste "Gruppe XXX".
export const KG_LABELS = {
  100: 'Allgemeine Bedingungen',
  200: 'Baustelleneinrichtung und Vorbereitung',
  300: 'Baukonstruktionen',
  400: 'Technische Anlagen',
  490: 'Sonstige Bauleistungen',
  600: 'Ausstattung und Einbauten',
}

// Extrait le code de groupe (ex: "300") à partir du titre d'une tâche
// (ex: "300.01 – Abbruch ..."). Retourne "Sonstiges" si aucun code trouvé.
export function extractGroupCode(title) {
  const match = title?.match(/^(\d{3})(?:\.\d+)?/)
  return match ? match[1] : 'Sonstiges'
}

export function groupLabel(code) {
  if (code === 'Sonstiges') return 'Sonstiges'
  const label = KG_LABELS[Number(code)]
  return label ? `${code} — ${label}` : `Gruppe ${code}`
}

// Regroupe une liste de tâches par code de groupe, en préservant
// l'ordre d'apparition des groupes (basé sur le premier élément rencontré).
export function groupTasks(tasks) {
  const order = []
  const map = {}
  for (const task of tasks) {
    const code = extractGroupCode(task.title)
    if (!map[code]) {
      map[code] = []
      order.push(code)
    }
    map[code].push(task)
  }
  return order.map((code) => ({ code, label: groupLabel(code), tasks: map[code] }))
}
