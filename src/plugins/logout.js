import * as config from '../config'

export function cli () {
  return config.set('access_token', '').then(() => {
    console.log('已注销')
  })
}
