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
<a href="https://lgtm.com/projects/g/danielroe/vue-sanity">
    <img alt="" src="https://img.shields.io/lgtm/alerts/github/danielroe/vue-sanity?style=flat-square">
</a>
<a href="https://lgtm.com/projects/g/danielroe/vue-sanity">
    <img alt="" src="https://img.shields.io/lgtm/grade/javascript/github/danielroe/vue-sanity?style=flat-square">
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
- 🖇 **Composition API**: Vue3/Vue2 support using `vue-demi`.
- 📝 **SSR support**: Compatible with server-side rendering with Nuxt and vanilla Vue.

## Quick Start

> If you are using Vue 2, then this project requires usage of [`@vue/composition-api`](https://github.com/vuejs/composition-api). Make sure you've set that up correctly first. If you're using Vue 3, no extra steps are required.

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
    const { data: title } = useSanityFetcher('*[_type == "article"][0].title')

    // OR use a factory function
    const { data: title } = useSanityFetcher(
      () => `*[slug.current == ${slug.value}][0].title`
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

- `defaultOptions`

  You may also pass an object of options that will be passed to any queries you make using `useSanityFetcher`, although of course they will be overridden by any specific options you pass to `useSanityFetcher`.

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

  - **listen**: true, false or an object of options to pass to `client.listen` (defaults to `false`)
  - **strategy**: strategy for fetching. Defaults to `both`.
    - `:server`: will not refetch if the cache has been populated on SSR
    - `:client`: will disable SSR fetching entirely
    - `:both`: will fetch on server and refetch when page is loaded
  - **deduplicate**: Whether to de-duplicate identical fetches. If set to `true`, additional fetches will not run unless made after the previous request errors or succeeds. If set to a number, additional fetches will run, but only after this many milliseconds after the previous fetch began.

### useSanityQuery

If you are using [`sanity-typed-queries`](https://github.com/danielroe/sanity-typed-queries) to define your schema, this is a helper function to reduce boilerplate and explicit typing.

```ts
import { useSanityQuery } from 'vue-sanity'
import { builder } from './cms/schemas/author.js'

export default {
  setup() {
    // title will be typed as Ref<string | null>, with null as a default value
    const { data: title } = useSanityQuery(builder.pick('name').first())

    // authors will be typed as Ref<string[]>, with an empty array as a default value
    const { data: authors } = useSanityQuery(builder.pick('name'))

    return { title, authors }
  },
}
```

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
