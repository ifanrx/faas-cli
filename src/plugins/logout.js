export function cli (engine) {
  return new Promise((resolve, reject) => {
    engine.config
      .set('access_token', '', 'config')
      .on('save', () => {
        console.log('注销成功')
        resolve()
      })
      .on('error', reject)
      .save('config', 'ini')
  })
}
