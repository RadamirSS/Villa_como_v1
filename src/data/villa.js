/**
 * Villa Como demo data.
 *
 * Room names and floor area totals are grounded in the MÈTRE design file:
 * A-18, A-19, A-20, A-21. Lighting group references are based on A-34..A-37.
 * "Demo group" is a visualization abstraction, NOT an as-built circuit list.
 */
export const FLOORS = [
  { id: 'all', label: 'Вся вилла', short: 'Все этажи' },
  { id: '2', label: '02 / Главный этаж', short: '2 этаж' },
  { id: '1', label: '01 / Первый этаж', short: '1 этаж' },
  { id: '3', label: '03 / Верхний этаж', short: '3 этаж' },
  { id: '0', label: '00 / Гараж', short: 'Гараж' },
]

export const FLOOR_AREAS = {
  0: '138,72 м²',
  1: '247,85 м²',
  2: '262,24 м²',
  3: '66,79 м²',
}

export const GROUPS = [
  { id: 'living', label: 'Гостиная · основной свет', room: 'Гостиная 2', floor: 2, ref: 'A-36 · гр. 8.1–8.4', kind: 'main', x: 1.2, z: -2.8, radius: 3.7 },
  { id: 'livingAccent', label: 'Гостиная · декоративный', room: 'Гостиная 2', floor: 2, ref: 'A-36 · гр. 8.5–8.9', kind: 'accent', x: 4.6, z: -0.2, radius: 2.4 },
  { id: 'dining', label: 'Столовая · подвесы', room: 'Столовая', floor: 2, ref: 'A-36 · гр. 11.1–11.2', kind: 'main', x: 11.4, z: 3.25, radius: 2.2 },
  { id: 'kitchen', label: 'Кухня · рабочий свет', room: 'Кухня', floor: 2, ref: 'A-36 · гр. 12.1–12.3', kind: 'main', x: 11.4, z: -3.5, radius: 2.1 },
  { id: 'terrace', label: 'Терраса · атмосфера', room: 'Терраса / балкон', floor: 2, ref: 'A-36 · Б.1/Б.2 (ориентир)', kind: 'outdoor', x: 1.0, z: 4.1, radius: 3.1 },
  { id: 'master', label: 'Мастер-спальня', room: 'Мастер-спальня', floor: 2, ref: 'A-36 · гр. 3.1–3.6 (ориентир)', kind: 'accent', x: -8.15, z: 3.0, radius: 2.35 },
  { id: 'guests', label: 'Гостевые комнаты', room: 'Гостевые спальни', floor: 2, ref: 'A-36 · гр. 5/6 (ориентир)', kind: 'accent', x: -10.2, z: -4.1, radius: 2.4 },
  { id: 'stairs', label: 'Холл и лестницы', room: 'Холл / лестница', floor: 2, ref: 'A-36 · гр. 7 (ориентир)', kind: 'main', x: 7.0, z: -0.4, radius: 1.65 },
  { id: 'office', label: 'Кабинет · рабочий', room: 'Кабинет', floor: 1, ref: 'A-35 · гр. 11.1–11.4', kind: 'main', x: -0.7, z: -1.7, radius: 2.7 },
  { id: 'entry', label: 'Парадная прихожая', room: 'Прихожая', floor: 1, ref: 'A-35 · гр. 10.1–10.2', kind: 'main', x: 5.0, z: 2.4, radius: 2.6 },
  { id: 'apartment', label: 'Гостевые апартаменты', room: 'Апартаменты', floor: 1, ref: 'A-19, A-35 · демонстрац.', kind: 'accent', x: -10.8, z: 2.2, radius: 3.0 },
  { id: 'staff', label: 'Помещения персонала', room: 'Зона персонала', floor: 1, ref: 'A-19, A-35 · демонстрац.', kind: 'main', x: 11.1, z: -0.5, radius: 2.7 },
  { id: 'playroom', label: 'Игровая / детская', room: 'Детская / игровая', floor: 3, ref: 'A-37 · гр. 2.1–2.2', kind: 'accent', x: -10.7, z: 2.0, radius: 2.8 },
  { id: 'upperBedroom', label: 'Спальня наверху', room: 'Спальня', floor: 3, ref: 'A-37 · гр. 3.1–3.2', kind: 'accent', x: -8.7, z: -3.6, radius: 2.5 },
  { id: 'garage', label: 'Гараж · основной свет', room: 'Гараж', floor: 0, ref: 'A-34 · основное освещение', kind: 'main', x: -12.1, z: 13.9, radius: 3.8 },
  { id: 'driveway', label: 'Въезд и дорожки', room: 'Территория', floor: 0, ref: 'A-34 · датчики ворот (ориентир)', kind: 'outdoor', x: -3.1, z: 12.7, radius: 3.0 },
]

