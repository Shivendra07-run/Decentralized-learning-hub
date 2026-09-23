/**
 * Aether Server Quiz Question Bank
 * Contains complete question definitions, options, correct indices, and educational explanations.
 */

const QUESTIONS = [
  {
    id: 1,
    category: 'BLOCKCHAIN FOUNDATIONS',
    question: 'What fundamentally prevents past transactions from being altered on a blockchain?',
    options: [
      'A centralized bank administrator locks the database at midnight',
      'Each block includes the cryptographic hash of the previous block, creating an unbroken mathematical chain',
      'Federal digital copyright regulations make editing records illegal',
      'The network automatically erases transaction history every 24 hours'
    ],
    correct: 1,
    explanation: 'Every block seals the cryptographic hash of the prior block; changing any historical record alters its hash and immediately breaks all downstream blocks.'
  },
  {
    id: 2,
    category: 'DECENTRALIZATION',
    question: 'What is the primary architectural advantage of a decentralized network over client-server Web2?',
    options: [
      'Transactions execute faster than centralized relational databases',
      'There is no single point of failure and no single authority can unilaterally censor valid transactions',
      'Users are guaranteed 100% anonymous internet browsing everywhere',
      'Customer support can reverse accidental payments upon phone request'
    ],
    correct: 1,
    explanation: 'Decentralization distributes validation across independent nodes globally, ensuring uptime even if hundreds of servers crash or disconnect.'
  },
  {
    id: 3,
    category: 'CRYPTOCURRENCY',
    question: 'In self-custody cryptocurrency, what gives you the mathematical ability to spend funds?',
    options: [
      'Your public wallet address',
      'A username and password saved on a company server',
      'Your private cryptographic key',
      'A government-issued digital ID number'
    ],
    correct: 2,
    explanation: 'Your private key creates verifiable cryptographic ECDSA signatures that prove ownership without disclosing the secret key itself.'
  },
  {
    id: 4,
    category: 'SMART CONTRACTS',
    question: 'Why are smart contracts commonly compared to a digital vending machine?',
    options: [
      'They only sell digital food and beverage vouchers',
      'They run deterministically according to embedded code conditions without requiring a middleman',
      'They require continuous human cashier verification for each transaction',
      'They can be updated and rewritten at any time by company executives'
    ],
    correct: 1,
    explanation: 'Smart contracts autonomously hold and transfer digital assets once predefined mathematical parameters are fulfilled, removing intermediary escrow.'
  },
  {
    id: 5,
    category: 'NFTS & DIGITAL ASSETS',
    question: 'How does an NFT (Non-Fungible Token) differ from a standard token like ETH or USDC?',
    options: [
      'NFTs can only be minted by certified governmental museums',
      'Each NFT has a unique cryptographic identifier and cannot be swapped 1:1 for another identical item',
      'NFTs do not require gas fees to trade or transfer',
      'NFTs automatically delete themselves after 30 days'
    ],
    correct: 1,
    explanation: 'Fungible tokens are interchangeable (one dollar equals another dollar); an NFT represents a unique, non-interchangeable digital item or contract right.'
  },
  {
    id: 6,
    category: 'DAO GOVERNANCE',
    question: 'How do members in a standard Decentralized Autonomous Organization (DAO) cast votes?',
    options: [
      'Through secret corporate boardroom committee meetings',
      'By signing on-chain transactions weighted by their governance token holdings',
      'By sending email petitions to the protocol founders',
      'One physical vote per registered passport submitted via mail'
    ],
    correct: 1,
    explanation: 'DAO governance proposals are voted on transparently on-chain using cryptographic governance tokens to signal consensus and release treasury funds.'
  },
  {
    id: 7,
    category: 'WALLET SECURITY',
    question: 'If a Discord direct message, telegram admin, or website asks for your 12-word recovery seed phrase, what should you do?',
    options: [
      'Provide only the first 6 words to verify your identity safely',
      'Never share it under any circumstances—it is an outright phishing scam',
      'Share it if the website has a valid SSL padlock in the address bar',
      'Enter it into a Google Form to receive customer support assistance'
    ],
    correct: 1,
    explanation: 'Your seed phrase controls all your private keys. Real teams and wallet providers will never request it; anyone with your phrase can steal all your assets permanently.'
  },
  {
    id: 8,
    category: 'GAS & NETWORK ECONOMICS',
    question: 'Why do public blockchains require users to pay "gas fees" on transactions?',
    options: [
      'To pay corporate sales tax to local municipal governments',
      'To compensate network validators for compute power and deter denial-of-service spam attacks',
      'To fund the electric utility bills of browser developers',
      'To purchase cloud storage licenses from Amazon Web Services'
    ],
    correct: 1,
    explanation: 'Gas meters computational resource usage, incentivizes decentralized validator participation, and prevents malicious actors from flooding the ledger with infinite loops.'
  },
  {
    id: 9,
    category: 'CONSENSUS MECHANISMS',
    question: 'In a Proof-of-Stake (PoS) network like modern Ethereum, what secures the blockchain against fraudulent blocks?',
    options: [
      'Validators solve high-wattage thermodynamic puzzles using supercomputers',
      'Validators lock up native tokens as economic collateral that gets slashed (destroyed) if they act dishonestly',
      'A single lead server elected by national governments signs each block',
      'Users solve CAPTCHA puzzles before submitting payments'
    ],
    correct: 1,
    explanation: 'Proof-of-Stake relies on financial collateral (slashing). Malicious validators lose their deposited capital if they act dishonestly.'
  },
  {
    id: 10,
    category: 'IMMUTABILITY & SAFETY',
    question: 'What happens if you mistakenly send cryptocurrency to the wrong address on a public blockchain?',
    options: [
      'The blockchain customer support team will reverse the transaction within 3 business days',
      'Your commercial bank will initiate a chargeback and retrieve your tokens',
      'The transaction is permanently irreversible unless the recipient voluntarily returns the funds',
      'The tokens automatically bounce back to your wallet after 24 hours'
    ],
    correct: 2,
    explanation: 'Public blockchains have no central administrative authority or undo button; transactions are permanent and final once confirmed in a block.'
  }
];

module.exports = {
  QUESTIONS
};
