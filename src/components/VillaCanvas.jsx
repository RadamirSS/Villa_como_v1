import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { GROUPS } from '../data/villa.js'
import { FOOTPRINTS, GARAGE, GARAGE_GATES, GARAGE_OUTLINE, LEVELS, MAIN_ROOF, OPENINGS, ROOMS, STAIR_OPENINGS, TERRACE, WALL_HEIGHT, planPoint, pointInPolygon } from '../data/architecture.js'

const M={wall:'#e0d7c5',stone:'#baad98',trim:'#f3ead9',roof:'#8b6654',wood:'#8e7358',metal:'#424c48',floor:'#d8c9b4'}
const P=planPoint

function Box({at=[0,0,0],size=[1,1,1],color=M.wall,rotation=[0,0,0],emissive=0,opacity=1}) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.8} metalness={.02} emissive="#ffc27c" emissiveIntensity={emissive} transparent={opacity<1} opacity={opacity}/></mesh>
}
function makeShape(points,holes=[]) {
  const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));shape.closePath()
  holes.forEach(hole=>{const path=new THREE.Path(hole.map(([x,z])=>new THREE.Vector2(x,-z)));path.closePath();shape.holes.push(path)})
  return shape
}
function Plate({points,y,depth=.24,color=M.floor,onClick,holes=[]}) {
  const geometry=useMemo(()=>{
    const g=new THREE.ExtrudeGeometry(makeShape(points,holes),{depth,bevelEnabled:false});g.rotateX(-Math.PI/2);return g
  },[points,depth,holes])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <mesh geometry={geometry} position={[0,y-depth,0]} castShadow receiveShadow onClick={onClick}><meshStandardMaterial color={color} roughness={.9}/></mesh>
}
function Beam({from,to,width=.06,color=M.metal}) {
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),v=b.clone().sub(a)
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize())
  return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={rotation} castShadow><cylinderGeometry args={[width/2,width/2,v.length(),8]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>
}
function Glazing({x,y,width,height,level=0,door=false}) {
  return <group position={[x,y,0]}>
    <Box size={[width+.12,height+.12,.11]} color={M.trim}/>
    <Box at={[0,0,.065]} size={[width,height,.035]} color={level>0?'#d4bb92':'#526a70'} emissive={level/100*.8}/>
    {[-width/2,0,width/2].map((xx,i)=><Box key={i} at={[xx,0,.105]} size={[.045,height,.045]} color={M.metal}/>)}
    {[-height/2,height/2].map((yy,i)=><Box key={i} at={[0,yy,.105]} size={[width,.045,.045]} color={M.metal}/>)}
    {!door && <Box at={[0,height*.12,.105]} size={[width,.035,.04]} color={M.metal}/>}
    <Box at={[0,-height/2-.065,.03]} size={[width+.22,.09,.23]} color={M.stone}/>
    {door && <Box at={[.09,-.15,.15]} size={[.035,.19,.035]} color="#ad9261"/>}
  </group>
}

// Local +Z faces outside. Openings replace wall geometry, so rear/side
// windows cannot be covered by plaster or face into the building.
function Wall({a,b,y,height,thickness=.28,openings=[],levels={},color=M.wall}) {
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)
  const cuts=openings.map(o=>{
    const t=((o.point[0]-a[0])*dx+(o.point[1]-a[1])*dz)/(length*length)
    const distance=Math.abs((o.point[0]-a[0])*dz-(o.point[1]-a[1])*dx)/length
    return {...o,center:length*(.5-t),distance,t}
  }).filter(o=>o.distance<.035&&o.t>0&&o.t<1&&o.width<length-.08).sort((l,r)=>l.center-r.center)
  const pieces=[];let cursor=-length/2
  cuts.forEach((o,i)=>{
    const left=o.center-o.width/2,right=o.center+o.width/2
    if(left>cursor+.005)pieces.push(<Box key={'pier'+i} at={[(cursor+left)/2,height/2,0]} size={[left-cursor,height,thickness]} color={color}/> )
    if(o.sill>0)pieces.push(<Box key={'sill'+i} at={[o.center,o.sill/2,0]} size={[o.width,o.sill,thickness]} color={color}/> )
    const head=o.sill+o.height
    if(height>head)pieces.push(<Box key={'head'+i} at={[o.center,(height+head)/2,0]} size={[o.width,height-head,thickness]} color={color}/> )
    if(!o.solid)pieces.push(<group key={'window'+i} position={[0,0,thickness/2]}><Glazing x={o.center} y={o.sill+o.height/2} width={o.width-.04} height={o.height-.04} level={levels[o.group]} door={o.door}/></group>)
    cursor=right
  })
  if(cursor<length/2)pieces.push(<Box key="last" at={[(cursor+length/2)/2,height/2,0]} size={[length/2-cursor,height,thickness]} color={color}/>)
  return <group position={[(a[0]+b[0])/2,y,(a[1]+b[1])/2]} rotation={[0,Math.PI-Math.atan2(dz,dx),0]}>{pieces}</group>
}
function Perimeter({points,y,height,levels,openings=[],thickness=.28,color=M.wall}) {
  return points.map((a,i)=><Wall key={i} a={a} b={points[(i+1)%points.length]} y={y} height={height} levels={levels} openings={openings} thickness={thickness} color={color}/>)
}

