## [0.9.0](https://github.com/danielroe/vue-sanity/compare/v0.7.2...v0.9.0) (2020-08-16)


### ⚠ BREAKING CHANGES

* if you are using `@sanity/client` or `@sanity/image-url` you will need to specify this dependency explicitly in your `package.json`

### Features

* ⚡️ allow passing a string rather than a factory function ([4eb40ef](https://github.com/danielroe/vue-sanity/commit/4eb40efc78cf738fcb6d21b8ad86ae639eb797c7))
* ⚡️ allow short-circuiting queries ([dcfa82d](https://github.com/danielroe/vue-sanity/commit/dcfa82d323a4ef9a6cc58fe0433143c28291475d))


### Performance Improvements

* remove explicit dependency on sanity clients ([21beebf](https://github.com/danielroe/vue-sanity/commit/21beebfda0ed6c997dcf7641e641ec133e029547))

## [0.8.0](https://github.com/danielroe/vue-sanity/compare/v0.7.2...v0.8.0) (2020-07-29)


### ⚠ BREAKING CHANGES

* if you are using `@sanity/client` or `@sanity/image-url` you will need to specify this dependency explicitly in your `package.json`

### Performance Improvements

* remove explicit dependency on sanity clients ([21beebf](https://github.com/danielroe/vue-sanity/commit/21beebfda0ed6c997dcf7641e641ec133e029547))

### [0.7.2](https://github.com/danielroe/vue-sanity/compare/v0.7.1...v0.7.2) (2020-07-21)


### Bug Fixes

* test that cache exists before adding to ssrContext ([c7ffbce](https://github.com/danielroe/vue-sanity/commit/c7ffbce027539b16ad29cb39fe23a2fecace8b06))

### [0.7.1](https://github.com/danielroe/vue-sanity/compare/v0.7.0...v0.7.1) (2020-06-28)


### Bug Fixes

* don't send promises from server ([67eabce](https://github.com/danielroe/vue-sanity/commit/67eabce1e4374ec6dc2a64f76424d9f76bb08fb3))

## [0.7.0](https://github.com/danielroe/vue-sanity/compare/v0.6.2...v0.7.0) (2020-06-28)


### Features

* allow direct access to `fetch` ([464b31b](https://github.com/danielroe/vue-sanity/commit/464b31bd6713a21957c297fcc2fa03ea180a2b7d))

### [0.6.2](https://github.com/danielroe/vue-sanity/compare/v0.6.1...v0.6.2) (2020-06-27)

### [0.6.1](https://github.com/danielroe/vue-sanity/compare/v0.6.0...v0.6.1) (2020-06-23)

## [0.6.0](https://github.com/danielroe/vue-sanity/compare/v0.5.5...v0.6.0) (2020-06-10)


### ⚠ BREAKING CHANGES

* There are a number of breaking changes in the latest upstream composition-api. See https://github.com/vuejs/composition-api/releases/tag/v0.6.0 for details.

### Features

* upgrade to `@vue/composition-api` v0.6.1 ([23df28e](https://github.com/danielroe/vue-sanity/commit/23df28e614ae8d57041fb3a3fd7320613bf77995))

### [0.5.5](https://github.com/danielroe/vue-sanity/compare/v0.5.4...v0.5.5) (2020-05-05)

### [0.5.4](https://github.com/danielroe/vue-sanity/compare/v0.5.3...v0.5.4) (2020-05-02)


### Bug Fixes

* remove iife build ([89336af](https://github.com/danielroe/vue-sanity/commit/89336afa5dba9fe869bd5d5d65e077357d7ed645))

### [0.5.3](https://github.com/danielroe/vue-sanity/compare/v0.5.2...v0.5.3) (2020-04-30)


### Bug Fixes

* remove srcset reliance on image dimensions ([#39](https://github.com/danielroe/vue-sanity/issues/39)) ([791b024](https://github.com/danielroe/vue-sanity/commit/791b024df9bb991e6afb23d4682001c311c64e9b))
* restore correct types and update snapshot ([529d405](https://github.com/danielroe/vue-sanity/commit/529d405571c6b20293e92fa57461056477351f3d))

### [0.5.2](https://github.com/danielroe/vue-sanity/compare/v0.5.1...v0.5.2) (2020-04-29)

### [0.5.1](https://github.com/danielroe/vue-sanity/compare/v0.5.0...v0.5.1) (2020-04-26)

## [0.5.0](https://github.com/danielroe/vue-sanity/compare/v0.4.4...v0.5.0) (2020-04-22)


### Features

* store indivdual errors and allow query deduping ([3eba128](https://github.com/danielroe/vue-sanity/commit/3eba12817b9ba4a34157104a66bbca396f4f9347))
* store individual query status ([3710eb2](https://github.com/danielroe/vue-sanity/commit/3710eb28b58d686a91f8b821132a87e3b527e899))


### Bug Fixes

* add reactivity fixes for deduped cache ([5c30acc](https://github.com/danielroe/vue-sanity/commit/5c30acc117eea9c89593d60bb3d3e5bf175c570d))
* don't pollute initial value from ssr fetch ([4f64182](https://github.com/danielroe/vue-sanity/commit/4f64182cc6338227ff31abf676642fc1603611e7))

### [0.4.4](https://github.com/danielroe/vue-sanity/compare/v0.4.3...v0.4.4) (2020-04-19)


### Bug Fixes

* don't set undefined values in listener ([d8a009d](https://github.com/danielroe/vue-sanity/commit/d8a009df45be92158156e4b825ffb3174c07308f))


### Performance Improvements

* import @sanity/client and @sanity/cli dynamically ([ebef54d](https://github.com/danielroe/vue-sanity/commit/ebef54d22870170081fa5792cbf8bc607482dcfd))

### [0.4.3](https://github.com/danielroe/vue-sanity/compare/v0.4.2...v0.4.3) (2020-04-14)


### Features

* allow default options to be set ([2a2d631](https://github.com/danielroe/vue-sanity/commit/2a2d631150ba487b64b09976a69a93f70be8bcbd))

### [0.4.2](https://github.com/danielroe/vue-sanity/compare/v0.4.1...v0.4.2) (2020-04-13)


### Features

* add 'client' and 'server' cache strategies ([22e9b50](https://github.com/danielroe/vue-sanity/commit/22e9b50dc55ecb2f19fe03b18eddf1b3e132aa1e))
* allow providing a custom sanity client ([ceffd8f](https://github.com/danielroe/vue-sanity/commit/ceffd8f963acd0f1d08ccb0413999f29f6f29699))
* expose any error received in fetching query ([cf388ae](https://github.com/danielroe/vue-sanity/commit/cf388ae1f9e129cd31b9088747a8cb36913eeec5))
* expose manual fetcher for preloading cache ([7702713](https://github.com/danielroe/vue-sanity/commit/77027135362a39d3fe9cb1dcefa616d15c823480))


### Bug Fixes

* prefer fetch to (deprecated) triggerFetch ([851b91d](https://github.com/danielroe/vue-sanity/commit/851b91d17b55b8c44e2566d6eb2e4bd30b47db51))

### [0.4.1](https://github.com/danielroe/vue-sanity/compare/v0.4.0...v0.4.1) (2020-04-08)

## [0.4.0](https://github.com/danielroe/vue-sanity/compare/v0.3.1...v0.4.0) (2020-04-04)


### Features

* allow passing a builder function for dynamic queries ([f2d6ac5](https://github.com/danielroe/vue-sanity/commit/f2d6ac5c74e68c1413a4aecf437be754e108546f))

### [0.3.1](https://github.com/danielroe/vue-sanity/compare/v0.3.0...v0.3.1) (2020-04-01)


### Bug Fixes

* don't compile to cjs 🤦‍♂️ ([0dd72f7](https://github.com/danielroe/vue-sanity/commit/0dd72f7454f82e5d3203018575efaf4101095212))

## [0.3.0](https://github.com/danielroe/vue-sanity/compare/v0.2.2...v0.3.0) (2020-04-01)


### Features

* add sanity-typed-queries helper function ([174f1f7](https://github.com/danielroe/vue-sanity/commit/174f1f71d58e7c35c58299702d569b703ac134ee))


### Bug Fixes

* compile to commonjs ([c017616](https://github.com/danielroe/vue-sanity/commit/c01761684e42ae34eb03cc05351ad099b82274b7))


### Performance Improvements

* minify queries before sending to cache ([ec31114](https://github.com/danielroe/vue-sanity/commit/ec3111428400d42d5e4de7961d55abd1e7be59da))

### [0.2.2](https://github.com/danielroe/vue-sanity/compare/v0.2.1...v0.2.2) (2020-03-30)

### [0.2.1](https://github.com/danielroe/vue-sanity/compare/v0.2.0...v0.2.1) (2020-03-27)


### Bug Fixes

* remove optional chaining for broader support ([d35e93d](https://github.com/danielroe/vue-sanity/commit/d35e93dafaf5cca8dd8ed2e70dc8d245efe54fb7))

## [0.2.0](https://github.com/danielroe/vue-sanity/compare/v0.1.1...v0.2.0) (2020-03-27)


### ⚠ BREAKING CHANGES

* The options for useSanityFetcher have reversed - please see type definitions for details

### Features

* add support for real time events ([a13c51a](https://github.com/danielroe/vue-sanity/commit/a13c51a247ba8634be835b505a69b1155d605527))
* improve typing and interface to fetcher ([96f7385](https://github.com/danielroe/vue-sanity/commit/96f73853dc35f947094f93cc1a19984f713b5fb7))

### [0.1.1](https://github.com/danielroe/vue-sanity/compare/v0.1.0...v0.1.1) (2020-03-27)


### Bug Fixes

* better support for ssr ([b39b7ce](https://github.com/danielroe/vue-sanity/commit/b39b7cebb4ca478cfd68be2b4781fd3956107e76))

## 0.1.0 (2020-03-26)

