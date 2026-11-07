import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, ContactShadows } from '@react-three/drei'
import { GROUPS } from '../data/villa.js'

const MAT = {
  plaster: '#ddd3bd', pale: '#f1e9d9', stone: '#a99e89', trim: '#f5edda',
  roof: '#776257', ridge: '#60554c', glass: '#51636a', metal: '#353e3e',
  wood: '#775e4b', lightWood: '#b49a77', grass: '#6b7966', path: '#b1aea3',
  gold: '#f1b976', furniture: '#e6ddd0',
}
const Y = { 0: 0.48, 1: 0.55, 2: 3.56, 3: 6.55 }

function Block({ position = [0,0,0], args = [1,1,1], color = MAT.pale, roughness = 0.82, metalness = 0, transparent = false, opacity = 1, castShadow = true, receiveShadow = true, onClick, onPointerOver, onPointerOut }) {
  return <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
    <boxGeometry args={args}/>
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={transparent} opacity={opacity} />
  </mesh>
}

function Roof({ x, z, w, d, y, rise = 1.22 }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-w/2-0.32, -0.1)
    s.lineTo(0, rise)
    s.lineTo(w/2+0.32, -0.1)
    s.lineTo(-w/2-0.32, -0.1)
    return new THREE.ExtrudeGeometry(s, { depth:d+0.6, bevelEnabled:false, steps:1 })
  }, [w,d,rise])
  useEffect(() => () => shape.dispose(), [shape])
  return <group>
    <mesh geometry={shape} position={[x,y,z-d/2-0.3]} castShadow receiveShadow>
      <meshStandardMaterial color={MAT.roof} roughness={0.93} flatShading/>
    </mesh>
    <Block position={[x,y+rise+.04,z]} args={[.12,.11,d+.85]} color={MAT.ridge}/>
    <Block position={[x-w/2-.15,y-.07,z]} args={[.15,.14,d+.78]} color={MAT.ridge}/>
    <Block position={[x+w/2+.15,y-.07,z]} args={[.15,.14,d+.78]} color={MAT.ridge}/>
    {Array.from({length:Math.max(3,Math.floor(d/1.8))},(_,i) => {
      const zz=z-d/2+0.65+(i*(d-1.3)/Math.max(1,Math.floor(d/1.8)-1))
      return <group key={i}>
        <Block position={[x-w/4,y+rise/2-.025,zz]} args={[w/2,.026,.06]} color="#8e7569" castShadow={false}/>
        <Block position={[x+w/4,y+rise/2-.025,zz]} args={[w/2,.026,.06]} color="#8e7569" castShadow={false}/>
      </group>
    })}
  </group>
}

function Window({ x, y, z, width = 1.55, height = 1.9, level = 0, side = 'front', shutter = true }) {
  const lit = level / 100
  const c = lit > .08 ? '#f7d9a3' : MAT.glass
  const isSide = side === 'side'
  return <group position={[x,y,z]} rotation={[0,isSide?Math.PI/2:0,0]}>
    <Block position={[0,0,-.01]} args={[width+.27,height+.29,.15]} color={MAT.trim}/>
    <mesh position={[0,0,.085]}><planeGeometry args={[width,height]}/><meshStandardMaterial color={c} emissive="#efad6a" emissiveIntensity={lit*1.9} metalness={0.28} roughness={0.22}/></mesh>
    <Block position={[0,0,.11]} args={[.065,height,.08]} color={MAT.metal}/>
    <Block position={[0,0,.11]} args={[width,.045,.08]} color={MAT.metal}/>
    <Block position={[-width/2-.085,0,.12]} args={[.095,height+.03,.09]} color="#b4a28b"/>
    <Block position={[width/2+.085,0,.12]} args={[.095,height+.03,.09]} color="#b4a28b"/>
    <Block position={[0,-height/2-.15,.12]} args={[width+.44,.11,.3]} color="#c6b9a3"/>
    {shutter && <>
      <Block position={[-width/2-.26,0,.1]} args={[.25,height-.1,.12]} color="#53635c"/>
      <Block position={[width/2+.26,0,.1]} args={[.25,height-.1,.12]} color="#53635c"/>
    </>}
  </group>
}

