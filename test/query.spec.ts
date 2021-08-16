/**
 * @jest-environment jsdom
 */
import { ref } from '@vue/composition-api'
import flushPromises from 'flush-promises'
import { defineDocument } from 'sanity-typed-queries'

import {
  useCustomClient,
  useSanityFetcher,
  useSanityClient,
  useSanityQuery,
  fetch as _fetch,
} from '../src'
import { runInSetup } from './helpers/mount'

const config = {
  projectId: 'id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2021-03-25',
}

const mockFetch = jest.fn(async (key: string) => `return value-${key}`)
;(global.console.error as any) = jest.fn()

const mockUnsubscribe = jest.fn()
const mockSubscribe = jest.fn((callback: (result: any) => void) => {
  callback({ result: 'sub update' })
  return {
    unsubscribe: mockUnsubscribe,
  }
})
const mockListen = jest.fn(() => ({
  subscribe: mockSubscribe,
}))

jest.mock('@sanity/client', () => {
  return jest.fn().mockImplementation(() => {
    return { fetch: mockFetch, listen: mockListen }
  })
})
// eslint-disable-next-line
const sanityClient = require('@sanity/client')

beforeEach(() => {
  sanityClient.mockClear()
  ;(global.console.error as any).mockClear()
  mockListen.mockClear()
  mockSubscribe.mockClear()
  mockUnsubscribe.mockClear()
  mockFetch.mockClear()
})

