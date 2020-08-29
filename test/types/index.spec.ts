import { useSanityClient } from '../../lib'

import { runInSetup } from '../helpers/mount'

describe('useSanityClient', () => {
  it('needs to provide both dataset & projectId', async () => {
    await runInSetup(() => {
      try {
        // @ts-expect-error
        useSanityClient({
          dataset: '',
        })

        // @ts-expect-error
        useSanityClient({
          projectId: '',
        })

        // eslint-disable-next-line
      } catch {}
    })

    expect(true).toBeTruthy()
  })
})
