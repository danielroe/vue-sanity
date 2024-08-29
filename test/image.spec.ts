import { ref } from 'vue'
import type { ClientConfig } from '@sanity/client'
import { describe, expect, it, vi } from 'vitest'

import { useSanityClient, useSanityImage } from '../src'
import { runInSetup } from './helpers/mount'

const config = {
  projectId: 'id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2021-03-25',
} satisfies ClientConfig

;(globalThis.console.error as any) = vi.fn()

describe('image builder', () => {
  const image = {
    url: 'https://cdn.sanity.io/images/siteid/production/imageid-100x100.jpg',
    dimensions: {
      aspectRatio: 3,
      height: 3,
      width: 3,
    },
  }

  it('errors without proper config', async () => {
    let error: unknown
    runInSetup(() => {
      try {
        useSanityImage(ref(image))
      }
      catch (e) {
        error = e
      }
      return {}
    })

    expect(error).toBeDefined()
    expect(console.error).toBeCalled()
  })

  it('errors when run outside of setup', async () => {
    let error: unknown
    try {
      useSanityImage(ref(image))
    }
    catch (e) {
      error = e
    }
    expect(error).toBeDefined()
  })

  it('produces relevant image url', async () => {
    const data = await runInSetup(() => useSanityClient(config, true), () => ({
      result: useSanityImage(ref(image)),
    }))

    expect(data.result.value).toMatchSnapshot()
  })

  it('works without dimensions', async () => {
    const data = await runInSetup(() => useSanityClient(config, true), () => ({
      result: useSanityImage(ref({ ...image, dimensions: undefined })),
    }))

    expect(data.result.value).toMatchSnapshot()
  })
})
