import 'babel-polyfill'

import engine from './engine'
import { errorHandler } from './utils'

export default () =>
  engine()
    .then(e => {
      const cmd = e.config.get('cmd')
      const params = e.config.get('params')

      if (cmd && e.cli[cmd] != null) {
        return e.cli[cmd](...params)
      } else {
        const commands = Object.keys(e.cli).join(', ')
        const prefix = e.config.get('prefix')

        console.log(
          [
            `用法：${prefix} <command>`,
            '',
            '支持的命令：',
            '',
            `${commands}`,
            ''
          ].join('\n')
        )
      }
    })
    .catch(errorHandler)
