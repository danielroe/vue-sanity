export function fetcher(result: string | number) {
  return new Promise(resolve => {
    return setTimeout(() => {
      resolve(result)
    }, 100)
  })
}
