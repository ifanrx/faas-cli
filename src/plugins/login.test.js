import fs from 'fs'
import path from 'path'
import nock from 'nock'
import rimraf from 'rimraf'
import util from 'util'

import engine from '../engine'

const rm = util.promisify(rimraf)
const host = 'https://cloud.minapp.com'
const config = {
  oshome: __dirname,
  prefix: 'login_test'
}
const rcPath = path.join(config.oshome, `.${config.prefix}rc`)

describe('cli login command', () => {
  const clientID = '123'
  const clientSecret = '321'

  it('login without client id or client secret', async () => {
    expect.assertions(3)
    const e = await engine(config)
    await expect(e.cli.login()).rejects.toThrow()
    await expect(e.cli.login(clientID)).rejects.toThrow()
    await expect(e.cli.login(null, clientSecret)).rejects.toThrow()
  })

  it('login with client id and client secret', async () => {
    expect.assertions(5)

    const authorizeLink = '/api/oauth2/hydrogen/openapi/authorize/'
    const accessTokenLink = '/api/oauth2/access_token/'
    const e = await engine(config)

    nock(host)
      .post(authorizeLink)
      .replyWithError(401)
    await expect(e.cli.login(clientID, clientSecret)).rejects.toThrow()

    const code = clientID + clientSecret
    const accessToken = code + code
    nock(host)
      .post(authorizeLink)
      .reply(200, { code })
    nock(host)
      .post(accessTokenLink)
      .replyWithError(400)
    await expect(e.cli.login(clientID, clientSecret)).rejects.toThrow()

    let spyMessage = ''
    const spy = jest.spyOn(global.console, 'log')
      .mockImplementation(msg => (spyMessage = msg))
    nock(host)
      .post(authorizeLink)
      .reply(200, { code })
    nock(host)
      .post(accessTokenLink)
      .reply(200, { access_token: accessToken })
    await e.cli.login(clientID, clientSecret)

    expect(fs.readFileSync(rcPath).toString()).toEqual(
      expect.stringContaining(accessToken)
    )
    expect(spy).toHaveBeenCalled()
    expect(spyMessage).toBe('登录成功')

    await rm(rcPath)
    spy.mockRestore()
  })
})
