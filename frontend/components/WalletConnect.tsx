'use client';

/**
 * Wallet Connect Component
 * Handles Web3 wallet connection and authentication
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
          await updateBalance(addr);
          onConnect?.(addr);
        }
      } catch (err) {
        console.error('Check connection error:', err);
      }
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      
      // Authenticate with backend
      const message = `Sign this message to authenticate with Advancia PayLedger.\n\nNonce: ${Date.now()}`;
      const signature = await signer.signMessage(message);
      
      // Send to backend for verification
      const response = await fetch('/api/crypto/wallet/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: addr,
          message,
          signature
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAddress(addr);
        await updateBalance(addr);
        onConnect?.(addr);
      } else {
        throw new Error('Authentication failed');
      }

    } catch (err: any) {
      console.error('Connect wallet error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
    setError(null);
    onDisconnect?.();
  };

  const updateBalance = async (addr: string) => {
    try {
      const response = await fetch(`/api/crypto/wallet/balance?address=${addr}&token=ETH`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(parseFloat(data.balance).toFixed(4));
      }
    } catch (err) {
      console.error('Update balance error:', err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (address) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex-1">
          <p className="text-sm text-gray-600">Connected Wallet</p>
          <p className="font-mono font-semibold">{formatAddress(address)}</p>
          {balance && (
            <p className="text-sm text-gray-600 mt-1">
              Balance: {balance} ETH
            </p>
          )}
        </div>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      <p className="mt-2 text-xs text-gray-500 text-center">
        Supports MetaMask, WalletConnect, and other Web3 wallets
      </p>
    </div>
  );
}
