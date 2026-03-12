import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { BrowserRouter } from "react-router-dom";
import { StateContextProvider } from "./context";
import { EthPriceProvider } from "./context/EthPriceContext";
import "./index.css";

// ✅ Create client
const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// ✅ Define Hardhat local chain
const hardhat = defineChain({
  id: 31337,
  rpc: "http://127.0.0.1:8545",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThirdwebProvider client={client} activeChain={hardhat}>
        <StateContextProvider>
          <EthPriceProvider>
            <App />
          </EthPriceProvider>
        </StateContextProvider>
      </ThirdwebProvider>
    </BrowserRouter>
  </React.StrictMode>
);