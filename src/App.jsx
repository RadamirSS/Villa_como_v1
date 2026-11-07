import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight, ArrowLeftRight, ArrowUpRight, Camera, Check, ChevronDown,
  ChevronRight, CircleHelp, Clapperboard, Compass, Expand, House, Layers3,
  Lightbulb, Menu, Moon, MousePointer2, Pause, Play, Power, RotateCcw,
  SlidersHorizontal, Sparkles, Sun, Sunrise, Sunset, UtensilsCrossed, X,
  ZoomIn, CarFront, Building2, MapPin, ChevronUp, ShieldCheck,
  FileCheck2, DraftingCompass, WandSparkles,
} from 'lucide-react'
import VillaCanvas from './components/VillaCanvas.jsx'
import { FLOORS, FLOOR_AREAS, GROUPS, SCENARIOS, getFloorName, getLevels, getSourceConfidence } from './data/villa.js'

const SCENE_ICONS = {Sunrise,Sunset,UtensilsCrossed,Clapperboard,Moon,Lightbulb,Power}
const PHASES = [
  { id:'day', label:'День', icon:Sun },
  { id:'dusk', label:'Сумерки', icon:Sunset },
  { id:'night', label:'Ночь', icon:Moon },
]
const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU')

function Logo({compact=false}) {
  return <div className={'logo-sign '+(compact?'logo-sign--compact':'')} aria-hidden="true">
    <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
      <path d="M7 17.5 22 8l15 9.5M11 21v15h22V21M18 36V22h8v14" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="22" cy="16" r="1.8" fill="currentColor"/>
    </svg>
  </div>
}

function ScenarioItem({scenario,active,onClick}) {
  const Icon=SCENE_ICONS[scenario.icon]||Lightbulb
  return <button type="button" className={'scenario-item '+(active?'scenario-item--active':'')} onClick={onClick} aria-pressed={active}>
    <span className="scenario-icon"><Icon size={20} strokeWidth={1.55}/></span>
    <span className="scenario-copy"><strong>{scenario.name}</strong><small>{scenario.sub}</small></span>
    <span className="scenario-state">{active?<span className="scene-check"><Check size={14}/></span>:<ChevronRight size={17}/>}</span>
  </button>
}

function LevelControl({group,level,onChange,onFocus,selected}) {
  const confidence=getSourceConfidence(group)
  return <div className={'level-control '+(selected?'level-control--selected':'')}>
    <div className="level-head">
      <button className="level-name" type="button" onClick={onFocus} title={'Показать на модели: '+group.room}>
        <span className="level-indicator" style={{opacity:level>0?1:.3}}/>
        <span>{group.label}</span>
        <ArrowUpRight size={13}/>
      </button>
      <span className="level-percent">{level}<small>%</small></span>
    </div>
    <input className="level-range" type="range" min="0" max="100" step="1" value={level}
      style={{'--level':level+'%'}}
      aria-label={'Яркость: '+group.label}
      onChange={e=>onChange(group.id,Number(e.target.value))}
    />
    <div className="level-caption"><span>{group.ref}</span><span>{level===0?'Выкл':level===100?'Максимум':'Диммирование'}</span></div>
    <span className={'source-chip source-chip--'+confidence.id} title={confidence.detail}>{confidence.label}</span>
  </div>
}

function DisplaySelect({floor,onChange}) {
  return <div className="floor-selector" role="group" aria-label="Выбор уровня здания">
    {FLOORS.map(item=><button key={item.id} type="button" className={'floor-pill '+(item.id===floor?'floor-pill--active':'')} onClick={()=>onChange(item.id)} aria-pressed={item.id===floor}>
      {item.id==='all'?<Building2 size={14}/>:item.id==='0'?<CarFront size={14}/>:<span className="floor-digit">{item.id}</span>}
      <span>{item.short}</span>
    </button>)}
  </div>
}