function FacadeLevel({ y, levels, upper = false }) {
  const left = upper ? 'master' : 'apartment'
  const middle = upper ? 'living' : 'office'
  const right = upper ? 'dining' : 'staff'
  return <group>
    {/* Front elevation facing the terrace and lake view */}
    {[-13.5,-10.7,-7.9].map((x,i)=><Window key={i} x={x} y={y+1.45} z={6.17} width={1.35} height={1.95} level={levels[left]}/>)}
    {upper ? (
      <>
        <Window x={8.25} y={y+1.45} z={6.19} width={1.35} height={1.95} level={levels[right]}/>
        <Window x={11.25} y={y+1.45} z={6.19} width={1.35} height={1.95} level={levels[right]}/>
        <Window x={13.12} y={y+1.45} z={6.19} width={1.2} height={1.95} level={levels[right]}/>
      </>
    ) : (
      <>
        <Window x={-2.55} y={y+1.42} z={1.71} width={1.35} height={1.98} level={levels[middle]}/>
        <Window x={.75} y={y+1.42} z={1.71} width={1.35} height={1.98} level={levels[middle]}/>
        <Window x={4.3} y={y+1.42} z={1.71} width={1.35} height={1.98} level={levels.entry}/>
        <Window x={8.6} y={y+1.45} z={6.19} width={1.35} height={1.95} level={levels[right]}/>
        <Window x={11.25} y={y+1.45} z={6.19} width={1.35} height={1.95} level={levels[right]}/>
      </>
    )}
    {/* Rear and right elevations */}
    {[-13,-9.5,-6.1].map((x,i)=><group key={'r'+i}><Window x={x} y={y+1.45} z={-6.23} width={1.4} height={1.75} level={levels[left]} shutter={false}/></group>)}
    {[-2.9,0.1,3.25].map((x,i)=><Window key={'m'+i} x={x} y={y+1.45} z={-6.27} width={1.43} height={1.75} level={levels[middle]} shutter={false}/>)}
    {[8.6,11.4,13].map((x,i)=><Window key={'e'+i} x={x} y={y+1.45} z={-6.25} width={1.25} height={1.75} level={levels[upper?'kitchen':'staff']} shutter={false}/>)}
    <Window x={14.43} y={y+1.48} z={-3.5} side width={1.45} level={levels[upper?'kitchen':'staff']}/>
    <Window x={14.43} y={y+1.48} z={3.2} side width={1.45} level={levels[right]}/>
  </group>
}

function Slab({ floor, showDetails = true }) {
  const y = Y[floor]
  return <group>
    <Block position={[-9.8,y-.17,0]} args={[10.9,.36,12.4]} color="#c7bbaa"/>
    <Block position={[-.3,y-.17,-2.25]} args={[10.5,.36,8.2]} color="#c7bbaa"/>
    <Block position={[10.55,y-.17,0]} args={[7.8,.36,12.5]} color="#c7bbaa"/>
    <Block position={[5.85,y-.17,-3.75]} args={[3.1,.36,2.5]} color="#c7bbaa"/>
    {showDetails && <>
      <Block position={[-9.8,y+.025,0]} args={[10.5,.06,12]} color={floor===2?'#d1c2ae':'#d7c8b3'}/>
      <Block position={[-.3,y+.025,-2.25]} args={[10.1,.06,7.8]} color={floor===2?'#d4c8b6':'#d6c9b8'}/>
      <Block position={[10.55,y+.025,0]} args={[7.4,.06,12.1]} color={floor===2?'#d7cec0':'#d9c9b4'}/>
    </>}
  </group>
}

function BuildingMassing({ levels }) {
  return <group>
    {[1,2].map(f => {
      const base=Y[f]-.02
      return <group key={f}>
        <Slab floor={f} showDetails={false}/>
        <Block position={[-9.8,base+1.44,0]} args={[10.65,2.85,12.05]} color={MAT.plaster}/>
        <Block position={[-.3,base+1.44,-2.25]} args={[10.25,2.85,7.85]} color={MAT.plaster}/>
        <Block position={[10.55,base+1.44,0]} args={[7.55,2.85,12.1]} color={MAT.plaster}/>
        <Block position={[5.8,base+1.44,-3.75]} args={[3.15,2.85,2.6]} color={MAT.plaster}/>
        <FacadeLevel y={base} levels={levels} upper={f===2}/>
        {/* Fine stone belt courses and vertical pilasters */}
        {[-14.98,-4.63,6.76,14.36].map((x,i)=><Block key={i} position={[x,base+1.5,3.8]} args={[.23,2.8,.37]} color="#efe6d4"/>)}
        <Block position={[-9.8,base+2.93,0]} args={[10.95,.19,12.4]} color="#f2e7d5"/>
        <Block position={[-.3,base+2.93,-2.25]} args={[10.58,.18,8.15]} color="#f2e7d5"/>
        <Block position={[10.55,base+2.93,0]} args={[7.94,.19,12.5]} color="#f2e7d5"/>
      </group>
    })}
    {/* Third-storey L-shaped roof mass, reflecting A-21's reduced footprint */}
    <SlabThird/>
    <Block position={[-10.65,7.95,-2.52]} args={[8.2,2.85,7.5]} color={MAT.plaster}/>
    <Block position={[-12.55,7.95,2.22]} args={[4.38,2.85,3.1]} color={MAT.plaster}/>
    {[-12.65,-9.5,-7.0].map((x,i)=><Window key={i} x={x} y={8.08} z={-6.32} width={1.26} height={1.55} level={levels.upperBedroom}/>)}
    <Window x={-12.55} y={8.1} z={3.82} width={1.4} height={1.65} level={levels.playroom}/>
    <Window x={-14.83} y={8.1} z={2.1} side width={1.2} height={1.55} level={levels.playroom}/>
    <Block position={[-10.65,9.4,-2.52]} args={[8.5,.17,7.8]} color={MAT.trim}/>
    <Roof x={-10.65} z={-2.52} w={8.7} d={7.85} y={9.42} rise={1.45}/>
    <Roof x={-12.5} z={2.2} w={4.5} d={3.3} y={9.42} rise={.97}/>
    <Roof x={-9.78} z={4.62} w={10.95} d={3.15} y={6.51} rise={.75}/>
    <Roof x={-.25} z={-2.25} w={10.5} d={8.35} y={6.51} rise={1.22}/>
    <Roof x={10.6} z={0} w={8} d={12.56} y={6.51} rise={1.3}/>
    <Block position={[2.2,7.32,-3.7]} args={[.8,1.15,.86]} color="#e4d8c6"/>
    <Block position={[2.2,7.95,-3.7]} args={[1.1,.17,1.12]} color={MAT.ridge}/>
    <Block position={[12.4,7.36,-1.8]} args={[.84,1.2,.82]} color="#e4d8c6"/>
    <Block position={[12.4,8.02,-1.8]} args={[1.08,.16,1.08]} color={MAT.ridge}/>
    <Terrace levels={levels} exterior/>
    <ExteriorStairs/>
  </group>
}

