<h1 align="center">🟢 vue-sanity</h1>
<p align="center">Sanity integration for VueJS</p>

<p align="center">
<a href="https://npmjs.com/package/vue-sanity">
    <img alt="" src="https://img.shields.io/npm/v/vue-sanity/latest.svg?style=flat-square">
</a>
<a href="https://bundlephobia.com/result?p=vue-sanity">
    <img alt="" src="https://img.shields.io/bundlephobia/minzip/vue-sanity?style=flat-square">
</a>
<a href="https://npmjs.com/package/vue-sanity">
    <img alt="" src="https://img.shields.io/npm/dt/vue-sanity.svg?style=flat-square">
</a>
<a href="https://david-dm.org/danielroe/vue-sanity">
    <img alt="" src="https://img.shields.io/david/danielroe/vue-sanity.svg?style=flat-square">
</a>
</p>

> Composition API methods to incorporate [Sanity](https://www.sanity.io/) into a Vue project.

## Features

- 🗄 **Caching:** Query results are cached.
- 💪 **TypeScript**: Written in TypeScript.
- 📡 **Real-time**: Supports previews using Sanity listening mode.
- 🖇 **Composition API**: Vue3 support coming soon.
- 📝 **SSR support**: Compatible with server-side rendering with Nuxt and vanilla Vue.

## Quick Start

First install `vue-sanity`:

```bash
yarn add vue-sanity

# or npm

npm install vue-sanity --save
```

Now configure Sanity in your root component:

```js
import { useSanityClient } from 'vue-sanity'

export default {
  name: 'App',
  setup() {
    useSanityClient({
      projectId: 'myprojectid',
      dataset: 'production',
      useCdn: process.env.NODE_ENV === 'production',
    })
  },
}
```

Then you can use `useSanityFetcher` in any child component:

```vue
<template>
  <div>
    <h1>
      {{ title }}
    </h1>
  </div>
</template>

<script>
import { useSanityFetcher } from 'vue-sanity'

export default {
  setup() {
    const { data: title } = useSanityFetcher(
      () => `*[_type == "article"][0].title`
    )

    return { title }
  },
}
</script>
```

## Inspirations

Projects I've found helpful are:

- [`villus`](https://github.com/logaretm/villus)
- [`vue-apollo`](https://github.com/vuejs/vue-apollo)
- [`swrv`](https://github.com/Kong/swrv)

## Contributors

This has been developed to suit my needs but additional use cases and contributions are very welcome.

## License

[MIT License](./LICENSE) - Copyright &copy; Daniel Roe
