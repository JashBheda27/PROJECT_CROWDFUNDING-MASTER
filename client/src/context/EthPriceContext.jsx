import React, { createContext, useContext, useEffect, useState } from "react";

const EthPriceContext = createContext();

export const EthPriceProvider = ({ children }) => {
  const [ethPriceUSD, setEthPriceUSD] = useState(0);
  const [ethPriceINR, setEthPriceINR] = useState(0);

  const fetchPrice = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr"
      );

      const data = await res.json();

      setEthPriceUSD(Number(data.ethereum.usd));
      setEthPriceINR(Number(data.ethereum.inr));

    } catch (err) {
      console.log("ETH price fetch error:", err);
    }
  };

  useEffect(() => {
    fetchPrice();

    const interval = setInterval(fetchPrice, 30000); // update every 30 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <EthPriceContext.Provider value={{ ethPriceUSD, ethPriceINR }}>
      {children}
    </EthPriceContext.Provider>
  );
};

export const useEthPrice = () => useContext(EthPriceContext);