function useRoofTexture() {
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128
    const ctx=canvas.getContext('2d');ctx.fillStyle='#ddd1c7';ctx.fillRect(0,0,128,128)
    for(let row=0;row<8;row++)for(let col=-1;col<4;col++){
      const x=col*32+(row%2)*16,y=row*16
      ctx.fillStyle=(row+col)%3===0?'#c7b7a9':'#d6c5b6';ctx.fillRect(x,y,30,14)
      ctx.fillStyle='#b3a294';ctx.fillRect(x,y+13,30,1)
    }
    const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t
  },[])
  useEffect(()=>()=>texture.dispose(),[texture]);return texture
}
function RoofSurface({vertices,faces,ridges=[]}) {
  const texture=useRoofTexture()
  const geometry=useMemo(()=>{
    const positions=[],uv=[]
    for(const face of faces)for(let i=1;i<face.length-1;i++)for(const index of [face[0],face[i],face[i+1]]){
      const p=vertices[index];positions.push(...p);uv.push(p[0]/2,p[2]/2)
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g
  },[vertices,faces])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <group><mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={M.roof} map={texture} roughness={.94} side={THREE.DoubleSide}/></mesh>
    {ridges.map(([a,b],i)=><Beam key={i} from={vertices[a]} to={vertices[b]} width={.105} color="#775645"/>)}</group>
}
function HipRoof({x,z,width,depth,y,rise=1.2}) {
  const alongX=width>=depth,hip=Math.min(width,depth)/2
  const vertices=[[-width/2,y,-depth/2],[width/2,y,-depth/2],[width/2,y,depth/2],[-width/2,y,depth/2],
    alongX?[-width/2+hip,y+rise,0]:[0,y+rise,-depth/2+hip],
    alongX?[width/2-hip,y+rise,0]:[0,y+rise,depth/2-hip]].map(([xx,yy,zz])=>[xx+x,yy,zz+z])
  const faces=alongX?[[0,1,5,4],[1,2,5],[2,3,4,5],[3,0,4]]:[[0,1,4],[1,2,5,4],[2,3,5],[3,0,4,5]]
  return <RoofSurface vertices={vertices} faces={faces} ridges={[[4,5],[0,4],[1,alongX?5:4],[2,5],[3,alongX?4:5]]}/>
}
function Skylight({point}) {
  const [x,z]=P(point),{vertices}=MAIN_ROOF
  const face=MAIN_ROOF.faces.find(f=>pointInPolygon([x,z],f.map(i=>[vertices[i][0],vertices[i][2]])))
  if(!face)return null
  const plane=new THREE.Plane().setFromCoplanarPoints(...face.slice(0,3).map(i=>new THREE.Vector3(...vertices[i])))
  if(plane.normal.y<0)plane.negate()
  const y=-(plane.normal.x*x+plane.normal.z*z+plane.constant)/plane.normal.y
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),plane.normal)
  return <group position={[x,y+.035,z]} quaternion={rotation}>
    <Box size={[.82,1.08,.075]} color={M.metal}/><Box at={[0,0,.045]} size={[.69,.95,.03]} color="#667f83"/>
    <Box at={[0,0,.067]} size={[.025,.95,.018]} color="#adb9b2"/>
  </group>
}
function HouseRoof() {
  // One L roof: faces share ridge/valley vertices, without crossing gables.
  const y=LEVELS[3]+.02
  return <group>
    <RoofSurface {...MAIN_ROOF}/>
    <HipRoof x={11.02} z={.02} width={5.35} depth={12.84} y={y} rise={1.6}/>
    <HipRoof x={6.42} z={.09} width={3.74} depth={9.2} y={y} rise={.74}/>
    <HipRoof x={3.32} z={-6.66} width={10.72} depth={.82} y={LEVELS[2]-.01} rise={.15}/>
    <BayRoof y={y}/>
    {[[526,314],[887,314],[363,489],[819,490],[556,784]].map((p,i)=><Skylight key={i} point={p}/>)}
  </group>
}
function BayRoof({y}) {
  const arc=Array.from({length:13},(_,i)=>P([192+83*Math.cos(Math.PI/2+i*Math.PI/12),710+115*Math.sin(Math.PI/2+i*Math.PI/12)]))
  const vertices=arc.map(([x,z])=>[x,y,z]);vertices.push([P([202,710])[0],y+.72,P([202,710])[1]])
  return <RoofSurface vertices={vertices} faces={arc.slice(1).map((_,i)=>[13,i,i+1])}/>
}
function House({levels}) {
  return <group>
    {[1,2].map(f=><group key={f}>
      <Plate points={FOOTPRINTS[f]} y={LEVELS[f]} depth={.28} color="#c5b7a1"/>
      <Perimeter points={FOOTPRINTS[f]} y={LEVELS[f]} height={WALL_HEIGHT[f]} openings={OPENINGS[f]} levels={levels}/>
      <Perimeter points={FOOTPRINTS[f]} y={LEVELS[f]+WALL_HEIGHT[f]} height={.13} thickness={.37} color={M.trim}/>
    </group>)}
    <HouseRoof/><Terrace levels={levels}/><TerraceStairs/><EntranceSteps/>
  </group>
}
function Rail({a,b,y,height=.98}) {
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(length/.95)
  return <group>
    <Beam from={[a[0],y+height,a[1]]} to={[b[0],y+height,b[1]]} width={.055}/>
    <Beam from={[a[0],y+.15,a[1]]} to={[b[0],y+.15,b[1]]} width={.035}/>
    {Array.from({length:count+1},(_,i)=>{const t=i/count,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;return <Beam key={i} from={[x,y,z]} to={[x,y+height,z]} width={.035}/>})}
  </group>
}
function Terrace({levels}) {
  const t=TERRACE,y=LEVELS[2],right=t.x+t.width,lit=(levels.terrace||0)/100
  const points=[[t.x,t.z],[right,t.z],[right,t.front],[t.x,t.front]],exitL=t.exitX-t.stairWidth/2,exitR=t.exitX+t.stairWidth/2
  return <group>
    <Plate points={points} y={y} depth={.25} color="#b5a287"/>
    {Array.from({length:17},(_,i)=><Box key={i} at={[t.x+(i+.5)*t.width/17,y+.008,t.z+t.depth/2]} size={[.013,.01,t.depth]} color="#a89377"/>)}
    <Rail a={[t.x,t.front]} b={[exitL,t.front]} y={y}/><Rail a={[exitR,t.front]} b={[right,t.front]} y={y}/>
    <Rail a={[t.x,t.z]} b={[t.x,t.front]} y={y}/>
    <Sofa x={t.x+2.2} z={t.z+.65} y={y} scale={.85}/><Table x={t.x+3.2} z={t.z+1.65} y={y} small/>
    <Plant x={t.x+.5} z={t.front-.45} y={y} scale={.7}/><Plant x={right-.38} z={t.z+.4} y={y} scale={.55}/>
    {[t.x+1,t.x+4.4,right-.25].map((x,i)=><group key={i}><Box at={[x,y+.17,t.front-.15]} size={[.12,.34,.12]} color={M.metal}/><Box at={[x,y+.36,t.front-.15]} size={[.13,.055,.13]} color="#ead7af" emissive={lit*2}/></group>)}
    {[t.x+.18,t.x+t.width/2,right-.18].map((x,i)=><Box key={i} at={[x,y/2-.13,t.front-.17]} size={[.22,y-.26,.22]} color={M.stone}/>)}
  </group>
}
function TerraceStairs() {
  const t=TERRACE,top=LEVELS[2],riser=top/t.stairSteps,run=t.stairSteps*t.stairTread
  return <group>
    {Array.from({length:t.stairSteps},(_,i)=>{const h=top-i*riser,z=t.front+(i+.5)*t.stairTread;return <Box key={i} at={[t.exitX,h/2,z]} size={[t.stairWidth,h,t.stairTread]} color={i%2?'#c6b89f':'#ccbea6'}/>})}
    <Box at={[t.exitX,.035,t.front+run+.65]} size={[t.stairWidth+.5,.07,1.3]} color="#b7ae9c"/>
    {[-1,1].map(side=>{const x=t.exitX+side*(t.stairWidth/2+.025);return <group key={side}>
      <Beam from={[x,top+1,t.front]} to={[x,1,t.front+run]} width={.055}/>
      {Array.from({length:7},(_,i)=>{const s=i/6;return <Beam key={i} from={[x,top*(1-s),t.front+run*s]} to={[x,top*(1-s)+1,t.front+run*s]} width={.035}/>})}
    </group>})}
  </group>
}
function EntranceSteps() {const [x,z]=P([1270,776]);return <Box at={[x,.06,z+.4]} size={[2.35,.12,.8]} color={M.stone}/>}

