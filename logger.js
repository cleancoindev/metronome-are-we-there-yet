'use strict'

const { logger: config } = require('config')
const winston = require('winston')
require('winston-papertrail')

const requiredProps = {
  Papertrail: 'host'
}

const transports = Object.keys(config)
  .map(t =>
    config[t] &&
    (requiredProps[t] ? config[t][requiredProps[t]] : true) &&
    new winston.transports[t](config[t])
  )
  .filter(t => !!t)

const logger = new winston.Logger({ transports })

module.exports = logger
