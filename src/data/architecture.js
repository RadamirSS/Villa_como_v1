// Metres, +X = right when looking at the courtyard facade, +Z = courtyard.
// Plan traces use the 1800 px render of A-04/A-05/A-19/A-20. Calibration:
// A-05 living-room dimension 10.080 m spans 539 px. This is a manual PDF
// trace, not a surveyed/CAD-precision claim.
export const PLAN_SCALE = 539 / 10.08
export const planPoint = ([x, z]) => [(x - 943) / PLAN_SCALE, (z - 530) / PLAN_SCALE]
export const trace = points => points.map(planPoint)
export const LEVELS = { 0: 0.18, 1: 0.18, 2: 3.11, 3: 6.11 }
export const WALL_HEIGHT = { 1: 2.65, 2: 2.89, 3: 0.95, 0: 2.75 }
const roofEave=LEVELS[3]+.02,roofPeak=roofEave+2.78
export const MAIN_ROOF = {
  vertices: [
    ...trace([[192,184],[1186,184],[1186,614],[696,614],[696,874],[192,874]]).map(([x,z])=>[x,roofEave,z]),
    [-9.25,roofPeak,-2.275],[.325,roofPeak,-2.275],[-9.25,roofPeak,1.75],
  ],
  faces: [[0,1,7,6],[1,2,7],[2,3,6,7],[3,4,8,6],[4,5,8],[5,0,6,8]],
  ridges: [[6,7],[6,8],[0,6],[1,7],[2,7],[3,6],[4,8],[5,8]],
}

const bay = Array.from({ length: 13 }, (_, i) => {
  const a = Math.PI / 2 + i * Math.PI / 12
  return [202 + 83 * Math.cos(a), 710 + 115 * Math.sin(a)]
})
const commonFront = [
  [1647, 870], [1386, 870], [1386, 776], [1154, 776],
  [1154, 614], [696, 614], [696, 864], [202, 864], ...bay,
]
export const FOOTPRINTS = {
  1: trace([[202, 194], [834, 194], [834, 148], [1407, 148],
    [1407, 194], [1647, 194], [1647, 412], [1682, 412],
    [1682, 650], [1647, 650], ...commonFront]),
  2: trace([[202, 194], [1186, 194], [1186, 298], [1386, 298],
    [1386, 194], [1647, 194], [1647, 412], [1682, 412],
    [1682, 650], [1647, 650], ...commonFront]),
  // A-06/A-21: register the small spiral stair to A-20, not the page origin.
  3: trace([[255, 254], [1001, 254], [1001, 605],
    [653, 605], [653, 822], [255, 822]]),
}
const circle = (center, radius) => Array.from({length:40},(_,i)=>[
  center[0]+radius*Math.cos(i*Math.PI/20), center[1]+radius*Math.sin(i*Math.PI/20),
])
export const STAIR_OPENINGS = {
  1: [],
  2: [circle(planPoint([1293,415]),1.65)],
  3: [circle(planPoint([694,461]),.88)],
}
export function pointInPolygon(p,poly) {
  let inside=false
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[i],b=poly[j]
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
  }
  return inside
}

