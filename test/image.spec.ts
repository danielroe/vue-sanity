import Vue from 'vue'
import CompositionApi, { ref } from '@vue/composition-api'

import { runInSetup } from './helpers/mount'
import { useSanityImage, useSanityClient } from '..'

Vue.use(CompositionApi)

const config = {
  projectId: 'id',
  dataset: 'production',
  useCdn: true,
}

;(global.console.error as any) = jest.fn()

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
