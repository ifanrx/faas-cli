import 'babel-polyfill'

import engine from './engine'
import { errorHandler } from './utils'

export default () =>
  engine()
    .then(e => {
      const cmd = e.config.get('cmd')
      if (cmd && e.cli[cmd] != null) {
        return e.cli[cmd](...e.config.get('params'))
      } else {
        console.log('用法：')
        console.log(`    ${e.config.get('prefix')} <command>`)
        console.log('')
        console.log('支持的 command 有：')
        console.log(`    ${Object.keys(e.cli).join(', ')}`)
        console.log('')
        console.log(`- ${e.config.get('prefix')}: v${e.config.get('version')}`)
        console.log(`- node: ${process.version}`)
      }
    })
    .catch(errorHandler)