const opening = (point, width, height, sill, group, door = false) => ({
  point: planPoint(point), width, height, sill, group, door,
})
export const OPENINGS = {
  1: [
    ...[305, 453, 603].map(x => opening([x, 864], 1.16, 2.35, .08, 'apartment')),
    ...[750, 870, 990, 1110].map(x => opening([x, 614], 1.58, 2.2, .12, 'office')),
    opening([1270, 776], 1.87, 2.2, .08, 'entry', true),
    ...[1510, 1600].map(x => opening([x, 870], 1.55, 1.37, .8, 'staff')),
    ...[308, 492, 753].map(x => opening([x, 194], 1.36, 1.75, .65, 'apartment')),
    ...[1000, 1280].map(x => opening([x, 148], 1.36, 1.75, .65, 'staff')),
    ...[1458, 1573].map(x => opening([x, 194], .7, 1.38, 1.05, 'staff')),
    opening([1647, 300], 1.2, 1.07, 1.1, 'staff'),
    opening([1682, 540], 1.36, 1.2, .9, 'staff'),
    opening([1647, 743], 1.78, 2, .25, 'staff'),
    opening([202, 292], 1.36, 1.75, .65, 'apartment'),
    opening([202, 473], 1.36, 1.75, .65, 'apartment'),
  ],
  2: [
    ...[314, 470, 624].map(x => opening([x, 864], 1.4, 1.78, .8, 'master')),
    ...[750, 864, 986, 1095].map((x, i) => opening([x, 614], i === 0 || i === 3 ? 1.5 : 1.8, 2.4, .12, 'living')),
    opening([1154, 687], 1.4, 2.4, .08, 'living', true),
    opening([1270, 776], 1.87, 1.65, .85, 'living'),
    ...[1440, 1515, 1590].map(x => opening([x, 870], .97, 1.65, .85, 'dining')),
    ...[355, 547, 751].map(x => opening([x, 194], 1.36, 1.78, .8, 'guests')),
    opening([1103, 194], 1.7, 2, .5, 'stairs'),
    opening([1290, 298], 2.35, 2.35, .15, 'stairs'),
    opening([1510, 194], 1.4, 1.65, .8, 'kitchen'),
    opening([1647, 300], 1.36, 1.65, .8, 'kitchen'),
    opening([1682, 535], 1.15, 2.3, .2, 'kitchen'),
    opening([1647, 745], 1.15, 2.36, .14, 'dining'),
    opening([202, 477], 1.36, 1.78, .8, 'master'),
  ],
}
// The curved bay is built from short wall facets; each glazing element
// removes the corresponding masonry, including on the outward west side.
for (const floor of [1,2]) {
  for (const i of [1,2,5,6,9,10]) {
    OPENINGS[floor].push({
      point: planPoint([(bay[i][0]+bay[i+1][0])/2,(bay[i][1]+bay[i+1][1])/2]),
      width: .26, height: 1.52, sill: .62, group: floor===1?'apartment':'master',
    })
  }
}

// Furniture-plan room boundaries. Net room areas are schedule values;
// traced floor polygons include finish/wall tolerances, not surveyed BIM.
const room = (number, name, area, group, points) => ({ number, name, area, group, points: trace(points) })
export const ROOMS = {
  1: [
    room(1, 'Прихожая апартаментов', 5.34, 'apartment', [[665,500],[805,500],[805,613],[665,613]]),
    room(2, 'Каминный зал', 28.68, 'apartment', [[406,546],[645,546],[645,613],[677,613],[677,843],[406,843]]),
    room(3, 'Кухня апартаментов', 14.29, 'apartment', [[222,616],[307,616],[307,646],[381,646],[381,792],[222,792],...bay.slice(1,-1).map(([x,z])=>[x+18,z])]),
    room(4, 'Спальня апартаментов', 16.05, 'apartment', [[222,405],[470,405],[470,540],[406,540],[406,598],[222,598]]),
    room(5, 'Гардеробная', 7.58, 'apartment', [[480,410],[645,410],[645,540],[480,540]]),
    room(6, 'Гардеробная', 8.21, 'apartment', [[385,214],[523,214],[523,390],[385,390]]),
    room(7, 'Санузел', 9.54, 'apartment', [[222,214],[378,214],[378,390],[222,390]]),
    room(8, 'Хозяйственная', 7.26, 'staff', [[531,214],[645,214],[645,394],[531,394]]),
    room(9, 'Постирочная', 10.52, 'staff', [[665,214],[834,214],[834,390],[665,390]]),
    room(10, 'Прихожая и лестница', 31.87, 'entry', [[1180,318],[1386,318],[1386,755],[1178,755]]),
    room(11, 'Кабинет', 34.66, 'office', [[847,318],[1170,318],[1170,611],[811,611],[811,412],[847,412]]),
    room(12, 'Санузел кабинета', 3.70, 'office', [[665,414],[805,414],[805,490],[665,490]]),
    room(13, 'Гардеробная', 13.81, 'staff', [[847,158],[1186,158],[1186,296],[847,296]]),
    room(14, 'Спальня персонала', 9.44, 'staff', [[1195,158],[1386,158],[1386,296],[1195,296]]),
    room(15, 'Коридор персонала', 11.74, 'staff', [[1407,214],[1504,214],[1504,391],[1467,391],[1467,755],[1407,755]]),
    room(16, 'Кухня персонала', 13.22, 'staff', [[1469,653],[1628,653],[1628,846],[1407,846],[1407,755],[1469,755]]),
    room(17, 'Спальня персонала', 10.20, 'staff', [[1472,489],[1658,489],[1658,635],[1472,635]]),
    room(18, 'Санузел персонала', 5.32, 'staff', [[1472,394],[1628,394],[1628,481],[1472,481]]),
    room(19, 'Техническое помещение', 6.42, 'staff', [[1512,214],[1628,214],[1628,382],[1512,382]]),
  ],
  2: [
    room(1, 'Коридор', 12.64, 'stairs', [[526,338],[613,338],[613,399],[648,399],[648,614],[526,614]]),
    room(2, 'Гардеробная', 16.73, 'master', [[222,412],[518,412],[518,614],[406,614],[406,554],[222,554]]),
    room(3, 'Мастер-спальня', 19.94, 'master', [[413,622],[677,622],[677,844],[413,844]]),
    room(4, 'Мастер-санузел', 21.34, 'master', [[222,563],[398,563],[398,844],[222,844],[222,805],...bay.slice(1,-1).map(([x,z])=>[x+18,z]),[222,614]]),
    room(5, 'Гостевая спальня', 14.90, 'guests', [[222,214],[452,214],[452,395],[222,395]]),
    room(6, 'Гостевой санузел', 6.25, 'guests', [[464,214],[613,214],[613,330],[464,330]]),
    room(7, 'Гостевая спальня', 13.88, 'guests', [[625,214],[838,214],[838,395],[625,395]]),
    room(8, 'Гостиная', 76.41, 'living', [[850,318],[1386,318],[1386,756],[1174,756],[1174,606],[669,606],[669,414],[850,414]]),
    room(9, 'Прихожая', 5.53, 'stairs', [[980,214],[1165,214],[1165,300],[980,300]]),
    room(10, 'Санузел', 3.51, 'livingAccent', [[851,214],[970,214],[970,300],[851,300]]),
    room(11, 'Столовая', 24.59, 'dining', [[1407,541],[1658,541],[1658,632],[1627,632],[1627,847],[1407,847]]),
    room(12, 'Кухня', 24.01, 'kitchen', [[1407,214],[1628,214],[1628,426],[1658,426],[1658,526],[1407,526]]),
  ],
  3: [
    room(1, 'Тамбур', 5.01, 'playroom', [[430,420],[608,420],[608,506],[430,506]]),
    room(2, 'Детская / игровая', 22.30, 'playroom', [[286,285],[392,285],[392,416],[425,416],[425,518],[608,518],[608,797],[404,797],[404,615],[286,615]]),
    room(3, 'Спальня', 28.74, 'upperBedroom', [[550,287],[984,287],[984,554],[786,554],[786,404],[550,404]]),
    room(4, 'Санузел', 4.59, 'playroom', [[397,337],[540,337],[540,412],[397,412]]),
    room(5, 'Техническое помещение', 6.14, 'playroom', [[262,617],[396,617],[396,797],[262,797]]),
  ],
}

