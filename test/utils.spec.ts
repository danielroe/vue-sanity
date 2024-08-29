import { describe, expect, it } from 'vitest'
import { ensureInstance, getServerInstance } from '../src/cache'
import { runInSetup } from './helpers/mount'

describe('ensureInstance', () => {
  it('returns component instance', async () => {
    const data = await runInSetup(() => {
      const vm = ensureInstance()
      return { vm }
    })

    expect(data.vm).toBeDefined()
  })
  it('errors when called out of setup', async () => {
    let error = false
    try {
      ensureInstance()
    }
    catch {
      error = true
    }

    expect(error).toBe(true)
  })
})

describe('getServerInstance', () => {
  it('returns false when not on server', async () => {
    const data = await runInSetup(() => {
      const vm = getServerInstance()
      return { vm }
    })

    expect(data.vm).toBe(false)
  })
})