function Sofa({x,z,y,rotation=0,scale=1}) {
  return <group position={[x,y,z]} rotation={[0,rotation,0]} scale={scale}>
    <Box at={[0,.29,0]} size={[2.25,.4,.88]} color="#cbbda9"/><Box at={[0,.57,-.39]} size={[2.25,.65,.16]} color="#d8cbbb"/>
    {[-1.04,1.04].map(a=><Box key={a} at={[a,.43,0]} size={[.2,.55,.88]} color="#d8cbbb"/>)}
    {[-.52,.52].map(a=><Box key={a} at={[a,.53,0]} size={[.86,.14,.66]} color="#f0e6d8"/>)}
    {[-.9,.9].flatMap(a=>[-.3,.3].map(b=><Box key={a+','+b} at={[a,.045,b]} size={[.07,.09,.07]} color={M.wood}/>))}
  </group>
}
function Bed({x,z,y,rotation=0,scale=1}) {
  return <group position={[x,y,z]} rotation={[0,rotation,0]} scale={scale}>
    <Box at={[0,.24,0]} size={[1.9,.38,2.25]} color={M.wood}/><Box at={[0,.49,0]} size={[1.8,.24,2.1]} color="#eee8de"/>
    <Box at={[0,.63,-1.13]} size={[2.04,1.12,.12]} color="#baa58a"/>
    {[-.45,.45].map(a=><Box key={a} at={[a,.66,-.68]} size={[.7,.14,.44]} color="#f5f0e4"/>)}
    <Box at={[0,.63,.55]} size={[1.76,.035,.78]} color="#9fac9d"/>
    {[-.78,.78].flatMap(a=>[-.9,.9].map(b=><Box key={a+','+b} at={[a,.045,b]} size={[.08,.09,.08]} color={M.wood}/>))}
  </group>
}
function Table({x,z,y,small=false,rotation=0}) {
  return <group position={[x,y,z]} rotation={[0,rotation,0]}>
    <Box at={[0,small?.38:.75,0]} size={small?[.9,.09,.65]:[1.3,.1,2.6]} color={M.wood}/><Box at={[0,small?.18:.36,0]} size={[.35,small?.34:.7,.45]} color={M.metal}/>
    {!small&&[-.9,0,.9].flatMap(zz=>[-1,1].map(side=><group key={zz+','+side}><Box at={[side*.92,.42,zz]} size={[.48,.12,.52]} color="#c8bbab"/><Box at={[side*1.12,.7,zz]} size={[.1,.5,.52]} color="#c8bbab"/>{[-.16,.16].flatMap(dx=>[-.18,.18].map(dz=><Box key={dx+','+dz} at={[side*.92+dx,.18,zz+dz]} size={[.04,.36,.04]} color={M.wood}/>))}</group>))}
  </group>
}
function Desk({x,z,y,rotation=0}) {
  return <group position={[x,y,z]} rotation={[0,rotation,0]}><Box at={[0,.75,0]} size={[1.9,.1,.85]} color={M.wood}/>
    {[-.7,.7].map(a=><Box key={a} at={[a,.35,0]} size={[.12,.7,.7]} color={M.metal}/>)}
    <Box at={[0,.99,-.2]} size={[.65,.4,.045]} color="#3f5053"/><Box at={[0,.44,.8]} size={[.6,.12,.6]} color="#a6a393"/>
  </group>
}
function Plant({x,z,y=0,scale=1}) {
  return <group position={[x,y,z]} scale={scale}><mesh position={[0,.25,0]} castShadow><cylinderGeometry args={[.29,.22,.5,12]}/><meshStandardMaterial color="#ad9473"/></mesh><mesh position={[0,.8,0]} castShadow><sphereGeometry args={[.42,14,10]}/><meshStandardMaterial color="#657a59" roughness={1}/></mesh></group>
}
function Kitchen({x,z,y,rotation=0}) {
  return <group position={[x,y,z]} rotation={[0,rotation,0]}><Box at={[0,.44,0]} size={[3.3,.88,.62]} color="#a7967d"/><Box at={[0,.91,0]} size={[3.35,.08,.68]} color="#e2d8c7"/><Box at={[.8,.96,0]} size={[.6,.025,.43]} color="#394240"/><Box at={[-.75,.96,0]} size={[.55,.025,.4]} color="#73817a"/></group>
}

