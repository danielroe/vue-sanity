import Vue from 'vue'
import { h, ref } from '@vue/composition-api'
import { createRenderer } from 'vue-server-renderer'

import { describe, expect, it } from 'vitest'

import { useCache } from '../src'
import { fetcher } from './helpers/utils'

Vue.config.productionTip = false
Vue.config.devtools = false

describe('ssr', () => {
  it('cache fetches data correctly on SSR', async () => {
    const app = new Vue({
      setup() {
        const { data, status } = useCache(ref('key'), () => fetcher('value'))

        return () =>
          h('div', {}, [`data: ${data.value}, status: ${status.value}`])
      },
    })
    const html = await createRenderer().renderToString(app)
    expect(html).toMatchSnapshot()
  })
}, 10000)
