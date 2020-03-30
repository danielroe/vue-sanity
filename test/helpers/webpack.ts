import path from 'path'
import webpack from 'webpack'
import MemoryFS from 'memory-fs'

export function compileWithWebpack(
  file: string,
  extraConfig: Partial<webpack.Configuration>,
  cb: (fs: MemoryFS) => void
) {
  const config = Object.assign(
    {
      mode: 'development',
      entry: path.resolve(__dirname, '../fixtures', file),
      module: {
        rules: [
          {
            test: /\.(j|t)sx?$/,
            loader: 'babel-loader',
          },
        ],
      },
    },
    extraConfig
  )

  const compiler = webpack(config)

  // ---------
  // Comment these lines out if you want to see an actual file
  // const fs = require('fs')
  const fs = new MemoryFS()
  compiler.outputFileSystem = fs
  // ---------

  compiler.run((err, stats) => {
    expect(err).toBeFalsy()
    expect(stats.hasErrors()).toBeFalsy()
    cb(fs)
  })
}
