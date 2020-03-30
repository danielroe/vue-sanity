import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import {
  createBundleRenderer,
  BundleRendererOptions,
  BundleRenderer,
} from 'vue-server-renderer'
import path from 'path'

import { compileWithWebpack } from './helpers/webpack'

Vue.use(VueCompositionApi)
Vue.config.productionTip = false
Vue.config.devtools = false

jest.setTimeout(10000)

function createRenderer(
  file: string,
  options: BundleRendererOptions,
  cb: (renderer: BundleRenderer) => void
) {
  compileWithWebpack(
    file,
    {
      target: 'node',
      devtool: false,
      output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.js',
        libraryTarget: 'umd',
      },
    },
    fs => {
      const bundle = fs.readFileSync(
        path.resolve(__dirname, './dist/bundle.js'),
        'utf-8'
      )
      const renderer = createBundleRenderer(bundle, options)
      cb(renderer)
    }
  )
}

describe('ssr', () => {
  // eslint-disable-next-line
  test('cache fetches data correctly on SSR', async done => {
    createRenderer('app.ts', {}, renderer => {
      renderer.renderToString({}, (err, res) => {
        expect(err).toBeNull()
        expect(res).toMatchSnapshot()
        done()
      })
    })
  })
})
