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

## API

### useSanityClient

- `config`

  These are the options required by `@sanity/client`. For more details, see the [Sanity docs](https://www.sanity.io/docs/js-client).

- `supportPreview`

  In addition to the config you would normally pass to `@sanity/client`, you can pass a boolean as a second parameter for whether to create a preview client. (Used currently only when listening to real-time data updating.)

#### Example

```ts
import { useSanityClient } from 'vue-sanity'

export default {
  setup() {
    useSanityClient(
      {
        projectId: 'myprojectid',
        dataset: 'production',
        useCdn: process.env.NODE_ENV === 'production',
      },
      true // will now create a preview client for use elsewhere
    )
  },
}
```

### useSanityFetcher

- `query`

  A function that retuns a query string. If the return value changes, a new Sanity query will be run and the return value automatically updated.

- `initialValue`
  You can provide an initial value for the query result (which will be returned before query completes).

- `mapper`

  You can provide a function to transform the query result.

- `options`

  You can also provide an object of additional options.

  - **listen**: true, false or an object of options to pass to `client.listen` (defaults to false)
  - **clientOnly**: whether to disable SSR data fetching (defaults to false).

#### Example

```ts
import { useSanityClient } from 'vue-sanity'

export default {
  setup() {
    const { data: title } = useSanityFetcher(
      // query
      () => `*[_type == "article"][0].title`,
      // initial value
      'Title - Default',
      // mapper
      result => `Title - ${result}`,
      // options
      {
        listen: true,
        clientOnly: true,
      }
    )

    return { title }
  },
}
```

#### Usage with TypeScript

You can type the return value of `useSanityFetcher` in several ways.

```ts
// data will be typed as Ref<string | null>
const { data } = useSanityFetcher<string>(
  () => `*[_type == "article"][0].title`
)
```

```ts
// data will be typed as Ref<string | number> as a number has been provided as a default value
const { data } = useSanityFetcher<string, number>(
  () => `*[_type == "article"][0].title`,
  3
)
```

```ts
// data will be typed as Ref<boolean | { value: string }> as it can infer the type
const { data } = useSanityFetcher(
  () => `*[_type == "article"][0].title`,
  true,
  (result: string) => ({ value: result })
)
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
