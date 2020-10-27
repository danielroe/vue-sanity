import { Ref, createApp, defineComponent, compile, h } from 'vue'
import flushPromises from 'flush-promises'

type Unwrap<T extends Record<string, any>> = {
  [P in keyof T]: T[P] extends Ref<infer R> ? R : T[P]
}

export function mount(component: Record<string, any>) {
  const compiled = { ...component }
  compiled.render = compile(component.template)
  delete compiled.template
  const app = createApp(compiled)
  document.body.innerHTML = `<div id="app"></div>`
  return app.mount('#app')
}

export async function runInSetup<
  T extends Parameters<typeof defineComponent>[0]['setup']
>(setup: T) {
  const vm = mount({
    template: '<main></main>',
    setup,
  })
  await flushPromises()
  return vm as typeof vm & ReturnType<typeof setup>
}
