/**
 * @vitest-environment happy-dom
 */
import { ref } from '@vue/composition-api'
import type { ClientConfig } from '@sanity/client'
import { describe, expect, it, vi } from 'vitest'

import { useSanityClient, useSanityImage } from '../src'
import { runInSetup } from './helpers/mount'

const config: ClientConfig = {
  projectId: 'id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2021-03-25',
}

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
    await runInSetup(() => {
      useSanityImage(ref(image))
      return {}
    })

    expect(console.error).toBeCalled()
  })

  it('errors when run outside of setup', async () => {
    let error
    try {
      useSanityImage(ref(image))
    }
    catch (e) {
      error = e
    }
    expect(error).toBeDefined()
  })

  it('produces relevant image url', async () => {
    const data = await runInSetup(() => {
      useSanityClient(config, true)
      const result = useSanityImage(ref(image))
      return { result }
    })

    const result = data.value.result

    expect(result).toMatchSnapshot()
  })

  it('works without dimensions', async () => {
    const data = await runInSetup(() => {
      useSanityClient(config, true)
      const result = useSanityImage(ref({ ...image, dimensions: undefined }))
      return { result }
    })

    const result = data.value.result

    expect(result).toMatchSnapshot()
  })
})