export const SCENARIOS = [
  {
    id: 'welcome', name: 'Добро пожаловать', sub: 'Мягкий свет к приезду', icon: 'Sunrise', tag: 'ПРИЕЗД',
    levels: { living: 68, livingAccent: 60, dining: 42, kitchen: 40, terrace: 70, master: 20, guests: 15, stairs: 85, office: 25, entry: 90, apartment: 18, staff: 25, playroom: 15, upperBedroom: 15, garage: 90, driveway: 95 },
  },
  {
    id: 'evening', name: 'Вечер на Комо', sub: 'Тёплые акценты и терраса', icon: 'Sunset', tag: 'АТМОСФЕРА',
    levels: { living: 34, livingAccent: 90, dining: 64, kitchen: 28, terrace: 84, master: 24, guests: 20, stairs: 35, office: 12, entry: 40, apartment: 18, staff: 15, playroom: 12, upperBedroom: 15, garage: 20, driveway: 55 },
  },
  {
    id: 'dinner', name: 'Ужин с гостями', sub: 'Столовая, кухня и детали', icon: 'UtensilsCrossed', tag: 'ГОСТИ',
    levels: { living: 28, livingAccent: 65, dining: 100, kitchen: 76, terrace: 48, master: 8, guests: 22, stairs: 48, office: 5, entry: 55, apartment: 12, staff: 42, playroom: 5, upperBedroom: 8, garage: 30, driveway: 48 },
  },
  {
    id: 'cinema', name: 'Кино и отдых', sub: 'Приглушённый общий свет', icon: 'Clapperboard', tag: 'ОТДЫХ',
    levels: { living: 5, livingAccent: 25, dining: 12, kitchen: 7, terrace: 25, master: 12, guests: 8, stairs: 18, office: 0, entry: 22, apartment: 8, staff: 8, playroom: 0, upperBedroom: 8, garage: 0, driveway: 28 },
  },
  {
    id: 'night', name: 'Спокойной ночи', sub: 'Навигационный свет', icon: 'Moon', tag: 'НОЧЬ',
    levels: { living: 0, livingAccent: 10, dining: 0, kitchen: 6, terrace: 14, master: 12, guests: 10, stairs: 18, office: 0, entry: 12, apartment: 10, staff: 10, playroom: 3, upperBedroom: 12, garage: 0, driveway: 35 },
  },
  {
    id: 'full', name: 'Весь свет', sub: 'Показать все зоны', icon: 'Lightbulb', tag: 'ДЕМО',
    levels: Object.fromEntries(['living','livingAccent','dining','kitchen','terrace','master','guests','stairs','office','entry','apartment','staff','playroom','upperBedroom','garage','driveway'].map(id => [id, 100])),
  },
  {
    id: 'off', name: 'Всё выключено', sub: 'Master off · демонстрация', icon: 'Power', tag: 'MASTER',
    levels: {},
  },
]

export function getLevels(scenarioId, overrides = {}) {
  const preset = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0]
  return Object.fromEntries(GROUPS.map(g => [g.id, overrides[g.id] ?? preset.levels[g.id] ?? 0]))
}

export function getFloorName(floor) {
  return floor === 0 ? 'Гараж' : floor === 1 ? '1 этаж' : floor === 2 ? '2 этаж' : '3 этаж'
}
