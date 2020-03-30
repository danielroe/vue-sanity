import Vue from 'vue'
import CompositionApi, { ref } from '@vue/composition-api'
import flushPromises from 'flush-promises'

import { useSanityFetcher, useSanityClient, useSanityImage } from '../src'
import { runInSetup } from './helpers/mount'

Vue.config.productionTip = false
Vue.config.devtools = false

Vue.use(CompositionApi)

const mockFetch = jest.fn(async (key: string) => `return value-${key}`)
;(global.console.error as any) = jest
  .fn
  // console.info
  ()

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

const config = {
  projectId: 'id',
  dataset: 'production',
}

beforeEach(() => {
  sanityClient.mockClear()
  ;(global.console.error as any).mockClear()
  mockListen.mockClear()
  mockSubscribe.mockClear()
  mockUnsubscribe.mockClear()
  mockFetch.mockClear()
})

describe('instantiator', () => {
  test('creates new sanity client', async () => {
    await runInSetup(() => {
      useSanityClient(config, true)
      return {}
    })

    expect(sanityClient).toHaveBeenCalledTimes(2)
    expect(sanityClient).toHaveBeenCalledWith(config)
    expect(sanityClient).toHaveBeenLastCalledWith({
      ...config,
      useCdn: false,
      token: undefined,
      withCredentials: true,
    })
  })
})

describe('image builder', () => {
  const image = {
    url: 'https://cdn.sanity.io/images/siteid/production/imageid-100x100.jpg',
    dimensions: {
      aspectRatio: 3,
      height: 3,
      width: 3,
    },
  }
  test('errors without proper config', async () => {
    await runInSetup(() => {
      useSanityImage(ref(image))
      return {}
    })
    // eslint-disable-next-line
    expect(console.error).toBeCalled()
  })

  test('errors when run outside of setup', async () => {
    let error
    try {
      useSanityImage(ref(image))
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
  })

  test('produces relevant image url', async () => {
    const data = await runInSetup(() => {
      useSanityClient(config, true)
      const result = useSanityImage(ref(image))
      return { result }
    })

    const result = data.value.result

    expect(result).toMatchSnapshot()
  })

  test('works without dimensions', async () => {
    const data = await runInSetup(() => {
      useSanityClient(config, true)
      const result = useSanityImage(ref({ ...image, dimensions: undefined }))
      return { result }
    })

    const result = data.value.result

    expect(result).toMatchSnapshot()
  })
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
