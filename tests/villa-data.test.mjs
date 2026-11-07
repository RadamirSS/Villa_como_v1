import test from 'node:test'
import assert from 'node:assert/strict'
import { FLOORS, FLOOR_AREAS, GROUPS, SCENARIOS, getLevels } from '../src/data/villa.js'

test('floor selection includes all three levels and separate garage', () => {
  assert.deepEqual(FLOORS.map(f => f.id), ['all', '2', '1', '3', '0'])
  for (const n of [0,1,2,3]) assert.ok(FLOOR_AREAS[n])
})

test('demo light groups have stable unique IDs and valid floor assignment', () => {
  const ids = GROUPS.map(g => g.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(GROUPS.length, 16)
  for (const group of GROUPS) {
    assert.ok([0,1,2,3].includes(group.floor))
    assert.ok(Number.isFinite(group.x) && Number.isFinite(group.z))
    assert.ok(group.ref.includes('A-'))
    assert.ok(group.radius > 0)
  }
})

test('all scenes have valid bounded dimming levels', () => {
  for (const scene of SCENARIOS) {
    const levels = getLevels(scene.id)
    assert.equal(Object.keys(levels).length, GROUPS.length)
    assert.ok(Object.values(levels).every(v => Number.isInteger(v) && v >= 0 && v <= 100))
  }
})

test('master-off clears all groups and all-on enables all', () => {
  assert.ok(Object.values(getLevels('off')).every(v=>v===0))
  assert.ok(Object.values(getLevels('full')).every(v=>v===100))
})

test('manual group override changes one group without mutating preset', () => {
  const original=getLevels('evening')
  const altered=getLevels('evening',{living:83})
  assert.equal(altered.living,83)
  assert.equal(original.living,34)
  for (const group of GROUPS.filter(g=>g.id!=='living')) assert.equal(altered[group.id],original[group.id])
})
