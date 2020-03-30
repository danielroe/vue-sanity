import Vue from 'vue'
import VueCompositionAPI, { Ref } from '@vue/composition-api'
import { SetupFunction, Data } from '@vue/composition-api/dist/component'
import flushPromises from 'flush-promises'

Vue.config.productionTip = false
Vue.config.devtools = false

Vue.use(VueCompositionAPI)

type Unwrap<T extends Record<string, any>> = {
  [P in keyof T]: T[P] extends Ref<infer R> ? R : T[P]
}

export function mount(component: Record<string, any>) {
  return new Vue(component).$mount()
}

export async function runInSetup<T extends SetupFunction<Data, Data>>(
  setup: T
) {
  const vm = mount({
    setup,
    render: h => h('div'),
  })

  await flushPromises()

  return {
    get value() {
      return vm.$data as Unwrap<ReturnType<T>>
    },
  }
}
