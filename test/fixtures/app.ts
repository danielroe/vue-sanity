import Vue from 'vue'
import VueCompositionApi, { ref, createElement } from '@vue/composition-api'

/* eslint-disable @typescript-eslint/no-var-requires */
const { fetcher } = require('../helpers/utils.ts')
const { useCache } = require('../../src/cache.ts')
/* eslint-enable */

Vue.config.devtools = false
Vue.use(VueCompositionApi)

export default () => {
  return new Promise(resolve => {
    resolve(
      new Vue({
        setup() {
          const { data, status } = useCache(ref('key'), () => fetcher('value'))

          return () =>
            createElement('div', {}, [
              `data: ${data.value}, status: ${status.value}`,
            ])
        },
      })
    )
  })
}
