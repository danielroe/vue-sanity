import Vue, { h } from 'vue'
import type { Data, SetupFunction } from 'vue'
import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

Vue.config.productionTip = false
Vue.config.devtools = false

export async function runInSetup<T extends SetupFunction<Data, Data>, D extends SetupFunction<Data, Data>>(setup: T, child?: D) {
  let result
  mount({
    setup() {
      result = (setup as any)() || {}
      return child
        ? () => h({
            setup() {
              Object.assign(result, (child as any)())
            },
          })
        : () => h('div')
    },
  })

  await flushPromises()

  return result as ReturnType<T> & ReturnType<D>
}
