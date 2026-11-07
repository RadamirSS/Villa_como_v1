import assert from 'node:assert/strict'
import { ShapeUtils, Vector2 } from 'three'
import { COURTYARD_OUTLINE, FOOTPRINTS, GARAGE, GARAGE_GATES, GARAGE_OUTLINE, LEVELS, MAIN_ROOF, OPENINGS, ROOMS, SITE, STAIR_OPENINGS, STUDY_TERRACE, TERRACE, TERRACE_LINK, approachRampY, garageToWorld, polygonArea, terrainY } from '../src/data/architecture.js'
import { GROUPS, SCENARIOS, getLevels } from '../src/data/villa.js'

function cross(a,b,c) { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]) }
function crosses(a,b,c,d) { return cross(a,b,c)*cross(a,b,d)<-1e-8 && cross(c,d,a)*cross(c,d,b)<-1e-8 }
function distance(p,a,b) {
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)))
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)
}
function inside(p,poly,tolerance=0) {
  if(poly.some((a,i)=>distance(p,a,poly[(i+1)%poly.length])<=tolerance+1e-7))return true
  let result=false
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j]
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result
  }
  return result
}
function simple(poly,label) {
  assert(poly.every(p=>p.every(Number.isFinite)),label+' has invalid coordinates')
  for(let i=0;i<poly.length;i++)for(let j=i+2;j<poly.length;j++){
    if(i===0&&j===poly.length-1)continue
    assert(!crosses(poly[i],poly[(i+1)%poly.length],poly[j],poly[(j+1)%poly.length]),label+' self-intersects at edges '+i+'/'+j)
  }
}
function overlapArea(a,b) {
  const triangles=p=>ShapeUtils.triangulateShape(p.map(v=>new Vector2(...v)),[]).map(t=>t.map(i=>p[i]))
  let area=0
  for(const ta of triangles(a))for(const tb of triangles(b)){
    let clipped=ta
    const sign=Math.sign(cross(...tb))
    for(let i=0;i<3&&clipped.length;i++){
      const c=tb[i],d=tb[(i+1)%3],input=clipped;clipped=[]
      for(let j=0;j<input.length;j++){
        const p=input[j],q=input[(j+1)%input.length],cp=cross(c,d,p)*sign,cq=cross(c,d,q)*sign
        if(cp>=0)clipped.push(p)
        if((cp<0)!==(cq<0)){const t=cp/(cp-cq);clipped.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])}
      }
    }
    if(clipped.length>=3)area+=polygonArea(clipped)
  }
  return area
}
for(const [f,poly] of Object.entries(FOOTPRINTS)){
  simple(poly,'Floor '+f)
  for(const room of ROOMS[f]){
    simple(room.points,`Floor ${f}, room ${room.number}`)
    assert(room.points.every(p=>inside(p,poly,.06)),`Floor ${f}, room ${room.number} protrudes outside its slab`)
  }
  for(let i=0;i<ROOMS[f].length;i++)for(let j=i+1;j<ROOMS[f].length;j++){
    const a=ROOMS[f][i],b=ROOMS[f][j],overlap=overlapArea(a.points,b.points)
    assert(overlap<.02,`Floor ${f}, rooms ${a.number}/${b.number} overlap by ${overlap.toFixed(3)} m²`)
  }
  assert.equal(ROOMS[f].length,{1:19,2:12,3:5}[f],'Room inventory must match furniture plans')
  for(const hole of STAIR_OPENINGS[f])assert(hole.every(p=>inside(p,poly)),'Stair opening exits the floor outline')
}
const roofPolygons=MAIN_ROOF.faces.map(face=>face.map(i=>[MAIN_ROOF.vertices[i][0],MAIN_ROOF.vertices[i][2]]))
for(let i=0;i<roofPolygons.length;i++)for(let j=i+1;j<roofPolygons.length;j++){
  assert(overlapArea(roofPolygons[i],roofPolygons[j])<1e-7,'Main roof faces overlap')
}
const roofArea=polygonArea(MAIN_ROOF.vertices.slice(0,6).map(([x,,z])=>[x,z]))
assert(Math.abs(roofPolygons.reduce((sum,p)=>sum+polygonArea(p),0)-roofArea)<1e-7,'Main roof has gaps')
for(const [f,openings] of Object.entries(OPENINGS))for(const o of openings){
  assert(FOOTPRINTS[f].some((a,i)=>distance(o.point,a,FOOTPRINTS[f][(i+1)%FOOTPRINTS[f].length])<.035),`Opening ${f}/${o.point} has no wall`)
}
// The visible trace should preserve area proportions, not merely display
// schedule totals over unrelated rectangles. Attic net area excludes low roof.
for(const f of [1,2]){
  const rooms=ROOMS[f],net=rooms.reduce((sum,r)=>sum+r.area,0),traced=rooms.reduce((sum,r)=>sum+polygonArea(r.points),0)
  assert(Math.abs(traced-net)/net<.02,`Floor ${f} traced room areas deviate by more than 2%`)
}
simple(GARAGE_OUTLINE,'Garage')
assert.equal(LEVELS[0],LEVELS[1],'Garage must share first-floor elevation')
assert(Math.abs(LEVELS[2]-LEVELS[1]-2.93)<1e-8,'Second-floor level must be +2.930 m')
const houseRight=Math.max(...FOOTPRINTS[1].map(p=>p[0]))
const garageLeft=Math.min(...GARAGE_OUTLINE.map(p=>garageToWorld(p)[0]))
assert(garageLeft>houseRight+2,'Garage must be right of the house, with a clear gap')
assert(Math.abs(Math.abs(GARAGE.rotation)-Math.PI/2)<1e-8,'Garage must turn 90 degrees')
const origin=garageToWorld([0,0]),normal=garageToWorld([0,1])
assert(normal[0]<origin[0]&&Math.abs(normal[1]-origin[1])<1e-8,'Garage gates must face west, into the courtyard')
for(const gate of GARAGE_GATES){
  const [x,z]=garageToWorld([gate.x,gate.z])
  assert(x>houseRight&&z>6.5,'Each gate must open to the courtyard, clear of the house')
}
assert(Math.abs(TERRACE.width*TERRACE.depth-22.51)<1e-8,'Terrace area must be 22.51 square metres')
assert.equal(SITE.courtyardY,LEVELS[2],'Courtyard must be at second-floor elevation, without an exterior flight')
assert.equal(STUDY_TERRACE.y,LEVELS[1],'Study terrace must be at first-floor elevation')
assert.equal(STUDY_TERRACE.steps,4,'Study entrance must have exactly four broad steps')
assert.equal(STUDY_TERRACE.width,TERRACE.width,'Steps must span the entire lower terrace')
assert(Math.abs(STUDY_TERRACE.y-STUDY_TERRACE.steps*STUDY_TERRACE.riser-SITE.lowerGardenY)<1e-8,'Fourth step must meet the lower garden')
for(let z=STUDY_TERRACE.front+.05;z<STUDY_TERRACE.front+4*STUDY_TERRACE.tread;z+=.1)for(const x of [STUDY_TERRACE.x+.15,STUDY_TERRACE.x+STUDY_TERRACE.width-.15]){
  assert(!inside([x,z],FOOTPRINTS[1]),'Study steps intersect the house')
}
for(const [label,polygon] of [['Courtyard',COURTYARD_OUTLINE],['Level terrace access',TERRACE_LINK]]){
  simple(polygon,label)
  for(const floor of [1,2])assert(overlapArea(polygon,FOOTPRINTS[floor])<1e-7,label+' intersects the house')
}
assert(TERRACE_LINK.some(p=>Math.abs(p[1]-TERRACE.front)<1e-8),'Level access must start at the upper terrace edge')
assert(overlapArea(COURTYARD_OUTLINE,TERRACE_LINK)<1e-7,'Courtyard and access deck must not overlap')
assert(SITE.courtyardY-.18>STUDY_TERRACE.y+2.5,'Access deck must leave headroom above study terrace/steps')
assert.equal(approachRampY(SITE.rampStart),SITE.courtyardY,'Garage approach must join the upper courtyard')
assert(Math.abs(approachRampY(SITE.rampEnd)-SITE.garageApproachY)<1e-8,'Garage approach must meet the lower apron')
assert(terrainY(0,-7.4)===LEVELS[2]&&terrainY(0,-20)>LEVELS[2],'Rear first-floor facade must meet rising hillside')
assert(!('stairSteps' in TERRACE),'There must be no exterior flight to the second-floor terrace')
for(const group of GROUPS.filter(g=>g.floor>0&&g.id!=='terrace'))assert(inside([group.x,group.z],FOOTPRINTS[group.floor]),'Lighting marker outside its floor: '+group.id)
for(const scene of SCENARIOS){
  const values=Object.values(getLevels(scene.id));assert(values.length===GROUPS.length&&values.every(v=>v>=0&&v<=100),'Invalid scene '+scene.id)
}
assert(Object.values(getLevels('off')).every(v=>v===0))
assert(Object.values(getLevels('full')).every(v=>v===100))
console.log('Geometry verified: rooms/roofs, openings, source levels/areas, garage placement/gates, four full-width study steps, level upper-terrace access, raised courtyard, rear hillside and lighting zones.')