describe('fetcher', () => {
  test('errors when run outside of setup', async () => {
    let error
    try {
      useSanityFetcher(() => `outside-of-setup`)
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
  })
  test('errors when client is not injected', async () => {
    await runInSetup(() => {
      useSanityFetcher(() => `my-error`)
      return {}
    })
    // eslint-disable-next-line
    expect(console.error).toBeCalled()
  })

  test('allows default options to be set', async () => {
    const results = await runInSetup(() => {
      useSanityClient(config, true, {
        strategy: 'server',
      })

      const key = ref('default-server')
      ;(window as any).__NUXT__ = {
        vsanity: {
          'default-server': ['server', 'server loaded'],
        },
      }
      const { data, status } = useSanityFetcher(() => key.value)
      return { data, status }
    })
    expect(results.value.data).toBe('server')
    expect(results.value.status).toBe('server loaded')
  })

  test('allows direct access to client', async () => {
    const result = await runInSetup(() => {
      useCustomClient({ fetch: async t => `fetched-${t}` })
      const data = _fetch('test')
      return { data }
    })
    expect(await result.value.data).toBe('fetched-test')
    const errored = await runInSetup(() => {
      let data = false
      try {
        _fetch('test')
      } catch {
        data = true
      }
      return { data }
    })
    expect(errored.value.data).toBe(true)
  })

  test('allows custom client to be provided', async () => {
    const result = await runInSetup(() => {
      useCustomClient({ fetch: async t => `fetched-${t}` })
      const { data } = useSanityFetcher(() => `query`)
      return { data }
    })
    expect(result.value.data).toBe('fetched-query')
  })
  test('does not listen with a custom client', async () => {
    const mockListen = jest.fn()
    const customClient = new Proxy(
      {
        fetch: async t => `fetched-${t}`,
      },
      {
        get(target, p) {
          if (p === 'listen') return mockListen
          return target[p]
        },
      }
    )
    await runInSetup(() => {
      useCustomClient(customClient)
      const { data } = useSanityFetcher(
        () => `query`,
        null,
        q => q,
        { listen: true }
      )
      return { data }
    })
    expect(mockListen).toHaveBeenCalledTimes(0)
  })
  test('fetches query when slug updates', async () => {
    const slug = ref('key')

    await runInSetup(() => {
      useSanityClient(config)
      useSanityFetcher(() => `my-${slug.value}`)

      return {}
    })
    expect(mockFetch).toHaveBeenCalledWith(`my-key`)

    slug.value = 'new-key'
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledWith(`my-new-key`)
  })
  test('allows passing a query string', async () => {
    const slug = ref('key')

    await runInSetup(() => {
      useSanityClient(config)
      useSanityFetcher(slug.value)

      return {}
    })
    expect(mockFetch).toHaveBeenCalledWith(`key`)
    mockFetch.mockClear()

    slug.value = ''
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })
  test("doesn't fetch with falsy query", async () => {
    const slug = ref('key')

    await runInSetup(() => {
      useSanityClient(config)
      useSanityFetcher(() => slug.value && `my-${slug.value}`)

      return {}
    })
    expect(mockFetch).toHaveBeenCalledWith(`my-key`)
    mockFetch.mockClear()

    slug.value = ''
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  test('returns correct initial value with falsy query', async () => {
    const result = await runInSetup(() => {
      useSanityClient(config)
      const { data: dataArray } = useSanityFetcher(() => false, [])
      const { data: dataDefault } = useSanityFetcher(() => false)

      return {
        dataArray,
        dataDefault,
      }
    })
    expect(result.value.dataArray).toEqual([])
    expect(result.value.dataDefault).toEqual(null)
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  test('status updates correctly', async () => {
    const data = await runInSetup(() => {
      useSanityClient(config)

      const { status } = useSanityFetcher(() => `my-key-status`, 'apple')
      return { status }
    })
    expect(data.value.status).toEqual('client loaded')
  })

  test('data updates correctly', async () => {
    const data = await runInSetup(() => {
      useSanityClient(config)

      const { data } = useSanityFetcher(() => `my-key-data`, 'apple')
      return { data }
    })
    expect(data.value.data).toEqual('return value-my-key-data')
  })

  test('subscribes to a sanity resource', async () => {
    const key = ref('subscription')
    await runInSetup(() => {
      useSanityClient(config)

      const { data } = useSanityFetcher(
        () => `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: true }
      )
      return { data }
    })
    expect(mockSubscribe).toHaveBeenCalled()
    expect(mockListen).toHaveBeenCalled()

    key.value = 'new-sub'
    await flushPromises()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  test('subscribes to a sanity resource with preview client', async () => {
    const key = ref('preview-subscription')
    await runInSetup(() => {
      useSanityClient(config, true)

      const { data } = useSanityFetcher(
        () => `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: true }
      )
      return { data }
    })
    expect(mockSubscribe).toHaveBeenCalled()
    expect(mockListen).toHaveBeenCalled()

    key.value = 'new-sub'
    await flushPromises()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  test('subscribes to a sanity resource with a single query string', async () => {
    const key = ref('preview-subscription')
    await runInSetup(() => {
      useSanityClient(config, true)

      const { data } = useSanityFetcher(
        `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: true }
      )
      return { data }
    })
    expect(mockSubscribe).toHaveBeenCalled()
    expect(mockListen).toHaveBeenCalled()

    key.value = 'new-sub'
    await flushPromises()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(0)
  })

  test('passes relevant options to listener', async () => {
    const key = ref('listen-options')
    const listenOptions = { sampleId: 30 }
    await runInSetup(() => {
      useSanityClient(config, true)

      const { data } = useSanityFetcher(
        () => `my-key-${key.value}`,
        'apple',
        q => q,
        { listen: listenOptions }
      )
      return { data }
    })
    expect(mockListen).toHaveBeenCalledWith(
      'my-key-listen-options',
      listenOptions
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
    const result = await runInSetup(() => {
      useSanityClient(config)
      const { data } = useSanityQuery(builder.pick(['description', 'cost']))
      expect(data.value).toEqual([])
      return { data }
    })
    expect(mockFetch).toHaveBeenCalled()
    expect(result.value.data).toBe(
      "return value-*[_type == 'author'] { description, cost }"
    )
  })

  it('works with a builder function', async () => {
    const result = await runInSetup(() => {
      useSanityClient(config)
      const { data } = useSanityQuery(() => builder.pick(['description']))
      expect(data.value).toEqual([])
      return { data }
    })
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == 'author'] { description }`
    )
    expect(result.value.data).toBe(
      "return value-*[_type == 'author'] { description }"
    )
  })
})
