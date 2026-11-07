import assert from 'node:assert/strict'
import { ShapeUtils, Vector2 } from 'three'
import { FOOTPRINTS, GARAGE, GARAGE_GATES, GARAGE_OUTLINE, LEVELS, MAIN_ROOF, OPENINGS, ROOMS, STAIR_OPENINGS, TERRACE, garageToWorld, polygonArea } from '../src/data/architecture.js'
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
const bottom=TERRACE.front+TERRACE.stairSteps*TERRACE.stairTread
assert(bottom<12&&bottom>8,'Terrace stair must reach the courtyard pavement')
for(let z=TERRACE.front+.1;z<=bottom;z+=.1)for(const side of [-1,1]){
  assert(!inside([TERRACE.exitX+side*TERRACE.stairWidth/2,z],FOOTPRINTS[1]),'Terrace stair intersects the house')
}
for(const group of GROUPS.filter(g=>g.floor>0&&g.id!=='terrace'))assert(inside([group.x,group.z],FOOTPRINTS[group.floor]),'Lighting marker outside its floor: '+group.id)
for(const scene of SCENARIOS){
  const values=Object.values(getLevels(scene.id));assert(values.length===GROUPS.length&&values.every(v=>v>=0&&v<=100),'Invalid scene '+scene.id)
}
assert(Object.values(getLevels('off')).every(v=>v===0))
assert(Object.values(getLevels('full')).every(v=>v===100))
console.log('Geometry verified: non-overlapping rooms/roof faces, roof coverage, stair openings, source levels/areas, garage placement/gates, terrace stair clearance and lighting zones.')
