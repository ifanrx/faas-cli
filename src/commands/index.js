import fs from 'fs'
import path from 'path'
import util from 'util'

export default () =>
  util
    .promisify(fs.readdir)(__dirname)
    .then(files =>
      files.reduce((m, filename) => {
        const joined = path.join(__dirname, filename)
        if (
          fs.statSync(joined).isDirectory() &&
          fs.existsSync(path.join(joined, 'index.js'))
        ) {
          m[filename] = require('./' + filename)
        } else {
          const ext = path.extname(filename)
          if (
            filename !== 'index.js' &&
            ext === '.js' &&
            !/\.(spec|test)\.js$/.test(filename)
          ) {
            m[filename.replace(ext, '')] = require('./' + filename)
          }
        }
        return m
      }, {})
    )
