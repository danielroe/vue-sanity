import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { h } from 'vue'

export async function runInSetup<T extends () => unknown, D extends () => unknown>(setup: T, child?: D) {
  let result: T & D
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

  return result! as ReturnType<T> & ReturnType<D>
}
