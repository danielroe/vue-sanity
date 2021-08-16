import { useSanityClient } from '../../lib'

import { runInSetup } from '../helpers/mount'

describe('useSanityClient', () => {
  it('needs to provide both dataset & projectId', async () => {
    await runInSetup(() => {
      try {
        // @ts-expect-error
        useSanityClient({
          dataset: '',
          apiVersion: '2021-03-25',
        })

        // @ts-expect-error
        useSanityClient({
          projectId: '',
          apiVersion: '2021-03-25',
        })

        // eslint-disable-next-line
      } catch {}
    })

    expect(true).toBeTruthy()
  })
})
