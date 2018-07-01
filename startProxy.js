const { spawn } = require('child-process-promise')
const { findAPortNotInUse } = require('portscanner')
const { address: getIp } = require('ip')

const startProxy = async () => {
  const ip = getIp()
  const port = await findAPortNotInUse(1024, 45000, ip)
  const command = `kubectl proxy --port ${port} --accept-hosts .* --address ${ip}`
  const [cmd, ...args] = command.split(' ')
  const proxying = spawn(cmd, args)

  return new Promise(resolve => {
    let output = ''
    proxying.childProcess.stdout.on('data', data => {
      output = `${output}${data.toString()}`
      if (output.includes(`Starting to serve on ${ip}:${port}`)) {
        resolve({
          disconnect: () => {
            proxying.catch(e => {})
            proxying.childProcess.kill()
          },
          config: { baseUrl: `http://${ip}:${port}` }
        })
      }
    })
  })
}

module.exports = startProxy