function SlabThird() {
  return <group>
    <Block position={[-10.65,Y[3]-.21,-2.52]} args={[8.5,.42,7.84]} color="#c4b7a6"/>
    <Block position={[-12.5,Y[3]-.21,2.2]} args={[4.5,.42,3.3]} color="#c4b7a6"/>
  </group>
}

function RailLine({ x=0, z=0, length=2, direction='x', y=3.75 }) {
  const alongX=direction==='x'
  return <group>
    <Block position={[x,y+.46,z]} args={alongX?[length,.065,.075]:[.075,.065,length]} color="#42494a"/>
    <Block position={[x,y+.08,z]} args={alongX?[length,.56,.05]:[.05,.56,length]} color="#7b9294" transparent opacity={.22} castShadow={false}/>
    {Array.from({length:Math.ceil(length/1.7)+1},(_,i)=>{
      const offset=-length/2 + i*length/Math.ceil(length/1.7)
      return <Block key={i} position={[x+(alongX?offset:0),y+.2,z+(alongX?0:offset)]} args={[.07,.66,.07]} color="#44494a"/>
    })}
  </group>
}

function Terrace({ levels, exterior = false }) {
  const lit=(levels.terrace || 0)/100
  const y=Y[2]
  return <group>
    <Block position={[.25,y-.18,3.95]} args={[10.5,.35,4.3]} color="#b6a58e"/>
    <Block position={[.25,y+.035,3.95]} args={[10.1,.08,4]} color="#c2b096"/>
    {Array.from({length:16},(_,i)=><Block key={i} position={[-4.65+i*.65,y+.08,3.95]} args={[.025,.015,4]} color="#aa957d" castShadow={false}/>)}
    <RailLine x={.25} z={6.14} y={y} length={10.7}/>
    <RailLine x={-5.08} z={4.05} y={y} length={4.1} direction="z"/>
    <RailLine x={5.6} z={4.05} y={y} length={4.1} direction="z"/>
    <OutdoorLounge x={-.65} z={4.1} y={y+.2}/>
    <PottedPlant x={-4.4} z={5.5} y={y+.14} scale={1}/>
    <PottedPlant x={4.95} z={5.5} y={y+.14} scale={1}/>
    {[[-4.6,5.8],[0,5.85],[4.6,5.8]].map(([x,z],i)=><group key={i}>
      <mesh position={[x,y+.65,z]}><sphereGeometry args={[.1,10,8]}/><meshStandardMaterial color="#f7d3a0" emissive="#ffb75c" emissiveIntensity={lit*3}/></mesh>
      {lit>.05 && <pointLight position={[x,y+.8,z]} color="#ffbd73" intensity={lit*.95} distance={4}/>}
    </group>)}
  </group>
}

function ExteriorStairs() {
  return <group>
    {Array.from({length:6},(_,i)=><Block key={i} position={[5.45,.23+i*.09,8.6-i*.48]} args={[3.3,.22,1.05]} color={i%2?'#beb3a2':'#c9bdab'}/>)}
    <Block position={[5.45,.08,7.3]} args={[3.55,.16,2.25]} color="#b1a99c"/>
  </group>
}

function PottedPlant({ x, z, y, scale = 1 }) {
  return <group position={[x,y,z]} scale={scale}>
    <mesh position={[0,.32,0]} castShadow><cylinderGeometry args={[.33,.24,.65,10]}/><meshStandardMaterial color="#b49b7e" roughness={1}/></mesh>
    <mesh position={[0,.98,0]} castShadow><sphereGeometry args={[.47,10,9]}/><meshStandardMaterial color="#496e55" roughness={1}/></mesh>
    <mesh position={[.23,1.2,.04]} castShadow><sphereGeometry args={[.3,9,9]}/><meshStandardMaterial color="#62795c" roughness={1}/></mesh>
  </group>
}

