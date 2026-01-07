import { createClient } from '@sanity/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSanityClient } from '../src'
import { runInSetup } from './helpers/mount'

vi.mock('@sanity/client')
;(globalThis.console.error as any) = vi.fn()

const config = {
  projectId: 'id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2021-03-25',
}

beforeEach(() => {
  createClient.mockClear()
  ;(globalThis.console.error as any).mockClear()
})

describe('instantiator', () => {
  it('creates new sanity client', async () => {
    await runInSetup(() => {
      useSanityClient(config, true)
      return {}
    })

    expect(createClient).toHaveBeenCalledTimes(2)
    expect(createClient).toHaveBeenCalledWith(config)
    expect(createClient).toHaveBeenLastCalledWith({
      ...config,
      useCdn: false,
      token: undefined,
      withCredentials: true,
    })
  })
})
