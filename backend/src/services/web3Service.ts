/**
 * Web3 Service with Cloudflare Gateway Integration
 * Handles blockchain interactions, crypto payments, and wallet authentication
 */

import { ethers } from "ethers";

// RPC Provider Configuration with Cloudflare Gateway
const RPC_PROVIDERS = [
  {
    name: "Cloudflare Ethereum Gateway",
    url: "https://cloudflare-eth.com",
    priority: 1,
  },
  {
    name: "Infura",
    url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    priority: 2,
  },
  {
    name: "Alchemy",
    url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    priority: 3,
  },
  {
    name: "Public RPC",
    url: "https://eth.llamarpc.com",
    priority: 4,
  },
];

// Supported tokens for payments across different networks
const SUPPORTED_TOKENS = {
  ETH: {
    symbol: "ETH",
    decimals: 18,
    address: null,
    name: "Ethereum",
    network: "Ethereum Mainnet",
  },
  MATIC: {
    symbol: "MATIC",
    decimals: 18,
    address: null,
    name: "Polygon",
    network: "Polygon Mainnet",
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum Mainnet
    polygonAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // Polygon Mainnet
    name: "USD Coin",
  },
  USDT: {
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Ethereum Mainnet
    polygonAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon Mainnet
    name: "Tether USD",
  },
  DAI: {
    symbol: "DAI",
    decimals: 18,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    name: "Dai Stablecoin",
  },
};

// ERC20 ABI for token interactions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

class Web3Service {
  private provider: ethers.Provider | null = null;
  private currentProviderIndex = 0;
  private connectionAttempts: Array<{
    provider: string;
    timestamp: Date;
    success: boolean;
    error?: string;
  }> = [];

