# Safe Wallet UI

Frontend application for working with Safe (Gnosis Safe) multi-signature wallets.

## Description

Safe Wallet UI is a lightweight frontend-only application that provides a simple minimal interface for creating and signing transactions with Safe multi-signature wallets.

### Key Features

- **Frontend-only solution** — does not require deploying the heavy ecosystem provided by Gnosis
- **Official Protocol Kit** — uses the official `@safe-global/protocol-kit` from Gnosis for signing transactions
- **Audited contracts** — does not use custom factories, works with audited Gnosis contracts
- **Off-chain signature collection** — signatures are collected off-chain without the need to send transactions at each stage
- **Private storage** — signatures are stored in private IPFS Pinata, not stored on the backend
- **Key-based access** — wallet owners must have a Pinata key to access signatures
- **Free tier** — the free Pinata tier is sufficient for the application to work

## Technologies

- **Vue 3** (Composition API) — main framework
- **Viem** — library for working with Ethereum
- **Protocol Kit** (`@safe-global/protocol-kit`) — official SDK from Gnosis for working with Safe wallets
- **Web3-Onboard** (`@web3-onboard/vue`) — EIP-1193 wallet integration (currently only Metamask is supported)
- **Pinata SDK** — working with private IPFS for storing signatures
- **PrimeVue** — UI components
- **Tailwind CSS** — styling
- **Pinia** — state management
- **Vite** — project bundler

## Installation and Setup

### Requirements

- Node.js (version 22.14.0 or higher recommended)
- npm (version 10.9.2 or higher recommended)

### Installing Dependencies

```bash
npm install
```

### Running in Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port specified by Vite).

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Previewing Production Build

```bash
npm run preview
```

## Pinata API Setup

To use the application, you need to configure a Pinata API key:

1. Register on [Pinata](https://www.pinata.cloud/)
2. Create a JWT token in your account settings
3. In the application, go to the Safe account settings and enter your Pinata API key

**Important:** All wallet owners must have access to the same Pinata API key to work together on transactions.

## Usage

### Creating a Safe Wallet

1. Go to the "Accounts" section
2. Click "Create New"
3. Specify wallet owners and signature threshold
4. Deploy the contract on the blockchain

### Adding an Existing Safe Wallet

1. Go to the "Accounts" section
2. Click "Add"
3. Enter the Safe wallet address and creation transaction hash
4. The application will extract the wallet configuration from the blockchain

### Creating a Transaction

1. Select a Safe wallet
2. Go to the "New Transaction" section
3. Select a contract and method
4. Fill in transaction parameters
5. Sign the transaction

### Signing a Transaction

1. Go to the "Transactions" section
2. Select a transaction that requires a signature
3. Click "Confirm" and sign the transaction

### Executing a Transaction

When enough signatures have been collected (threshold reached), the transaction can be executed:

1. Go to the "Transactions" section
2. Select a transaction with enough signatures
3. Click "Execute" to send the transaction to the network

## Architecture

### Signature Storage

Transaction signatures are stored in private IPFS Pinata in JSON format. Each signature contains:

- Safe transaction data
- Owner signature
- Metadata (nonce, state, Safe address, etc.)

### Security

- Signatures are stored only in private IPFS Pinata
- Access to signatures is only possible with a Pinata API key
- The application does not store signatures on the backend
- Official audited Gnosis contracts are used

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Support

For questions and suggestions, please create issues in the project repository.
