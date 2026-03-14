# 🚀 Web3 Crowdfunding Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.x-black)
![React](https://img.shields.io/badge/React-18-blue)
![Hardhat](https://img.shields.io/badge/Hardhat-Ethereum-yellow)
![Status](https://img.shields.io/badge/Project-Active-green)

A **Decentralized Crowdfunding Platform (DApp)** built with **React, Solidity, Hardhat, and Thirdweb** that enables users to create fundraising campaigns and donate cryptocurrency securely through blockchain technology.

This project demonstrates how **smart contracts can eliminate intermediaries and enable transparent crowdfunding systems**.

---

# 🌐 Live Demo

*(Add deployed link here if hosted)*

Example:

```
https://your-project-link.vercel.app
```

---

# 📌 Features

### 🪙 Campaign Creation

* Create decentralized fundraising campaigns
* Set funding goals and deadlines
* Upload campaign images and descriptions

### 💰 Donation System

* Donate ETH directly through MetaMask
* View donation history
* Track funding progress in real time

### 🔐 Blockchain Transparency

* All transactions stored on Ethereum blockchain
* Immutable and transparent records
* No centralized authority

### 👛 Wallet Integration

* MetaMask wallet connection
* Display wallet address
* Show wallet balance in ETH and USD

### 🌍 Network Support

* Hardhat Local Network
* Sepolia Ethereum Testnet

---

# 🛠 Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* Thirdweb SDK

## Blockchain

* Solidity
* Hardhat
* Ethereum

## Web3 Integration

* MetaMask
* Viem / Ethers
* Thirdweb

## Infrastructure

* IPFS (optional storage)
* Alchemy RPC Provider

---

# 🏗 System Architecture

```
User (MetaMask Wallet)
        │
        ▼
React Frontend (Vite + Tailwind)
        │
        ▼
Thirdweb / Ethers / Viem
        │
        ▼
Smart Contract (Solidity)
        │
        ▼
Ethereum Blockchain (Sepolia / Local Hardhat)
```

---

# 📁 Project Structure

```
PROJECT_CROWDFUNDING-MASTER
│
├── client/                  # Frontend React Application
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── utils/
│   └── assets/
│
├── web3/                    # Smart Contracts
│   ├── contracts/
│   │   └── CrowdFunding.sol
│   ├── scripts/
│   └── hardhat.config.js
│
├── public/
├── package.json
└── README.md
```

---

# 📜 Smart Contract Overview

The smart contract manages the crowdfunding logic including:

* Campaign creation
* Donation handling
* Tracking donors
* Withdrawal by campaign owner

### Main Functions

```
createCampaign()
donateToCampaign()
getDonators()
withdrawFunds()
refund()
```

All transactions are executed directly on the blockchain ensuring **security and transparency**.

---

# ⚙️ Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/JashBheda27/PROJECT_CROWDFUNDING-MASTER.git
cd PROJECT_CROWDFUNDING-MASTER
```

---

## 2️⃣ Install Dependencies

Frontend

```bash
cd client
npm install
```

Blockchain

```bash
cd web3
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the **web3** folder.

```
PRIVATE_KEY=your_wallet_private_key
ALCHEMY_API_KEY=your_alchemy_key
THIRDWEB_SECRET_KEY=your_thirdweb_secret
```

---

# ▶️ Running the Project

## Start Local Blockchain

```
npx hardhat node
```

---

## Deploy Smart Contract

Local deployment

```
npx hardhat run scripts/deploy.js --network localhost
```

Sepolia deployment

```
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Run Frontend

```
cd client
npm run dev
```

App will run at

```
http://localhost:5173
```

---

# 📸 Screenshots

Add screenshots inside a **screenshots folder**

Example:

```
/screenshots
   home.png
   create-campaign.png
   campaign-details.png
   donate.png
   profile.png
```

Then show them in README:

### Home Page

```
![Home](screenshots/home.png)
```

### Campaign Page

```
![Campaign](screenshots/campaign-details.png)
```

---

# 🔒 Security Features

* Smart contract controlled funds
* Immutable blockchain records
* Transparent donation tracking
* Wallet authentication

---

# 🚧 Future Improvements

* DAO governance
* Multi-chain support (Polygon / Base)
* NFT rewards for donors
* AI campaign recommendation system

---

# 🤝 Contributing

Contributions are welcome.

```
Fork the repository
Create a feature branch
Commit your changes
Open a Pull Request
```

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Jash Bheda**

GitHub
https://github.com/JashBheda27