export default function App() {
  const [scenarioId,setScenarioId]=useState('evening')
  const [floor,setFloor]=useState('all')
  const [view,setView]=useState('perspective')
  const [phase,setPhase]=useState('dusk')
  const [overrides,setOverrides]=useState({})
  const [selectedGroup,setSelectedGroup]=useState(null)
  const [allGroups,setAllGroups]=useState(false)
  const [tour,setTour]=useState(false)
  const [resetKey,setResetKey]=useState(0)
  const [mobilePanel,setMobilePanel]=useState(false)
  const [showLegend,setShowLegend]=useState(false)
  const stageRef=useRef(null)
  const canvasRef=useRef(null)
  const controlsRef=useRef(null)
  const groupSectionRef=useRef(null)
  const tourStep=useRef(0)
  const levels=useMemo(()=>getLevels(scenarioId,overrides),[scenarioId,overrides])
  const scenario=SCENARIOS.find(s=>s.id===scenarioId)||SCENARIOS[0]
  const selected=GROUPS.find(g=>g.id===selectedGroup)
  const selectedConfidence=selected?getSourceConfidence(selected):null
  const visibleGroups=useMemo(()=>{
    const available=floor==='all'?GROUPS:GROUPS.filter(g=>String(g.floor)===floor)
    return allGroups?available:available.slice(0,floor==='all'?7:9)
  },[floor,allGroups])
  const hasMoreGroups=(floor==='all'?GROUPS:GROUPS.filter(g=>String(g.floor)===floor)).length>visibleGroups.length
  const liveCount=Object.values(levels).filter(n=>n>0).length
  const activePercent=NUMBER_FORMAT.format(Math.round(Object.values(levels).reduce((a,b)=>a+b,0)/GROUPS.length))

  const chooseScene=useCallback(id=>{
    setScenarioId(id);setOverrides({});setTour(false)
  },[])
  const changeFloor=useCallback(id=>{
    setFloor(id);setView('perspective');setSelectedGroup(null);setAllGroups(false);setTour(false)
  },[])
  const focusGroup=useCallback(id=>{
    if(!id){setSelectedGroup(null);return}
    const g=GROUPS.find(gr=>gr.id===id)
    if(!g)return
    setSelectedGroup(id)
    setFloor(String(g.floor))
    setMobilePanel(false)
    setTour(false)
  },[])
  const changeLevel=useCallback((id,value)=>{
    setOverrides(prev=>({...prev,[id]:value}))
    setSelectedGroup(id)
  },[])
  const toggleMaster=useCallback(()=>{
    if(scenarioId==='off') chooseScene('evening')
    else chooseScene('off')
  },[scenarioId,chooseScene])
  const resetCamera=useCallback(()=>{setView('perspective');setResetKey(i=>i+1)},[])
  const screenshot=useCallback(()=>{
    const canvas=canvasRef.current
    if(!canvas)return
    try{
      const a=document.createElement('a')
      a.download='villa-como-'+scenarioId+'.png'
      a.href=canvas.toDataURL('image/png')
      a.click()
    } catch(err) {
      console.error('Screenshot failed:',err)
    }
  },[scenarioId])

  useEffect(()=>{
    if(!tour)return undefined
    const itinerary=[
      {scene:'welcome',floor:'all',phase:'dusk'},
      {scene:'evening',floor:'2',phase:'dusk'},
      {scene:'dinner',floor:'2',phase:'night'},
      {scene:'night',floor:'3',phase:'night'},
      {scene:'full',floor:'0',phase:'dusk'},
      {scene:'evening',floor:'all',phase:'dusk'},
    ]
    tourStep.current=0
    const tick=()=>{
      const current=itinerary[tourStep.current%itinerary.length]
      setScenarioId(current.scene)
      setOverrides({})
      setFloor(current.floor)
      setPhase(current.phase)
      setSelectedGroup(null)
      tourStep.current+=1
    }
    tick()
    const timer=window.setInterval(tick,7500)
    return ()=>window.clearInterval(timer)
  },[tour])

  useEffect(()=>{
    const keydown=e=>{
      if(e.target instanceof HTMLInputElement)return
      if(e.key==='Escape'){setSelectedGroup(null);setMobilePanel(false);setTour(false)}
      if(e.key==='r'||e.key==='R')resetCamera()
    }
    window.addEventListener('keydown',keydown)
    return ()=>window.removeEventListener('keydown',keydown)
  },[resetCamera])

  const choosePhase=id=>{setPhase(id);setTour(false)}
  const goToLighting=()=>{
    setMobilePanel(true)
    window.setTimeout(()=>groupSectionRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),60)
  }
  const goOverview=()=>{changeFloor('all');resetCamera();setMobilePanel(false)}
  const fullscreen=()=>{const el=stageRef.current;if(!el)return; if(document.fullscreenElement)document.exitFullscreen?.();else el.requestFullscreen?.()}

  return <div className="app-shell">
    <nav className="sidebar" aria-label="Главная навигация">
      <button className="brand-button" type="button" onClick={goOverview} title="Villa Como — главная"><Logo compact/></button>
      <div className="sidebar-divide"/>
      <div className="sidebar-tools">
        <button type="button" className={'rail-button '+(floor==='all'?'rail-button--active':'')} onClick={goOverview} title="Вся вилла" aria-label="Вся вилла"><House size={21} strokeWidth={1.7}/></button>
        <button type="button" className={'rail-button '+(floor!=='all'?'rail-button--active':'')} onClick={()=>changeFloor('2')} title="Планы этажей" aria-label="Планы этажей"><Layers3 size={21} strokeWidth={1.7}/></button>
        <button type="button" className="rail-button" onClick={goToLighting} title="Группы света" aria-label="Группы света"><Lightbulb size={21} strokeWidth={1.7}/></button>
        <button type="button" className="rail-button" onClick={()=>setShowLegend(x=>!x)} title="О проекте" aria-label="О проекте"><CircleHelp size={21} strokeWidth={1.7}/></button>
      </div>
      <div className="sidebar-bottom"><span className="rail-line"/><span className="rail-caption">VC / 01</span></div>
    </nav>

    <main className="main-content">
      <header className="topbar">
        <div className="topbar-left">
          <span className="eyebrow topbar-label">PRIVATE RESIDENCE</span>
          <span className="topbar-slash">/</span>
          <span className="topbar-project">VILLA COMO</span>
          <span className="location-inline"><MapPin size={12}/> Lago di Como, Italia</span>
        </div>
        <div className="topbar-actions">
          <div className="demo-status"><span/> ДЕМОНСТРАЦИОННЫЙ РЕЖИМ</div>
          <button type="button" className="topbar-menu" onClick={()=>setMobilePanel(v=>!v)} aria-label="Открыть панель управления">{mobilePanel?<X size={22}/>:<Menu size={22}/>}</button>
        </div>
      </header>

      <section className="visual-stage" ref={stageRef}>
        <div className="canvas-layer">
          <VillaCanvas floor={floor} view={view} levels={levels} selectedGroup={selectedGroup} onZoneSelect={focusGroup} phase={phase} tour={tour} resetKey={resetKey} onCanvasReady={c=>{canvasRef.current=c}} />
        </div>
        <div className="stage-vignette"/>
        <div className="stage-title">
          <div className="stage-kicker"><span className="kicker-line"/> THE ART OF SMART LIVING <span className="kicker-dot"/></div>
          <h1>Villa <em>Como.</em></h1>
          <p>Архитектура пространства. Интеллект света.</p>
        </div>
        <div className="stage-top-tools">
          <span className="model-tag"><span className="model-tag-dot"/> ИНТЕРАКТИВНАЯ 3D-МОДЕЛЬ</span>
          <button type="button" className="stage-icon" onClick={resetCamera} aria-label="Сбросить положение камеры" title="Сбросить камеру"><RotateCcw size={17}/></button>
          <button type="button" className="stage-icon screenshot-btn" onClick={screenshot} aria-label="Сохранить снимок модели" title="Сохранить PNG"><Camera size={17}/></button>
          <button type="button" className="stage-icon full-button" onClick={fullscreen} aria-label="Полный экран" title="Полный экран"><Expand size={17}/></button>
        </div>

        {selected && <div className="selected-zone-card">
          <span className="zone-card-icon"><Lightbulb size={16}/></span>
          <div><small>ВЫБРАННАЯ ГРУППА</small><strong>{selected.label}</strong><span>{selected.ref} · {levels[selected.id]}%</span><em className={'zone-confidence zone-confidence--'+selectedConfidence.id}>{selectedConfidence.label}</em></div>
          <button type="button" onClick={()=>setSelectedGroup(null)} aria-label="Снять выделение"><X size={16}/></button>
        </div>}

        <div className="camera-presets" role="group" aria-label="Ракурс модели">
          {[{id:'perspective',label:'Объём'},{id:'front',label:'Со двора'},{id:'back',label:'Сзади'},{id:'top',label:'Сверху'}].map(item=><button key={item.id} type="button" aria-pressed={view===item.id} onClick={()=>{setView(item.id);setTour(false)}}>{item.label}</button>)}
        </div>

        <div className="stage-bottom">
          <div className="view-controls">
            <div className="control-tiny-title">ПРОСМОТР <span className="tiny-divider"/> {floor==='all'?'АРХИТЕКТУРА':getFloorName(Number(floor)).toUpperCase()}</div>
            <DisplaySelect floor={floor} onChange={changeFloor}/>
          </div>
          <div className="stage-bottom-right">
            <div className="time-switch" role="group" aria-label="Освещение окружения">
              {PHASES.map(item=>{
                const Icon=item.icon
                return <button key={item.id} type="button" aria-pressed={phase===item.id} title={item.label} onClick={()=>choosePhase(item.id)} className={'time-choice '+(phase===item.id?'time-choice--active':'')}><Icon size={15}/><span>{item.label}</span></button>
              })}
            </div>
            <div className="interaction-hint"><MousePointer2 size={13}/> Вращайте · приближайте · выбирайте зоны</div>
          </div>
        </div>
      </section>
      <div className="stage-footbar">
        <div className="footbar-left"><span className="footbar-architect">MÈTRE</span><span>Контуры по A-03–A-06 · планировка A-18–A-21 · фасады и кровли — интерпретация</span></div>
        <button type="button" className="footbar-right footbar-passport" onClick={()=>setShowLegend(true)}><span className="footer-status-dot"/> ПАСПОРТ МОДЕЛИ <span className="footbar-separator">/</span> v2.0</button>
      </div>
    </main>

    <aside className={'control-panel '+(mobilePanel?'control-panel--open':'')} ref={controlsRef}>
      <div className="panel-header">
        <div className="panel-header-icon"><Logo compact/></div>
        <div><span className="panel-eyebrow">УПРАВЛЕНИЕ ПРОСТРАНСТВОМ</span><h2>Сценарии света</h2></div>
        <button className="mobile-close" type="button" onClick={()=>setMobilePanel(false)} aria-label="Закрыть панель"><X size={20}/></button>
      </div>
      <div className="panel-scroll">
        <div className="overview-strip">
          <div className="overview-metric"><span>АКТИВНЫЕ ЗОНЫ</span><strong>{liveCount}<small> / {GROUPS.length}</small></strong></div>
          <div className="overview-divider"/>
          <div className="overview-metric"><span>СР. ЯРКОСТЬ</span><strong>{activePercent}<small> %</small></strong></div>
          <span className="live-pulse" title="Локальная визуализация"/>
        </div>

        <div className="section-heading">
          <div><span className="section-kicker">01 / АТМОСФЕРА</span><h3>Выберите настроение</h3></div>
          <span className="section-count">{SCENARIOS.length.toString().padStart(2,'0')}</span>
        </div>
        <div className="scenario-list">
          {SCENARIOS.map(s=><ScenarioItem key={s.id} scenario={s} active={scenarioId===s.id} onClick={()=>chooseScene(s.id)}/>)}
        </div>

        <div className="scene-feature">
          <div className="feature-sparkle"><Sparkles size={17}/></div>
          <div className="feature-copy"><strong>Демонстрационный тур</strong><p>Автоматическая смена видов и световых сцен.</p></div>
          <button type="button" className={'tour-button '+(tour?'tour-button--on':'')} onClick={()=>setTour(t=>!t)} aria-label={tour?'Остановить тур':'Начать тур'} title={tour?'Остановить тур':'Начать тур'}>{tour?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</button>
        </div>

        <div className="section-heading lighting-heading" ref={groupSectionRef}>
          <div><span className="section-kicker">02 / ТОЧНАЯ НАСТРОЙКА</span><h3>Группы освещения</h3></div>
          <button className="section-small-action" type="button" onClick={()=>setAllGroups(a=>!a)}><SlidersHorizontal size={15}/></button>
        </div>
        <p className="section-description">{floor==='all'?'Управляйте группами всей виллы.':getFloorName(Number(floor))+' · группы этого уровня.'} Нажмите на название, чтобы перейти к зоне на 3D-плане.</p>
        <div className="level-list">
          {visibleGroups.map(g=><LevelControl key={g.id} group={g} level={levels[g.id]} selected={selectedGroup===g.id} onChange={changeLevel} onFocus={()=>focusGroup(g.id)}/>)}
        </div>
        {(hasMoreGroups || allGroups) && <button type="button" className="show-more" onClick={()=>setAllGroups(a=>!a)}>{allGroups?'Свернуть группы':'Показать все группы'} {allGroups?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>}

        <div className="panel-facts">
          <div className="panel-facts-heading"><Building2 size={16}/> ПРОСТРАНСТВА ВИЛЛЫ</div>
          <div className="floor-facts">
            {FLOORS.filter(f=>f.id!=='all').map(f=><button key={f.id} type="button" className="floor-fact" onClick={()=>changeFloor(f.id)}><span>{f.short}</span><strong>{FLOOR_AREAS[f.id]}</strong><ChevronRight size={14}/></button>)}
          </div>
          <p>Площади взяты из ведомостей помещений. У гаража отдельная ведомость.</p>
        </div>

        <div className="demo-disclaimer"><ShieldCheck size={16}/><span>Все сценарии работают в режиме симуляции. Реальные контроллеры и реле пока не подключены.</span></div>
      </div>
      <div className="panel-footer">
        <div><span className="footer-power-indicator"/><span>ЛОКАЛЬНАЯ ДЕМОНСТРАЦИЯ</span></div>
        <button type="button" className={'master-toggle '+(scenarioId==='off'?'master-toggle--off':'')} onClick={toggleMaster} title={scenarioId==='off'?'Восстановить сцену':'Выключить весь свет'}><Power size={17}/><span>{scenarioId==='off'?'Включить':'Master off'}</span></button>
      </div>
    </aside>

    {mobilePanel && <button type="button" className="mobile-backdrop" onClick={()=>setMobilePanel(false)} aria-label="Закрыть панель"/>}
    {showLegend && <div className="modal-backdrop" onClick={()=>setShowLegend(false)} role="presentation">
      <section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={()=>setShowLegend(false)} aria-label="Закрыть"><X size={20}/></button>
        <span className="section-kicker">VILLA COMO / DESIGN INTENT</span>
        <h2 id="about-title">О демонстрационной модели</h2>
        <p>Модель сверена с 94-страничным PDF MÈTRE от 09.02.2026: обмеры A-03–A-06, мебель A-18–A-21 и свет A-34–A-37.</p>
        <div className="fidelity-grid">
          <article className="fidelity-card fidelity-card--source">
            <FileCheck2 size={20}/><div><strong>Перенесено из проекта</strong><p>Контуры этажей, полукруглый эркер, Г-образная мансарда, 19 / 13 / 5 помещений, терраса 22,51 м², отметка 2 этажа +2,930 м и проёмы.</p></div>
          </article>
          <article className="fidelity-card fidelity-card--concept">
            <WandSparkles size={20}/><div><strong>Требует фасадов и генплана</strong><p>Отделка фасадов, форма наружных кровель, участок и точная посадка зданий. Гараж справа под 90° и выход террасы во двор — по уточнению владельца.</p></div>
          </article>
        </div>
        <div className="fidelity-note"><DraftingCompass size={16}/><span>Контуры оцифрованы по PDF с привязкой к размеру 10,080 м; строительная точность требует CAD-исходника и обмеров. Положение гаража и наличие выхода подтверждены владельцем; расстояние между зданиями и конструкция наружной лестницы приняты для демонстрации.</span></div>
        <div className="about-facts"><span>3 этажа + гараж</span><span>16 групп демо</span><span>7 сценариев</span></div>
        <button type="button" className="modal-confirm" onClick={()=>setShowLegend(false)}>Понятно <Check size={17}/></button>
      </section>
    </div>}
  </div>
}
