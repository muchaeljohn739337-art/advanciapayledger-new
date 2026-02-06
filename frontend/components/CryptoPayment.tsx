"use client";

/**
 * Crypto Payment Component
 * Handles cryptocurrency payment processing
 */

import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: unknown[]) => void,
      ) => void;
    };
  }
}

interface CryptoPaymentProps {
  amount: string;
  currency: "ETH" | "USDC" | "USDT" | "DAI";
  recipientAddress: string;
  description?: string;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export default function CryptoPayment({
  amount,
  currency,
  recipientAddress,
  description,
  onSuccess,
  onError,
}: CryptoPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "pending" | "confirmed" | "failed"
  >("idle");
  const [gasPrice, setGasPrice] = useState<any>(null);

  useEffect(() => {
    fetchGasPrice();
  }, []);

  const fetchGasPrice = async () => {
    try {
      const response = await fetch("/api/crypto/gas-prices");
      const data = await response.json();
      if (data.success) {
        setGasPrice(data.gasPrice);
      }
    } catch (err) {
      console.error("Fetch gas price error:", err);
    }
  };

  const processPayment = async () => {
    setIsProcessing(true);
    setStatus("pending");

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      let tx;

      if (currency === "ETH") {
        // Send ETH
        tx = await signer.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(amount),
        });
      } else {
        // Send ERC20 token
        const tokenAddresses = {
          USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        };

        const tokenDecimals = {
          USDC: 6,
          USDT: 6,
          DAI: 18,
        };

        const tokenAddress = tokenAddresses[currency];
        const decimals = tokenDecimals[currency];

        const erc20Abi = [
          "function transfer(address to, uint256 amount) returns (bool)",
        ];

        const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);
        tx = await contract.transfer(
          recipientAddress,
          ethers.parseUnits(amount, decimals),
        );
      }

      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setStatus("confirmed");
        onSuccess?.(tx.hash);

        // Verify payment with backend
        await verifyPaymentWithBackend(tx.hash);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setStatus("failed");
      onError?.(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPaymentWithBackend = async (hash: string) => {
    try {
      // Create payment request first
      const createResponse = await fetch("/api/crypto/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency,
          recipientAddress,
          description,
        }),
      });

      const createData = await createResponse.json();

      if (createData.success) {
        // Verify the payment
        await fetch("/api/crypto/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId: createData.paymentRequest.id,
            txHash: hash,
          }),
        });
      }
    } catch (err) {
      console.error("Backend verification error:", err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Crypto Payment</h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">
            {amount} {currency}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">To:</span>
          <span className="font-mono text-sm">
            {recipientAddress.substring(0, 10)}...
            {recipientAddress.substring(recipientAddress.length - 8)}
          </span>
        </div>

        {description && (
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span className="text-sm">{description}</span>
          </div>
        )}

        {gasPrice && (
          <div className="flex justify-between">
            <span className="text-gray-600">Est. Gas:</span>
            <span className="text-sm">{gasPrice.standard} Gwei</span>
          </div>
        )}
      </div>

      {status === "idle" && (
        <button
          onClick={processPayment}
          disabled={isProcessing}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing..." : `Pay ${amount} ${currency}`}
        </button>
      )}

      {status === "pending" && txHash && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Transaction pending...</p>
          <p className="text-xs text-gray-500 mt-2 font-mono break-all">
            {txHash}
          </p>
        </div>
      )}

      {status === "confirmed" && (
        <div className="text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <p className="text-green-600 font-semibold">Payment Confirmed!</p>
          {txHash && (
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline mt-2 block"
            >
              View on Etherscan
            </a>
          )}
        </div>
      )}

      {status === "failed" && (
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">✗</div>
          <p className="text-red-600 font-semibold">Payment Failed</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
