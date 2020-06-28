import Vue from 'vue'
import CompositionApi from '@vue/composition-api'

import { useSanityClient } from '../src'
import { runInSetup } from './helpers/mount'

Vue.config.productionTip = false
Vue.config.devtools = false

Vue.use(CompositionApi)

jest.mock('@sanity/client')
// eslint-disable-next-line
const sanityClient = require('@sanity/client')

;(global.console.error as any) = jest.fn()

const config = {
  projectId: 'id',
  dataset: 'production',
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
