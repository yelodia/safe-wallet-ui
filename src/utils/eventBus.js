import mitt from 'mitt'

export const eventBus = mitt()

export const EVENTS = {
  CONTRACT_DEPLOYED: 'contract-deployed',
  TRANSACTION_SUCCESS: 'transaction-success',
  LOCK_CHAIN: 'lock-chain'
}
