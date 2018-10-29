import nock from 'nock'
import rimraf from 'rimraf'
import util from 'util'
import path from 'path'

import engine from '../engine'

const rm = util.promisify(rimraf)
const host = 'https://cloud.minapp.com'
const config = {
  prefix: 'delete_test',
  oshome: __dirname,
  env: {
    delete_test_client_id: '123',
    delete_test_tokens: '123:123'
  }
}
const rcPath = path.join(config.oshome, `.${config.prefix}rc`)

describe('cli delete command', () => {
  it('delete command with nothing', async () => {
    const e = await engine(config)
    expect.assertions(1)
    await expect(e.cli.delete()).rejects.toThrowError()
    await rm(rcPath)
  })

  it('delete command with function name', async () => {
    const functionName = 'delete_test'
    const link = `/oserve/v1.3/cloud-function/${functionName}/`
    const e = await engine(config)

    nock(host)
      .delete(link)
      .reply(404)

    await expect(e.cli.delete(functionName)).rejects.toThrowError()

    const spyMessage = []
    const spy = jest
      .spyOn(global.console, 'log')
      .mockImplementation(msg => spyMessage.push(msg))
    nock(host)
      .delete(link)
      .reply(204)

    const res = await e.cli.delete(functionName)

    expect(res.body).toBe('')
    expect(spy).toHaveBeenCalled()

    expect(spyMessage[0]).toBe('删除成功')

    await rm(rcPath)
    spy.mockRestore()
  })
})