const PARTITIONS={
  1:[[[383,213],[383,390]],[[523,213],[523,390]],[[222,398],[645,398]],[[473,400],[473,544]],[[405,545],[645,545]],[[405,545],[405,843]],[[655,214],[655,613]],[[665,403],[806,403]],[[665,494],[806,494]],[[808,403],[808,612]],[[847,307],[1178,307]],[[1186,159],[1186,298]],[[1400,214],[1400,755]],[[1505,214],[1505,388]],[[1465,390],[1628,390]],[[1465,482],[1628,482]],[[1465,644],[1628,644]],[[1465,391],[1465,754]]],
  2:[[[459,214],[459,399]],[[620,214],[620,399]],[[222,403],[521,403]],[[222,557],[400,557]],[[406,557],[406,843]],[[523,399],[523,615]],[[413,617],[676,617]],[[648,405],[648,615]],[[847,214],[847,405]],[[976,214],[976,305]],[[851,307],[1166,307]],[[1400,535],[1657,535]]],
  3:[[[392,285],[392,412]],[[397,330],[542,330]],[[542,287],[542,414]],[[397,414],[608,414]],[[427,419],[427,514]],[[427,514],[608,514]],[[402,616],[402,797]],[[262,616],[402,616]]],
}
function InteriorPartitions({floor}) {
  return PARTITIONS[floor].map(([a,b],i)=>{
    const pa=P(a),pb=P(b),length=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]),y=LEVELS[floor]
    const middle=[(pa[0]+pb[0])/2,(pa[1]+pb[1])/2],dx=(pb[0]-pa[0])/length,dz=(pb[1]-pa[1])/length
    if(length>1.8)return <group key={i}><Wall a={pa} b={[middle[0]-.4*dx,middle[1]-.4*dz]} y={y} height={.68} thickness={.12}/><Wall a={[middle[0]+.4*dx,middle[1]+.4*dz]} b={pb} y={y} height={.68} thickness={.12}/></group>
    return <Wall key={i} a={pa} b={pb} y={y} height={.68} thickness={.12}/>
  })
}
function PlanFurniture({floor}) {
  const y=LEVELS[floor],at=([x,z])=>{const p=P([x,z]);return {x:p[0],z:p[1],y:y+.015}}
  return <group>
    {floor===1&&<>
      <Bed {...at([315,493])} rotation={Math.PI/2}/><Sofa {...at([535,666])}/><Table {...at([535,776])}/><Kitchen {...at([190,714])} rotation={Math.PI/2}/>
      <Desk {...at([1020,426])} rotation={Math.PI/2}/><Sofa {...at([1010,337])}/><Table {...at([909,510])} small/>
      <Bed {...at([1306,216])} rotation={Math.PI/2} scale={.8}/><Bed {...at([1560,558])} scale={.8}/><Kitchen {...at([1550,670])}/><Table {...at([1530,767])}/>
      <SpiralStairs point={P([1293,415])} y={y} height={2.93} radius={1.75}/>
    </>}
    {floor===2&&<>
      <Bed {...at([320,298])} rotation={Math.PI/2}/><Bed {...at([733,300])} rotation={Math.PI/2}/><Bed {...at([553,714])} rotation={Math.PI/2}/>
      <Sofa {...at([999,420])}/><Sofa {...at([1091,468])} rotation={Math.PI/2} scale={.65}/><Table {...at([1003,492])} small/><Sofa {...at([1275,696])} scale={.75}/>
      <Kitchen {...at([1510,228])}/><Kitchen {...at([1611,365])} rotation={Math.PI/2}/><Table {...at([1516,724])}/>
      <SpiralStairs point={P([694,461])} y={y} height={3} radius={.92}/><SpiralStairs point={P([1293,415])} y={LEVELS[1]} height={2.93} radius={1.75}/>
    </>}
    {floor===3&&<>
      <Bed {...at([330,326])} scale={.73}/><Desk {...at([531,565])}/><Sofa {...at([565,705])} rotation={Math.PI/2}/><Bed {...at([718,330])} y={y+.225}/><Sofa {...at([876,524])} scale={1.1}/>
      <SpiralStairs point={P([694,461])} y={LEVELS[2]} height={3} radius={.92}/>
    </>}
  </group>
}
function SpiralStairs({point,y,height,radius}) {
  const steps=18,inner=.2
  return <group position={[point[0],y,point[1]]}>
    <Beam from={[0,0,0]} to={[0,height+.9,0]} width={.12}/>
    {Array.from({length:steps},(_,i)=>{const a=i*Math.PI*1.65/steps;const points=[[inner*Math.cos(a),inner*Math.sin(a)],[radius*Math.cos(a),radius*Math.sin(a)],[radius*Math.cos(a+.24),radius*Math.sin(a+.24)],[inner*Math.cos(a+.24),inner*Math.sin(a+.24)]];return <Plate key={i} points={points} y={(i+1)*height/steps} depth={.06} color={i%2?'#c4af90':'#d4c3a7'}/>})}
  </group>
}
function RoomLight({group,level,y,selected,onSelect,labels=true}) {
  const lit=level/100
  return <group position={[group.x,y+.13,group.z]}>
    <mesh rotation={[-Math.PI/2,0,0]} onClick={e=>{e.stopPropagation();onSelect(group.id)}} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}}><ringGeometry args={[.19,.27,24]}/><meshBasicMaterial color={selected?'#e99a45':lit>0?'#eec082':'#9eaaa4'} side={THREE.DoubleSide} depthWrite={false}/></mesh>
    <mesh position={[0,.06,0]}><sphereGeometry args={[.095,12,8]}/><meshStandardMaterial color={lit>0?'#ffda9c':'#94a29c'} emissive="#ffbd68" emissiveIntensity={lit*3}/></mesh>
    {labels&&<Html center position={[0,.52,0]} distanceFactor={19} style={{whiteSpace:'nowrap',pointerEvents:'none'}}><div className={'model-room-label'+(selected?' is-active':'')}><span className="model-room-light" style={{opacity:lit>.01?1:.2}}/><span>{group.room}</span><b>{level}%</b></div></Html>}
  </group>
}
function FloorPlan({floor,levels,selectedGroup,onZoneSelect}) {
  const y=LEVELS[floor]
  return <group>
    <Plate points={FOOTPRINTS[floor]} holes={STAIR_OPENINGS[floor]} y={y} color="#b5a58e"/>
    {ROOMS[floor].map((room,i)=>{
      const holes=STAIR_OPENINGS[floor].filter(hole=>hole.every(p=>pointInPolygon(p,room.points)))
      return <group key={room.number}>
        <Plate points={room.points} holes={holes} y={y+.035+(floor===3&&room.number===3?.21:0)} depth={.035} color={i%3===0?'#c7b79d':i%3===1?'#d9cbb6':'#e3dac9'} onClick={e=>{e.stopPropagation();onZoneSelect(room.group)}}/>
        {levels[room.group]>0&&<mesh position={[0,y+.045+(floor===3&&room.number===3?.21:0),0]} rotation={[-Math.PI/2,0,0]}><shapeGeometry args={[makeShape(room.points,holes)]}/><meshBasicMaterial color="#ffcb7b" transparent opacity={levels[room.group]/100*.22} depthWrite={false} side={THREE.DoubleSide}/></mesh>}
      </group>
    })}
    <Perimeter points={FOOTPRINTS[floor]} y={y} height={.72} thickness={.25}/><InteriorPartitions floor={floor}/><PlanFurniture floor={floor}/>
    {floor===2&&<><Terrace levels={levels}/><TerraceStairs/></>}
    {GROUPS.filter(g=>g.floor===floor).map(g=><RoomLight key={g.id} group={g} y={y} level={levels[g.id]} selected={g.id===selectedGroup} onSelect={onZoneSelect}/>)}
  </group>
}
function Car({x,z,y,color='#5b6969'}) {
  return <group position={[x,y,z]}><Box at={[0,.48,0]} size={[1.72,.45,3.8]} color={color}/><Box at={[0,.84,-.17]} size={[1.45,.48,1.85]} color="#3d5157"/>
    {[-.86,.86].flatMap(xx=>[-1.22,1.22].map(zz=><mesh key={xx+','+zz} position={[xx,.31,zz]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.31,.31,.17,16]}/><meshStandardMaterial color="#303936"/></mesh>))}
    {[-.55,.55].map(xx=><Box key={xx} at={[xx,.56,1.92]} size={[.33,.12,.025]} color="#e9dabb"/>)}
  </group>
}
function Garage({levels,plan=false,selectedGroup,onZoneSelect}) {
  const y=LEVELS[0],g=GARAGE,lit=levels.garage/100
  const gates=GARAGE_GATES.map(gate=>({point:[gate.x,gate.z],width:gate.width,height:2.67,sill:0,group:'garage',door:true,solid:true}))
  const cellar=[[9.35,1.7],[13.95,1.7],[13.95,5.35],[9.35,5.35]]
  return <group>
    <group position={[g.x,0,g.z]} rotation={[0,g.rotation,0]}>
      <Plate points={GARAGE_OUTLINE} y={y} color="#b4ac9c"/>
      <Perimeter points={GARAGE_OUTLINE} y={y} height={plan?.7:g.height} thickness={.3} openings={gates} levels={levels}/>
      {plan?<>
        {[-2.05,1.2].map(x=><Wall key={x} a={[x,-5.05]} b={[x,-2.3]} y={y} height={.7} thickness={.15}/>)}
        <Wall a={[-5.45,-2.3]} b={[4.75,-2.3]} y={y} height={.7} thickness={.15} openings={[-4.3,-.35,3].map(x=>({point:[x,-2.3],width:.8,height:2.16,sill:0,solid:true}))}/>
        <Wall a={[-5.45,.2]} b={[-5.45,5.1]} y={y} height={.7} thickness={.15} openings={[1.3,3.7].map(z=>({point:[-5.45,z],width:.8,height:2.16,sill:0,solid:true}))}/>
        <Wall a={[-7.5,2.45]} b={[-5.45,2.45]} y={y} height={.7} thickness={.15}/>
        <Car x={-2.7} z={2.5} y={y+.02} color="#84908b"/><Car x={1.4} z={2.5} y={y+.02}/><Kitchen x={-3.8} z={-4.75} y={y}/>
        {[0,3.5].map(x=><Box key={x} at={[x,y+.5,-4.8]} size={[1.5,1,.4]} color={M.wood}/>)}<Desk x={-6.6} z={-.6} y={y}/>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,y+.01,1.2]}><planeGeometry args={[10,5.4]}/><meshBasicMaterial color="#f4c57d" transparent opacity={lit*.14} depthWrite={false}/></mesh>
      </>:<>
    <HipRoof x={0} z={1.55} width={15.8} depth={8.3} y={y+g.height+.12} rise={1.05}/><HipRoof x={-.3} z={-3.93} width={10.7} depth={2.66} y={y+g.height+.12} rise={.45}/>
        {GARAGE_GATES.map((gate,i)=><group key={i} position={[gate.x,y+1.335,gate.z+.18]}><Box size={[gate.width-.1,2.64,.08]} color="#817866"/>
          {Array.from({length:7},(_,j)=><Box key={j} at={[0,-1.15+j*.36,.05]} size={[gate.width-.16,.025,.025]} color="#b1a38d"/>)}
          <Box at={[0,1.22,.09]} size={[gate.width-.25,.08,.04]} color="#f2d8a9" emissive={lit*1.6}/>
        </group>)}
      </>}
      <Plate points={cellar} y={y} color="#b8ac99"/><Perimeter points={cellar} y={y} height={plan?.65:2.5} thickness={.27}/>
      {plan?[2.05,5].map(z=><Box key={z} at={[11.65,y+.55,z]} size={[3.65,1.1,.38]} color={M.wood}/>):<HipRoof x={11.65} z={3.52} width={4.85} depth={3.9} y={y+2.62} rise={.55}/>}
      <Plate points={[[7.77,4.1],[9.35,2.8],[9.35,4.1],[7.77,5.4]]} y={y} color={M.stone}/>
    </group>
    {plan&&GROUPS.filter(group=>group.floor===0).map(group=><RoomLight key={group.id} group={group} y={y} level={levels[group.id]} selected={group.id===selectedGroup} onSelect={onZoneSelect}/>)}
  </group>
}
function Tree({x,z,scale=1}) {
  return <group position={[x,0,z]} scale={scale}><mesh position={[0,1,0]} castShadow><cylinderGeometry args={[.12,.22,2,8]}/><meshStandardMaterial color="#85705a"/></mesh><mesh position={[0,2.8,0]} castShadow><icosahedronGeometry args={[1.3,2]}/><meshStandardMaterial color="#738267" roughness={1}/></mesh><mesh position={[.65,2.7,.2]} castShadow><icosahedronGeometry args={[.8,2]}/><meshStandardMaterial color="#62765a" roughness={1}/></mesh></group>
}
function Grounds({levels}) {
  return <group>
    <Box at={[6,-.43,7]} size={[68,.7,60]} color="#7c866d"/>
    <Plate points={[[-7.5,6.5],[-4,6.5],[-4,4.5],[6,4.5],[6,6.5],[19.5,6.5],[19.5,20.5],[20,20.5],[20,27.5],[12,27.5],[12,21.5],[-7.5,21.5]]} y={.02} depth={.09} color="#bdb4a1"/>
    {Array.from({length:19},(_,i)=><Box key={i} at={[-7.5+i*1.5,.023,14]} size={[.018,.006,15]} color="#aaa18d"/>)}
    {[-23,-19,33,37].flatMap((x,i)=>[-12,-4,5,15,26].map((z,j)=><Tree key={i+','+j} x={x} z={z} scale={.85+(i+j)%3*.12}/>))}
    {[-14,-8,-2,5,12,20,28].map((x,i)=><Tree key={i} x={x} z={-13} scale={.72}/>)}
    {[[-5,10],[-5,17],[4,19],[12,19],[19,22]].map(([x,z],i)=><group key={i}><Box at={[x,.37,z]} size={[.15,.74,.15]} color={M.metal}/><Box at={[x,.76,z]} size={[.17,.065,.17]} color="#e5c592" emissive={levels.driveway/100*2}/></group>)}
    <Box at={[6,.14,-10.6]} size={[46,.4,.55]} color="#b5aa95"/>
  </group>
}
function CameraRig({floor,view,resetKey,tour}) {
  const controls=useRef(null),{camera,size}=useThree(),destination=useRef(null)
  useEffect(()=>{
    const target=floor==='all'?[5,2.1,6]:floor==='0'?[24.3,.7,13.2]:floor==='3'?[-6.2,LEVELS[3],.1]:[-.1,LEVELS[floor],.1]
    const narrow=Math.max(1,1.5/(size.width/size.height)),base=floor==='all'?63:floor==='0'?40:floor==='3'?26:39,distance=base*narrow
    const direction=view==='top'?new THREE.Vector3(0,1,.001):view==='front'?new THREE.Vector3(0,.22,1):view==='back'?new THREE.Vector3(-.5,.4,-1):new THREE.Vector3(-.72,.66,1),to=new THREE.Vector3(...target)
    destination.current={pos:to.clone().add(direction.normalize().multiplyScalar(distance)),target:to,active:true}
  },[floor,view,resetKey,size.width,size.height])
  useFrame((_,delta)=>{
    if(!controls.current||!destination.current?.active)return
    const d=destination.current,alpha=1-Math.exp(-6*delta);camera.position.lerp(d.pos,alpha);controls.current.target.lerp(d.target,alpha);controls.current.update()
    if(camera.position.distanceTo(d.pos)<.02){camera.position.copy(d.pos);controls.current.target.copy(d.target);d.active=false}
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} minDistance={7} maxDistance={260} maxPolarAngle={Math.PI/2-.035} minPolarAngle={.001} autoRotate={tour} autoRotateSpeed={.4} onStart={()=>{if(destination.current)destination.current.active=false}}/>
}
export default function VillaCanvas({floor,levels,selectedGroup,onZoneSelect,phase,tour,view='perspective',resetKey,onCanvasReady}) {
  const night=phase==='night',dusk=phase==='dusk'
  return <Canvas shadows dpr={[1,1.7]} camera={{position:[42,33,54],fov:39,near:.1,far:300}} gl={{antialias:true,preserveDrawingBuffer:true,toneMapping:THREE.ACESFilmicToneMapping}} onCreated={({gl})=>onCanvasReady?.(gl.domElement)} onPointerMissed={()=>onZoneSelect(null)}>
    <color attach="background" args={[night?'#26373b':dusk?'#b3ab96':'#cbd8d3']}/><fog attach="fog" args={[night?'#26373b':dusk?'#b3ab96':'#cbd8d3',280,440]}/>
    <ambientLight intensity={night?.42:dusk?.85:1.2}/><hemisphereLight args={['#dce4e2','#847154',night?.55:1.25]}/>
    <directionalLight position={[-20,32,22]} intensity={night?.25:dusk?1.9:2.6} color={night?'#abc5d5':dusk?'#ffe1b5':'#fff6e1'} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-46} shadow-camera-right={46} shadow-camera-top={46} shadow-camera-bottom={-46} shadow-normalBias={.035} shadow-bias={-.0001}/>
    <Grounds levels={levels}/>
    {floor==='all'?<><House levels={levels}/><Garage levels={levels}/></>:floor==='0'?<Garage levels={levels} plan selectedGroup={selectedGroup} onZoneSelect={onZoneSelect}/>:<FloorPlan floor={Number(floor)} levels={levels} selectedGroup={selectedGroup} onZoneSelect={onZoneSelect}/>}
    <CameraRig floor={floor} view={view} resetKey={resetKey} tour={tour}/>
  </Canvas>
}