  /**
   * Initialize Web3 provider with automatic fallback
   */
  async initializeProvider(): Promise<ethers.Provider> {
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const providerConfig = RPC_PROVIDERS[this.currentProviderIndex];
        if (!providerConfig) {
          throw new Error("No provider configuration found");
        }

        console.log(
          `[Web3] Attempting connection to ${providerConfig.name}...`,
        );

        const provider = new ethers.JsonRpcProvider(providerConfig.url);

        // Test connection
        await provider.getBlockNumber();

        this.provider = provider;
        this.logConnection(providerConfig.name, true);

        console.log(`[Web3] ✓ Connected to ${providerConfig.name}`);
        return provider;
      } catch (error) {
        const providerConfig = RPC_PROVIDERS[this.currentProviderIndex];
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        if (providerConfig) {
          this.logConnection(providerConfig.name, false, errorMessage);
          console.error(
            `[Web3] ✗ Failed to connect to ${providerConfig.name}:`,
            errorMessage,
          );
        }

        // Try next provider
        this.currentProviderIndex =
          (this.currentProviderIndex + 1) % RPC_PROVIDERS.length;
        attempts++;

        if (attempts < maxAttempts) {
          console.log(
            `[Web3] Retrying with next provider (attempt ${attempts + 1}/${maxAttempts})...`,
          );
          await this.delay(1000); // Wait 1 second before retry
        }
      }
    }

    throw new Error("Failed to connect to any Web3 provider after 3 attempts");
  }

  /**
   * Get current provider (initialize if needed)
   */
  async getProvider(): Promise<ethers.Provider> {
    if (!this.provider) {
      return await this.initializeProvider();
    }
    return this.provider;
  }

  /**
   * Verify wallet signature for authentication
   */
  async verifyWalletSignature(
    address: string,
    message: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("[Web3] Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getEthBalance(address: string): Promise<string> {
    const provider = await this.getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(
    address: string,
    tokenSymbol: string,
    networkName: string = "Ethereum Mainnet",
  ): Promise<string> {
    const token = SUPPORTED_TOKENS[
      tokenSymbol as keyof typeof SUPPORTED_TOKENS
    ] as any;
    if (!token) {
      throw new Error(`Unsupported token: ${tokenSymbol}`);
    }

    const tokenAddress =
      networkName === "Polygon Mainnet"
        ? token.polygonAddress || token.address
        : token.address;

    if (!tokenAddress) {
      throw new Error(`Token ${tokenSymbol} not available on ${networkName}`);
    }

    const provider = await this.getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    if (typeof contract.balanceOf !== "function") {
      throw new Error("Invalid ERC20 contract");
    }

    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, token.decimals);
  }

  /**
   * Monitor transaction status
   */
  async monitorTransaction(txHash: string): Promise<{
    status: "pending" | "confirmed" | "failed";
    confirmations: number;
    blockNumber?: number;
    gasUsed?: string;
  }> {
    const provider = await this.getProvider();

    try {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return {
          status: "pending",
          confirmations: 0,
        };
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;

      return {
        status: receipt.status === 1 ? "confirmed" : "failed",
        confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("[Web3] Transaction monitoring error:", error);
      throw error;
    }
  }

  /**
   * Verify payment received
   */
  async verifyPayment(
    txHash: string,
    expectedAmount: string,
    expectedToken: string,
    recipientAddress: string,
  ): Promise<boolean> {
    const provider = await this.getProvider();

    try {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt || receipt.status !== 1) {
        return false;
      }

      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        return false;
      }

      // Verify ETH payment
      if (expectedToken === "ETH") {
        const amountReceived = ethers.formatEther(tx.value);
        const amountExpected = parseFloat(expectedAmount);

        return (
          tx.to?.toLowerCase() === recipientAddress.toLowerCase() &&
          parseFloat(amountReceived) >= amountExpected
        );
      }

      // Verify ERC20 token payment
      const token = SUPPORTED_TOKENS[
        expectedToken as keyof typeof SUPPORTED_TOKENS
      ] as any;
      if (!token) {
        return false;
      }

      // Determine correct token address based on network
      // For now, we'll try to find the transfer event from any known address for this token
      const possibleAddresses = [
        token.address,
        token.polygonAddress,
        token.bscAddress,
      ].filter(Boolean);

      let transferEvent: any = null;
      for (const tokenAddr of possibleAddresses) {
        const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
        transferEvent = receipt.logs
          .map((log) => {
            try {
              return contract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((event) => event?.name === "Transfer");

        if (transferEvent) break;
      }

      if (!transferEvent || !transferEvent.args) {
        return false;
      }

      const amountReceived = ethers.formatUnits(
        transferEvent.args.value,
        token.decimals,
      );
      const amountExpected = parseFloat(expectedAmount);

      return (
        transferEvent.args.to.toLowerCase() ===
          recipientAddress.toLowerCase() &&
        parseFloat(amountReceived) >= amountExpected
      );
    } catch (error) {
      console.error("[Web3] Payment verification error:", error);
      return false;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<{
    standard: string;
    fast: string;
    instant: string;
  }> {
    const provider = await this.getProvider();
    const feeData = await provider.getFeeData();

    const gasPrice = feeData.gasPrice || BigInt(0);
    const baseGwei = ethers.formatUnits(gasPrice, "gwei");

    return {
      standard: baseGwei,
      fast: (parseFloat(baseGwei) * 1.2).toFixed(2),
      instant: (parseFloat(baseGwei) * 1.5).toFixed(2),
    };
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    from: string,
    to: string,
    value: string,
    data?: string,
  ): Promise<string> {
    const provider = await this.getProvider();

    const gasEstimate = await provider.estimateGas({
      from,
      to,
      value: ethers.parseEther(value),
      data: data || "0x",
    });

    return gasEstimate.toString();
  }

  /**
   * Get connection logs
   */
  getConnectionLogs() {
    return this.connectionAttempts;
  }

  /**
   * Log connection attempt
   */
  private logConnection(provider: string, success: boolean, error?: string) {
    this.connectionAttempts.push({
      provider,
      timestamp: new Date(),
      success,
      ...(error && { error }),
    });

    // Keep only last 100 logs
    if (this.connectionAttempts.length > 100) {
      this.connectionAttempts = this.connectionAttempts.slice(-100);
    }
  }

  /**
   * Utility: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens() {
    return SUPPORTED_TOKENS;
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
export { SUPPORTED_TOKENS };
