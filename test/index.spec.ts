import Vue from 'vue'
import CompositionApi from '@vue/composition-api'

import { describe, beforeEach, test, expect, vi } from 'vitest'
import sanityClient from '@sanity/client'

import { useSanityClient } from '../src'
import { runInSetup } from './helpers/mount'

Vue.config.productionTip = false
Vue.config.devtools = false

Vue.use(CompositionApi)

vi.mock('@sanity/client')
;(global.console.error as any) = vi.fn()

const config = {
  projectId: 'id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2021-03-25',
}

beforeEach(() => {
  sanityClient.mockClear()
  ;(global.console.error as any).mockClear()
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
