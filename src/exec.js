import nopt from 'nopt'
import osenv from 'osenv'
import fs from 'fs'
import path from 'path'

import pkg from '../package.json'
import engine from './engine'
import { errorHandler } from './error'

export default function (argv) {
  const parsed = nopt({ json: [Boolean] }, { j: '--json' }, process.argv, 2)
  const cmd = parsed.argv.remain.shift()
  const home = osenv.home()
  const rc = path.join(home, `.${pkg.name}rc`)
  parsed[`${pkg.name}rc`] = rc
  if (!fs.existsSync(rc)) {
    fs.writeFileSync(rc, '')
  }

  return engine(parsed)
    .then(e => {
      if (!e.cli[cmd]) {
        const commands = Object.keys(e.cli).join(', ')
        console.log(
          [
            `用法：${e.name} <command>`,
            '',
            '支持的命令：',
            '',
            `${commands}`,
            ''
          ].join('\n')
        )
      } else {
        e.cli[cmd](...parsed.argv.remain).catch(errorHandler)
      }
    })
    .catch(errorHandler)
}
