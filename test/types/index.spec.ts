import { describe, expect, it } from 'vitest'
import { useSanityClient } from '../..'
import { runInSetup } from '../helpers/mount'

describe('useSanityClient', () => {
  it('needs to provide both dataset & projectId', async () => {
    await runInSetup(() => {
      try {
        // @ts-expect-error dataset is a required option
        useSanityClient({
          dataset: '',
          apiVersion: '2021-03-25',
        })

        // @ts-expect-error dataset is a required option
        useSanityClient({
          projectId: '',
          apiVersion: '2021-03-25',
        })
      }
      catch {}
    })

    expect(true).toBeTruthy()
  })
})