function OutdoorLounge({ x, z, y }) {
  return <group position={[x,y,z]}>
    <Block position={[-1.15,.18,-.8]} args={[2.7,.32,.85]} color="#b6afa2"/>
    <Block position={[-1.15,.43,-1.14]} args={[2.7,.6,.18]} color="#ebe3d7"/>
    <Block position={[-1.15,.34,-.8]} args={[2.36,.12,.63]} color="#eee8dc"/>
    <Block position={[1.32,.18,.75]} args={[1.45,.33,.8]} color="#c3b9aa"/>
    <Block position={[1.32,.42,1.12]} args={[1.45,.55,.16]} color="#e7e2d9"/>
    <mesh position={[0,.32,.45]} castShadow><cylinderGeometry args={[.58,.58,.09,22]}/><meshStandardMaterial color="#695c50"/></mesh>
    <Block position={[0,.16,.45]} args={[.11,.27,.11]} color="#463f38"/>
  </group>
}

function StoneFloor({ x,z,w,d,y,color = '#d6c8b8' }) {
  return <Block position={[x,y+.06,z]} args={[w,.11,d]} color={color}/>
}
function LowWall({x,z,w=.14,d=.14,y=0.5,h=.75}) {
  return <Block position={[x,y+h/2,z]} args={[w,h,d]} color="#eee5d7"/>
}

function Sofa({x,z,y,rot=0,color='#ded6cb',scale=1}) {
  return <group position={[x,y,z]} rotation={[0,rot,0]} scale={scale}>
    <Block position={[0,.32,0]} args={[2.25,.38,.92]} color={color}/>
    <Block position={[0,.57,-.38]} args={[2.25,.62,.18]} color={color}/>
    <Block position={[-1.05,.43,0]} args={[.24,.45,.96]} color={color}/>
    <Block position={[1.05,.43,0]} args={[.24,.45,.96]} color={color}/>
    {[-.55,.55].map((a,i)=><Block key={i} position={[a,.54,.03]} args={[.83,.16,.68]} color="#f5eee4"/>)}
  </group>
}
function Bed({x,z,y,rot=0,scale=1}) {
  return <group position={[x,y,z]} rotation={[0,rot,0]} scale={scale}>
    <Block position={[0,.26,0]} args={[2.1,.4,2.6]} color="#8f7763"/>
    <Block position={[0,.54,.05]} args={[1.94,.24,2.34]} color="#f4ede3"/>
    <Block position={[0,.75,-1.23]} args={[2.25,1.05,.18]} color="#b7a28d"/>
    <Block position={[-.52,.68,-.72]} args={[.76,.16,.44]} color="#d8d7d1"/>
    <Block position={[.52,.68,-.72]} args={[.76,.16,.44]} color="#d8d7d1"/>
    <Block position={[0,.67,.54]} args={[1.8,.04,1.0]} color="#c6b6a4"/>
  </group>
}
function DiningTable({x,z,y,rot=0,scale=1}) {
  return <group position={[x,y,z]} rotation={[0,rot,0]} scale={scale}>
    <mesh position={[0,.74,0]} castShadow><boxGeometry args={[1.5,.12,3.1]}/><meshStandardMaterial color="#856c57" roughness={.54}/></mesh>
    {[-.53,.53].flatMap(xx=>[-1.17,1.17].map(zz=><Block key={xx+','+zz} position={[xx,.34,zz]} args={[.1,.67,.1]} color="#615448"/>))}
    {[-1.95,1.95].map((xx,i)=><group key={i}><Block position={[xx*.57,.41,0]} args={[.55,.17,.58]} color="#d8ccbd"/><Block position={[xx*.57,.74,-.27]} args={[.55,.6,.12]} color="#c7baa8"/></group>)}
    {[-.95,0,.95].map((zz,i)=><group key={i}>
      <Block position={[-1.02,.41,zz]} args={[.62,.17,.53]} color="#d8ccbd"/>
      <Block position={[-1.26,.72,zz]} args={[.14,.58,.53]} color="#c7baa8"/>
      <Block position={[1.02,.41,zz]} args={[.62,.17,.53]} color="#d8ccbd"/>
      <Block position={[1.26,.72,zz]} args={[.14,.58,.53]} color="#c7baa8"/>
    </group>)}
  </group>
}
function KitchenCounter({x,z,y,rot=0}) {
  return <group position={[x,y,z]} rotation={[0,rot,0]}>
    <Block position={[0,.42,0]} args={[3.75,.84,.67]} color="#ae977d"/>
    <Block position={[0,.89,0]} args={[3.9,.11,.77]} color="#e7e1d8"/>
    <Block position={[1.25,.94,0]} args={[.58,.02,.38]} color="#292e2e"/>
    {[-.25,.65].map((xx,i)=><mesh key={i} position={[xx,.965,-.08]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.14,.014,8,20]}/><meshStandardMaterial color="#484d49"/></mesh>)}
    <Block position={[-.65,.42,1.55]} args={[2.5,.84,.9]} color="#98816b"/>
    <Block position={[-.65,.9,1.55]} args={[2.65,.09,1.04]} color="#dfd4c6"/>
  </group>
}
function Desk({x,z,y,rot=0}) {
  return <group position={[x,y,z]} rotation={[0,rot,0]}>
    <Block position={[0,.74,0]} args={[2.15,.12,.93]} color="#7f6c58"/>
    <Block position={[-.86,.34,0]} args={[.12,.7,.82]} color="#635c51"/>
    <Block position={[.86,.34,0]} args={[.12,.7,.82]} color="#635c51"/>
    <Block position={[0,.85,-.15]} args={[.62,.4,.06]} color="#3c474a"/>
    <Block position={[0,.49,.99]} args={[.64,.12,.64]} color="#b4aa9c"/>
  </group>
}
function Tree({x,z,scale=1,leaf='#59715d'}) {
  return <group position={[x,0,z]} scale={scale}>
    <mesh position={[0,1.3,0]} castShadow><cylinderGeometry args={[.15,.25,2.7,8]}/><meshStandardMaterial color="#74624d" roughness={1}/></mesh>
    <mesh position={[0,3.17,0]} castShadow><sphereGeometry args={[1.26,13,11]}/><meshStandardMaterial color={leaf} roughness={1}/></mesh>
    <mesh position={[-.6,2.88,.2]} castShadow><sphereGeometry args={[.88,12,9]}/><meshStandardMaterial color="#70836a" roughness={1}/></mesh>
    <mesh position={[.52,3.3,-.15]} castShadow><sphereGeometry args={[.94,12,9]}/><meshStandardMaterial color={leaf} roughness={1}/></mesh>
  </group>
}
function Cypress({x,z,s=1}) {
  return <group position={[x,0,z]} scale={s}>
    <mesh position={[0,1.35,0]} castShadow><cylinderGeometry args={[.14,.18,2.65,8]}/><meshStandardMaterial color="#5c5244"/></mesh>
    <mesh position={[0,3.05,0]} castShadow><coneGeometry args={[.73,4.1,9]}/><meshStandardMaterial color="#3e604a" roughness={1}/></mesh>
    <mesh position={[0,4.2,0]} castShadow><coneGeometry args={[.46,2.15,9]}/><meshStandardMaterial color="#496c50" roughness={1}/></mesh>
  </group>
}

