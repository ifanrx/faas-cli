import { usageError } from './utils'

describe('utils', () => {
  it('usageError', () => {
    const err = usageError('error message')
    expect(err.type).toBe('EUSAGE')
    expect(err.message).toBe('error message')
  })
})
