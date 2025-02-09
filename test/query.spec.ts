import { createClient } from '@sanity/client'
import flushPromises from 'flush-promises'
import { defineDocument } from 'sanity-typed-queries'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { fetch as _fetch, useCustomClient, useSanityClient, useSanityFetcher, useSanityQuery } from '../src'
import { runInSetup } from './helpers/mount'

const config = {
  projectId: 'id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2021-03-25',
}

const mockFetch = vi.fn(async (key: string) => `return value-${key}`)
;(globalThis.console.warn as any) = vi.fn()

const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn((callback: (result: any) => void) => {
  callback({ result: 'sub update' })
  return {
    unsubscribe: mockUnsubscribe,
  }
})
const mockListen = vi.fn(() => ({
  subscribe: mockSubscribe,
}))

vi.mock('@sanity/client', () => {
  return {
    createClient: vi.fn().mockImplementation(() => {
      return { fetch: mockFetch, listen: mockListen }
    }),
  }
})

beforeEach(() => {
  createClient.mockClear()
  ;(globalThis.console.warn as any).mockClear()
  mockListen.mockClear()
  mockSubscribe.mockClear()
  mockUnsubscribe.mockClear()
  mockFetch.mockClear()
})

describe('fetcher', () => {
  it('errors when run outside of setup', async () => {
    let error
    try {
      useSanityFetcher(() => `outside-of-setup`)
    }
    catch (e) {
      error = e
    }
    expect(error).toBeDefined()
  })
  it('errors when client is not injected', async () => {
    let error
    await runInSetup(() => {
      try {
        useSanityFetcher(() => `my-error`)
      }
      catch (e) {
        error = e
      }
    })

    expect(console.warn).toBeCalled()
    expect(error).toBeDefined()
  })

  it('allows default options to be set', async () => {
    const results = await runInSetup(() => {
      useSanityClient(config, true, {
        strategy: 'server',
      })
    }, () => {
      const key = ref('default-server')
      ;(window as any).__NUXT__ = {
        vsanity: {
          'default-server': ['server', 'server loaded'],
        },
      }
      const { data, status } = useSanityFetcher(() => key.value)
      return { data, status }
    })

    expect(results.data.value).toBe('server')
    expect(results.status.value).toBe('server loaded')
  })

  it('allows direct access to client', async () => {
    const result = await runInSetup(() => useCustomClient({ fetch: async t => `fetched-${t}` }), () => {
      const data = _fetch('test')
      return { data }
    })
    expect(await result.data).toBe('fetched-test')
    const errored = await runInSetup(() => {
      let data = false
      try {
        _fetch('test')
      }
      catch {
        data = true
      }
      return { data }
    })
    expect(errored.data).toBe(true)
  })

  it('allows custom client to be provided', async () => {
    const result = await runInSetup(() => useCustomClient({ fetch: async t => `fetched-${t}` }), () => {
      const { data } = useSanityFetcher(() => `query`)
      return { data }
    })
    expect(result.data.value).toBe('fetched-query')
  })
  it('does not listen with a custom client', async () => {
    const mockListen = vi.fn()
    const customClient = new Proxy(
      {
        fetch: async t => `fetched-${t}`,
      },
      {
        get(target, p) {
          if (p === 'listen')
            return mockListen
          return target[p]
        },
      },
    )
    await runInSetup(() => useCustomClient(customClient), () => {
      const { data } = useSanityFetcher(
        () => `query`,
        null,
        q => q,
        { listen: true },
      )
      return { data }
    })
    expect(mockListen).toHaveBeenCalledTimes(0)
  })
  it('fetches query when slug updates', async () => {
    const slug = ref('key')

    await runInSetup(() => useSanityClient(config), () => {
      useSanityFetcher(() => `my-${slug.value}`)

      return {}
    })
    expect(mockFetch).toHaveBeenCalledWith(`my-key`)

    slug.value = 'new-key'
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledWith(`my-new-key`)
  })
  it('allows passing a query string', async () => {
    const slug = ref('key')

    await runInSetup(() => useSanityClient(config), () => {
      useSanityFetcher(slug.value)

      return {}
    })
    expect(mockFetch).toHaveBeenCalledWith(`key`)
    mockFetch.mockClear()

    slug.value = ''
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })
  it('doesn\'t fetch with falsy query', async () => {
    const slug = ref('key')

    await runInSetup(() => useSanityClient(config), () => {
      useSanityFetcher(() => slug.value && `my-${slug.value}`)

      return {}
    })
    expect(mockFetch).toHaveBeenCalledWith(`my-key`)
    mockFetch.mockClear()

    slug.value = ''
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  it('returns correct initial value with falsy query', async () => {
    const result = await runInSetup(() => useSanityClient(config), () => {
      const { data: dataArray } = useSanityFetcher(() => false, [])
      const { data: dataDefault } = useSanityFetcher(() => false)

      return {
        dataArray,
        dataDefault,
      }
    })
    expect(result.dataArray.value).toEqual([])
    expect(result.dataDefault.value).toEqual(null)
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  it('status updates correctly', async () => {
    const data = await runInSetup(() => useSanityClient(config), () => {
      const { status } = useSanityFetcher(() => `my-key-status`, 'apple')
      return { status }
    })
    expect(data.status.value).toEqual('client loaded')
  })

  it('data updates correctly', async () => {
    const data = await runInSetup(() => useSanityClient(config), () => {
      const { data } = useSanityFetcher(() => `my-key-data`, 'apple')
      return { data }
    })
    expect(data.data.value).toEqual('return value-my-key-data')
  })

  it('subscribes to a sanity resource', async () => {
    const key = ref('subscription')
    await runInSetup(() => useSanityClient(config), () => {
      const { data } = useSanityFetcher(
        () => `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: true },
      )
      return { data }
    })
    expect(mockSubscribe).toHaveBeenCalled()
    expect(mockListen).toHaveBeenCalled()

    key.value = 'new-sub'
    await flushPromises()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('subscribes to a sanity resource with preview client', async () => {
    const key = ref('preview-subscription')
    await runInSetup(() => useSanityClient(config, true), () => {
      const { data } = useSanityFetcher(
        () => `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: true },
      )
      return { data }
    })
    expect(mockSubscribe).toHaveBeenCalled()
    expect(mockListen).toHaveBeenCalled()

    key.value = 'new-sub'
    await flushPromises()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('subscribes to a sanity resource with a single query string', async () => {
    const key = ref('preview-subscription')
    await runInSetup(() => useSanityClient(config, true), () => {
      const { data } = useSanityFetcher(
        `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: true },
      )
      return { data }
    })
    expect(mockSubscribe).toHaveBeenCalled()
    expect(mockListen).toHaveBeenCalled()

    key.value = 'new-sub'
    await flushPromises()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(0)
  })

  it('passes relevant options to listener', async () => {
    const key = ref('listen-options')
    const listenOptions = { sampleId: 30 }
    await runInSetup(() => useSanityClient(config, true), () => {
      const { data } = useSanityFetcher(
        () => `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: listenOptions },
      )
      return { data }
    })
    expect(mockListen).toHaveBeenCalledWith(
      'my-key-listen-options',
      listenOptions,
    )
  })
})

describe('sanity-typed-queries helper', () => {
  const { builder } = defineDocument('author', {
    name: {
      type: 'string',
      validation: Rule => Rule.required(),
    },
    tags: {
      type: 'array',
      of: [{ type: 'string' }, { type: 'number' }],
    },
    cost: {
      type: 'number',
    },
    description: {
      type: 'text',
      rows: 2,
      validation: Rule => Rule.required(),
    },
  })

  it('returns the expected data', async () => {
    const result = await runInSetup(() => useSanityClient(config), () => {
      const { data } = useSanityQuery(builder.pick(['description', 'cost']))
      expect(data.value).toEqual([])
      return { data }
    })
    expect(mockFetch).toHaveBeenCalled()
    expect(result.data.value).toBe(
      'return value-*[_type == \'author\'] { cost, description }',
    )
  })

  it('works with a builder function', async () => {
    const result = await runInSetup(() => useSanityClient(config), () => {
      const { data } = useSanityQuery(() => builder.pick(['description']))
      expect(data.value).toEqual([])
      return { data }
    })
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == 'author'] { description }`,
    )
    expect(result.data.value).toBe(
      'return value-*[_type == \'author\'] { description }',
    )
  })
})