function Grounds({ levels, phase }) {
  const lit=(levels.driveway||0)/100
  return <group>
    <Block position={[0,-.38,2.5]} args={[60,.66,51]} color={MAT.grass} receiveShadow/>
    <Block position={[-11.5,.006,18.3]} args={[14,.1,17]} color="#aaa99d"/>
    <Block position={[-1.4,.019,11.3]} args={[14,.1,3.5]} color="#b7b2a5"/>
    <Block position={[5.4,.01,7.9]} args={[3.7,.1,8.0]} color="#b7b2a5"/>
    <Block position={[.4,-.006,-12.6]} args={[59,.07,5]} color="#909b93"/>
    <mesh position={[0,-.2,-25]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[90,11]}/><meshStandardMaterial color={phase==='night'?'#263f47':'#7d9aa0'} roughness={.32} metalness={.15}/></mesh>
    {Array.from({length:11},(_,i)=><Block key={i} position={[-19+i*1.55,.08,18.3]} args={[.055,.02,17]} color="#c4c3b8" castShadow={false}/>)}
    {[-23,-19,18,23].flatMap((x,i)=>[-10,-3,8,18].map((z,j)=><Tree key={i+'_'+j} x={x+(j%2)*.7} z={z} scale={.9+(i%3)*.15} leaf={i%2?'#536c53':'#6b8065'}/>))}
    {[[-18,4],[-18,-5],[18,5],[18,-3],[22,14],[-21,17]].map(([x,z],i)=><Cypress key={i} x={x} z={z} s={.85+(i%3)*.16}/>)}
    {[[-5.8,8.3],[-2.4,8.3],[1,8.3],[4.4,8.3],[8.3,7.8]].map(([x,z],i)=><group key={i}>
      <mesh position={[x,.48,z]} castShadow><cylinderGeometry args={[.12,.22,.95,9]}/><meshStandardMaterial color="#4b4944"/></mesh>
      <mesh position={[x,1.01,z]}><sphereGeometry args={[.18,12,10]}/><meshStandardMaterial color="#f4bc77" emissive="#ffb766" emissiveIntensity={lit*2.7}/></mesh>
      {lit>.05 && <pointLight position={[x,1.15,z]} color="#ffc287" intensity={lit*.7} distance={3}/>}
    </group>)}
    {Array.from({length:15},(_,i)=><group key={i}>
      <mesh position={[(-18+i*2.7),.2,-9.4]} castShadow><sphereGeometry args={[.63,11,8]}/><meshStandardMaterial color={i%2?'#7c8d65':'#58765b'}/></mesh>
    </group>)}
    <Block position={[0,.08,-10.25]} args={[41,.22,.65]} color="#d7cfc0"/>
  </group>
}
function Car({x,z,y,rot=0,color='#4a585b'}) {
  return <group position={[x,y,z]} rotation={[0,rot,0]}>
    <Block position={[0,.47,0]} args={[1.65,.45,3.4]} color={color}/>
    <Block position={[0,.79,-.2]} args={[1.4,.52,1.72]} color="#364548" roughness={.24} metalness={.33}/>
    {[-.85,.85].flatMap(xx=>[-1.1,1.15].map(zz=><mesh key={xx+'_'+zz} position={[xx,.33,zz]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.34,.34,.18,16]}/><meshStandardMaterial color="#242b2b"/></mesh>))}
    {[-.53,.53].map((xx,i)=><Block key={i} position={[xx,.54,1.7]} args={[.29,.14,.06]} color="#f4ddba"/>)}
  </group>
}
function Garage({levels, plan=false}) {
  const y=Y[0], light=(levels.garage||0)/100
  return <group>
    <Block position={[-12,y-.17,13.85]} args={[12.6,.37,8.25]} color="#bdb3a4"/>
    <Block position={[-12,y-.02,13.85]} args={[12.16,.06,7.9]} color="#a99c8c"/>
    {plan ? <>
      <LowWall x={-18.3} z={13.85} w={.25} d={8.2} y={y}/>
      <LowWall x={-5.7} z={13.85} w={.25} d={8.2} y={y}/>
      <LowWall x={-12} z={9.8} w={12.5} d={.22} y={y}/>
      <LowWall x={-12} z={17.9} w={12.5} d={.22} y={y}/>
      <StoneFloor x={-12} z={13.8} w={12} d={7.5} y={y} color="#b6b0a4"/>
      <Car x={-15.7} z={14} y={y+.05} rot={0} color="#7f8a8c"/>
      <Car x={-11.2} z={13.8} y={y+.05} rot={0} color="#6c6260"/>
      <Desk x={-7.3} z={11.4} y={y+.05}/>
      {[-16,-12,-8].map((x,i)=><Block key={i} position={[x,y+.02,16]} args={[.1,.03,2.8]} color="#e1d9ca"/>)}
    </> : <>
      <Block position={[-12,y+1.38,13.85]} args={[12.35,2.85,8.05]} color={MAT.plaster}/>
      <Block position={[-12,y+2.88,13.85]} args={[12.75,.23,8.48]} color={MAT.trim}/>
      <Roof x={-12} z={13.85} w={12.85} d={8.5} y={y+2.96} rise={1.3}/>
      {[-16,-12,-8].map((x,i)=><group key={i}>
        <Block position={[x,y+1.38,17.94]} args={[3.46,2.27,.11]} color="#756e65"/>
        {Array.from({length:6},(_,j)=><Block key={j} position={[x,y+.31+j*.37,18.02]} args={[3.31,.038,.09]} color="#a79b8a"/>)}
        <mesh position={[x,y+2.47,18.04]}><boxGeometry args={[2.9,.2,.06]}/><meshStandardMaterial color="#d5bea0" emissive="#f7ad58" emissiveIntensity={light*1.9}/></mesh>
      </group>)}
      <Window x={-7.1} y={y+1.5} z={9.76} level={light*100} width={1.3} height={1.65} shutter={false}/>
    </>}
    {plan && <group position={[-12,y+.09,13.85]}>
      <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[5.3,48]}/><meshBasicMaterial color="#efbf83" transparent opacity={light*.18} depthWrite={false}/></mesh>
    </group>}
    <Block position={[-3.35,y-.17,13.8]} args={[3,.37,3.35]} color="#b8aa99"/>
    {!plan && <><Block position={[-3.35,y+1.28,13.8]} args={[2.9,2.6,3.3]} color={MAT.plaster}/><Roof x={-3.35} z={13.8} w={3.3} d={3.7} y={y+2.6} rise={.6}/></>}
  </group>
}

