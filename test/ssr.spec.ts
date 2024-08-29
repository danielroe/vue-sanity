/** @vitest-environment node */
import { createApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { describe, expect, it } from 'vitest'

import { useCache } from '../src/cache'
import { fetcher } from './helpers/utils'

describe('ssr', () => {
  it('cache fetches data correctly on SSR', async () => {
    const app = createApp({
      setup() {
        const { data, status } = useCache(ref('key'), () => fetcher('value'))

        return () =>
          h('div', {}, [`data: ${data.value}, status: ${status.value}`])
      },
    })
    const html = await renderToString(app)
    expect(html).toMatchSnapshot()
  })
}, 10000)
