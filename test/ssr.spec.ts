/**
 * @jest-environment node
 */

import Vue from 'vue'
import VueCompositionApi, { ref, createElement } from '@vue/composition-api'
import { createRenderer } from 'vue-server-renderer'

import { fetcher } from './helpers/utils'
import { useCache } from '..'

Vue.use(VueCompositionApi)
Vue.config.productionTip = false
Vue.config.devtools = false

jest.setTimeout(10000)

describe('ssr', () => {
  test('cache fetches data correctly on SSR', async () => {
    const app = new Vue({
      setup() {
        const { data, status } = useCache(ref('key'), () => fetcher('value'))

        return () =>
          createElement('div', {}, [
            `data: ${data.value}, status: ${status.value}`,
          ])
      },
    })
    const html = await createRenderer().renderToString(app)
    expect(html).toMatchSnapshot()
  })
})