const ROOMS = [
  {id:'apartment',floor:1,x:-9.8,z:0,w:10.5,d:11.9,color:'#d1c3af'},
  {id:'office',floor:1,x:-.4,z:-2.3,w:9.8,d:7.5,color:'#c7b6a1'},
  {id:'entry',floor:1,x:4.35,z:1.3,w:2.8,d:5.7,color:'#ddd2bf'},
  {id:'staff',floor:1,x:10.5,z:0,w:7.2,d:12,color:'#cdbfad'},
  {id:'guests',floor:2,x:-9.8,z:-3.7,w:10.4,d:4.8,color:'#d5c8b8'},
  {id:'master',floor:2,x:-9.8,z:2.55,w:10.4,d:6.4,color:'#d7cabb'},
  {id:'living',floor:2,x:-.3,z:-2.25,w:10.1,d:7.65,color:'#d5cbbd'},
  {id:'kitchen',floor:2,x:10.55,z:-3.45,w:7.3,d:5.1,color:'#d7cbba'},
  {id:'dining',floor:2,x:10.55,z:2.55,w:7.3,d:6.75,color:'#d1c4b3'},
  {id:'playroom',floor:3,x:-12.5,z:1.4,w:4.2,d:4.6,color:'#d6cab7'},
  {id:'upperBedroom',floor:3,x:-9.8,z:-2.9,w:7.8,d:6.6,color:'#d3c5b3'},
]

