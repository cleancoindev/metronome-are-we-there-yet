'use strict'

const Web3 = require('web3')
const MetronomeContracts = require('metronome-contracts')
const config = require('config')

const logger = require('./logger')

const web3 = new Web3(config.eth.wsUrl)
const contracts = new MetronomeContracts(web3)

const account = web3.eth.accounts.privateKeyToAccount(config.account.privKey)
const wallet = web3.eth.accounts.wallet.create(0)
wallet.add(account)

logger.info('Started with account', account.address)

web3.eth.getBalance(account.address)
  .then(web3.utils.fromWei)
  .then(function (balance) {
    logger.info('Account balance:', balance, 'ETH')
  })
  .catch(function (err) {
    logger.error('Could not get balance', err.message)
    process.exit(1)
  })

const subscription = web3.eth.subscribe('newBlockHeaders')

subscription.on('data', function () {
  logger.info('Are we there yet?')
  contracts.auctions.methods.isInitialAuctionEnded()
    .call()
    .then(function (ended) {
      if (!ended) {
        logger.info('No!')
        return
      }
      logger.info('Yes!')
      return contracts.metToken.methods.enableMETTransfers()
        .estimateGas({ from: account.address })
        .then(function (gas) {
          logger.info('Gas needed:', gas)
          return contracts.metToken.methods.enableMETTransfers()
            .send({ from: account.address, gas })
        })
        .then(function (receipt) {
          logger.info('Recepit received:', receipt)
          return contracts.metToken.methods.transferAllowed
            .call()
        })
        .then(function (enabled) {
          logger.info('MET enabled:', enabled)
          process.exit(0)
        })
    })
    .catch(function (err) {
      logger.error('Processing error:', err.message)
    })
})

subscription.on('error', function (err) {
  logger.error('Subscription error:', err.message)
})