export const TERRACE = {
  x: (696 - 943) / PLAN_SCALE,
  z: (634 - 530) / PLAN_SCALE,
  width: 458 / PLAN_SCALE,
  depth: 22.51 / (458 / PLAN_SCALE),
  area: 22.51,
  stairWidth: 1.35,
  stairSteps: 18,
  stairTread: .29,
}
TERRACE.exitX = TERRACE.x + TERRACE.width - 1.2
TERRACE.front = TERRACE.z + TERRACE.depth

// Position/orientation on site is the owner's clarification, 7 Nov 2026.
// A-03/A-18 supply the local shape, not the relative site placement.
export const GARAGE = { x: 24.5, z: 10.2, rotation: -Math.PI / 2, height: 2.75 }
const garagePoint = ([x,z]) => [(x - 640) / (518 / 9.65), (z - 510) / (518 / 9.65)]
export const GARAGE_OUTLINE = [[224,376],[334,376],[334,230],[895,230],[895,354],[1058,354],[1058,802],[224,802]].map(garagePoint)
export const GARAGE_GATES = [
  { x: garagePoint([495,802])[0], z: garagePoint([495,802])[1], width: 3.72 },
  { x: garagePoint([719,802])[0], z: garagePoint([719,802])[1], width: 3.72 },
  { x: garagePoint([940,802])[0], z: garagePoint([940,802])[1], width: 3.60 },
]
export function garageToWorld([x,z]) {
  const c=Math.cos(GARAGE.rotation), s=Math.sin(GARAGE.rotation)
  return [GARAGE.x+x*c+z*s, GARAGE.z-x*s+z*c]
}

export function polygonArea(points) {
  return Math.abs(points.reduce((sum,p,i) => {
    const q=points[(i+1)%points.length]
    return sum+p[0]*q[1]-q[0]*p[1]
  },0))/2
}