function InteriorFurniture({floor,y}) {
  return <group>
    {floor===1 && <>
      <Sofa x={-11} z={.9} y={y+.05} rot={-Math.PI/2}/>
      <DiningTable x={-11.8} z={3.7} y={y+.04} scale={.68}/>
      <Bed x={-8.2} z={-3.6} y={y+.02} rot={Math.PI/2} scale={.85}/>
      <Desk x={-.45} z={-2.6} y={y+.03}/>
      <Sofa x={2.15} z={-.1} y={y+.02} scale={.8}/>
      <PottedPlant x={4.55} z={.7} y={y+.02} scale={.62}/>
      <Bed x={11.7} z={-4} y={y+.02} scale={.7}/>
      <DiningTable x={11} z={2.5} y={y+.02} scale={.62}/>
    </>}
    {floor===2 && <>
      <Bed x={-8.5} z={3.4} y={y+.03} rot={Math.PI/2} scale={.9}/>
      <Bed x={-12.1} z={-3.9} y={y+.03} rot={Math.PI/2} scale={.76}/>
      <Bed x={-7.25} z={-3.9} y={y+.03} rot={Math.PI/2} scale={.78}/>
      <Sofa x={.5} z={-2.4} y={y+.03} rot={0} scale={1.18}/>
      <Sofa x={3.2} z={-.75} y={y+.03} rot={Math.PI/2} scale={.75}/>
      <mesh position={[1.25,y+.43,-.65]} castShadow><cylinderGeometry args={[.68,.68,.1,20]}/><meshStandardMaterial color="#846d56"/></mesh>
      <KitchenCounter x={10.6} z={-3.1} y={y+.03} rot={Math.PI/2}/>
      <DiningTable x={11.1} z={3.3} y={y+.03} scale={.9}/>
      <PottedPlant x={4.5} z={-5.3} y={y+.01} scale={.68}/>
      <SpiralStairs x={6.85} z={-2.5} y={y+.02}/>
    </>}
    {floor===3 && <>
      <Bed x={-8.75} z={-3.5} y={y+.03} scale={.83}/>
      <Desk x={-12.4} z={1.8} y={y+.03} rot={Math.PI/2}/>
      <Sofa x={-11.4} z={3.1} y={y+.03} scale={.65}/>
      <PottedPlant x={-6.1} z={-.7} y={y+.03} scale={.52}/>
    </>}
  </group>
}

function SpiralStairs({x,z,y}) {
  return <group position={[x,y,z]}>
    <mesh position={[0,.9,0]} castShadow><cylinderGeometry args={[.12,.12,1.8,12]}/><meshStandardMaterial color="#645c54"/></mesh>
    {Array.from({length:15},(_,i)=><group key={i} rotation={[0,i*2*Math.PI/15,0]}>
      <Block position={[.74,.15+i*.09,0]} args={[1.3,.095,.55]} color={i%2?'#d1bda4':'#c5ac8c'}/>
    </group>)}
  </group>
}

function RoomOutline({room, y}) {
  const {x,z,w,d}=room
  return <group>
    <StoneFloor x={x} z={z} w={w} d={d} y={y} color={room.color}/>
    <LowWall x={x-w/2} z={z} w={.19} d={d} y={y}/>
    <LowWall x={x+w/2} z={z} w={.19} d={d} y={y}/>
    <LowWall x={x} z={z-d/2} w={w} d={.19} y={y}/>
    <LowWall x={x} z={z+d/2} w={w} d={.19} y={y}/>
  </group>
}

function RoomLight({group,level,y,active,onSelect}) {
  const lit=(level||0)/100, selected=active
  const color=group.kind==='outdoor'?'#f9b571':'#ffd5a1'
  return <group position={[group.x,y+.20,group.z]}>
    <mesh rotation={[-Math.PI/2,0,0]} onClick={e=>{e.stopPropagation();onSelect(group.id)}} onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer'}} onPointerOut={()=>document.body.style.cursor='auto'}>
      <circleGeometry args={[group.radius*.82,48]}/>
      <meshBasicMaterial color={color} transparent opacity={.06+lit*.22+(selected?.10:0)} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]} onClick={e=>{e.stopPropagation();onSelect(group.id)}} onPointerOver={()=>document.body.style.cursor='pointer'} onPointerOut={()=>document.body.style.cursor='auto'}>
      <ringGeometry args={[group.radius*.82-.055,group.radius*.82,48]}/>
      <meshBasicMaterial color={selected?'#f0a257':'#f6e4bc'} transparent opacity={selected?.94:.29} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <mesh position={[0,.22,0]} onClick={e=>{e.stopPropagation();onSelect(group.id)}} onPointerOver={()=>document.body.style.cursor='pointer'} onPointerOut={()=>document.body.style.cursor='auto'}>
      <sphereGeometry args={[selected?.24:.15,16,12]}/>
      <meshStandardMaterial color={level>0?'#f8d29b':'#d2cbc0'} emissive="#ffaf52" emissiveIntensity={lit*4+(selected?.45:0)}/>
    </mesh>
    {lit>.05 && <pointLight position={[0,1.0,0]} color="#ffd09c" intensity={lit*2} distance={group.radius*2.5} decay={2}/>}
    <Html position={[0,.7,0]} center distanceFactor={14} style={{pointerEvents:'none',whiteSpace:'nowrap'}}>
      <div className={'model-room-label'+(selected?' is-active':'')}>
        <span className="model-room-light" style={{opacity:Math.max(.32,lit)}}/>
        <span>{group.room}</span><b>{level}%</b>
      </div>
    </Html>
  </group>
}

function PlanView({floor,levels,selectedGroup,onZoneSelect}) {
  const y=Y[floor]
  return <group>
    {floor===3 ? <SlabThird/> : <Slab floor={floor}/>}
    {ROOMS.filter(r=>r.floor===floor).map(r=><RoomOutline key={r.id} room={r} y={y}/>)}
    <InteriorFurniture floor={floor} y={y}/>
    {floor===2 && <Terrace levels={levels}/>}
    {GROUPS.filter(g=>g.floor===floor).map(g=><RoomLight key={g.id} group={g} y={y} level={levels[g.id]} active={g.id===selectedGroup} onSelect={onZoneSelect}/>)}
  </group>
}

function CameraRig({floor,resetKey,tour}) {
  const controls=useRef(null)
  const {camera}=useThree()
  const destination=useRef({pos:new THREE.Vector3(31,22,31),target:new THREE.Vector3(-1,3,2),active:true})
  useEffect(()=>{
    const newPose= floor==='all'
      ? {pos:[31,22,31],target:[-1,3,2]}
      : floor==='0'
        ? {pos:[6,18,30],target:[-12,0,14]}
        : {pos:[17,22,17],target:[floor==='3'?-10:0,Y[floor],0]}
    destination.current={pos:new THREE.Vector3(...newPose.pos),target:new THREE.Vector3(...newPose.target),active:true}
  },[floor,resetKey])
  useFrame(()=>{
    if (!controls.current || !destination.current.active) return
    camera.position.lerp(destination.current.pos,.085)
    controls.current.target.lerp(destination.current.target,.085)
    controls.current.update()
    if(camera.position.distanceTo(destination.current.pos)<.1 && controls.current.target.distanceTo(destination.current.target)<.1){
      destination.current.active=false
    }
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.07} enablePan minDistance={7} maxDistance={74} maxPolarAngle={Math.PI/2.04} minPolarAngle={.12} autoRotate={tour} autoRotateSpeed={.42}/>
}

export default function VillaCanvas({floor,levels,selectedGroup,onZoneSelect,phase,tour,resetKey,onCanvasReady}) {
  const isAll=floor==='all'
  const isGarage=floor==='0'
  const night=phase==='night', dusk=phase==='dusk'
  const sun=night ? .2 : dusk ? 1.15 : 2.1
  return <Canvas
    shadows
    dpr={[1,1.6]}
    camera={{position:[31,22,31],fov:42,near:.1,far:220}}
    gl={{antialias:true,preserveDrawingBuffer:true,alpha:false,toneMapping:THREE.ACESFilmicToneMapping}}
    onCreated={({gl})=>onCanvasReady?.(gl.domElement)}
    onPointerMissed={()=>{if (!isAll && !isGarage) onZoneSelect(null)}}
  >
    <color attach="background" args={[night?'#17242a':dusk?'#b9a58e':'#c8d9d5']}/>
    <fog attach="fog" args={[night?'#17242a':dusk?'#b9a58e':'#c8d9d5',60,125]}/>
    <ambientLight intensity={night?.67:dusk?.95:1.25}/>
    <hemisphereLight args={['#d4e0e0','#7d715a',night?.57:1.1]}/>
    <directionalLight
      position={[-18,27,15]} intensity={sun} color={night?'#8cabc7':dusk?'#f8c394':'#fff2d9'}
      castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-35} shadow-camera-right={35}
      shadow-camera-top={35} shadow-camera-bottom={-35} shadow-bias={-.00024}
    />
    {night && <pointLight position={[2,11,8]} color="#eac393" intensity={13} distance={37}/>}
    <Grounds levels={levels} phase={phase}/>
    {isAll && <BuildingMassing levels={levels}/>}
    {isAll && <Garage levels={levels}/>}
    {!isAll && !isGarage && <PlanView floor={Number(floor)} levels={levels} selectedGroup={selectedGroup} onZoneSelect={onZoneSelect}/>}
    {isGarage && <group>
      <Garage levels={levels} plan/>
      {GROUPS.filter(g=>g.floor===0).map(g=><RoomLight key={g.id} group={g} y={Y[0]} level={levels[g.id]} active={g.id===selectedGroup} onSelect={onZoneSelect}/>)}
    </group>}
    <ContactShadows opacity={.25} scale={50} blur={2.8} far={25} position={[0,-.015,2]} color="#32332f"/>
    <CameraRig floor={floor} resetKey={resetKey} tour={tour}/>
  </Canvas>
}
