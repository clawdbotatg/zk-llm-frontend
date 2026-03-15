import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const externalContracts = {
  8453: {
    APICredits: {
      address: "0xc18fad39f72eBe5E54718D904C5012Da74594674",
      abi: [
        {
          type: "function",
          name: "stake",
          inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "unstake",
          inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "register",
          inputs: [{ name: "commitment", type: "uint256", internalType: "uint256" }],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "stakeAndRegister",
          inputs: [
            { name: "amount", type: "uint256", internalType: "uint256" },
            { name: "commitments", type: "uint256[]", internalType: "uint256[]" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "stakedBalance",
          inputs: [{ name: "", type: "address", internalType: "address" }],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "serverClaimable",
          inputs: [],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getTreeData",
          inputs: [],
          outputs: [
            { name: "size", type: "uint256", internalType: "uint256" },
            { name: "depth", type: "uint256", internalType: "uint256" },
            { name: "root", type: "uint256", internalType: "uint256" },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "PRICE_PER_CREDIT",
          inputs: [],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "pricePerCredit",
          inputs: [],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        { type: "error", name: "APICredits__EmptyTree", inputs: [] },
        { type: "error", name: "APICredits__InsufficientStake", inputs: [] },
        { type: "error", name: "APICredits__ZeroAmount", inputs: [] },
        { type: "error", name: "APICredits__CommitmentAlreadyUsed", inputs: [{ name: "commitment", type: "uint256" }] },
        {
          type: "event",
          name: "CreditRegistered",
          inputs: [
            { name: "user", type: "address", indexed: true, internalType: "address" },
            { name: "index", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "commitment", type: "uint256", indexed: false, internalType: "uint256" },
            { name: "newStakedBalance", type: "uint256", indexed: false, internalType: "uint256" },
          ],
          anonymous: false,
        },
      ],
    },
    CLAWDToken: {
      address: "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07",
      abi: [
        {
          type: "function",
          name: "approve",
          inputs: [
            { name: "spender", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" },
          ],
          outputs: [{ name: "", type: "bool", internalType: "bool" }],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "allowance",
          inputs: [
            { name: "owner", type: "address", internalType: "address" },
            { name: "spender", type: "address", internalType: "address" },
          ],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "balanceOf",
          inputs: [{ name: "", type: "address", internalType: "address" }],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "decimals",
          inputs: [],
          outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "symbol",
          inputs: [],
          outputs: [{ name: "", type: "string", internalType: "string" }],
          stateMutability: "view",
        },
      ],
    },
    CLAWDRouter: {
      address: "0x908b8738D13eEF2eaaA45BD7D6f4c3A13242C5AC",
      abi: [
        {
          type: "function",
          name: "buyWithETH",
          inputs: [
            { name: "commitments", type: "uint256[]", internalType: "uint256[]" },
            { name: "minCLAWDOut", type: "uint256", internalType: "uint256" },
          ],
          outputs: [],
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "buyWithUSDC",
          inputs: [
            { name: "commitments", type: "uint256[]", internalType: "uint256[]" },
            { name: "usdcAmount", type: "uint256", internalType: "uint256" },
            { name: "minCLAWDOut", type: "uint256", internalType: "uint256" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "buyWithCLAWD",
          inputs: [
            { name: "commitments", type: "uint256[]", internalType: "uint256[]" },
            { name: "maxCLAWD", type: "uint256", internalType: "uint256" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "quoteCredits",
          inputs: [{ name: "numCredits", type: "uint256", internalType: "uint256" }],
          outputs: [
            { name: "clawdNeeded", type: "uint256", internalType: "uint256" },
            { name: "usdEquivalent", type: "uint256", internalType: "uint256" },
          ],
          stateMutability: "view",
        },
        {
          type: "error",
          name: "CLAWDRouter__ZeroCommitments",
          inputs: [],
        },
        {
          type: "error",
          name: "CLAWDRouter__InsufficientOutput",
          inputs: [],
        },
      ],
    },
    CLAWDPricing: {
      address: "0xaca9733Cc19aD837899dc7D1170aF1d5367C332E",
      abi: [
        {
          type: "function",
          name: "creditPriceUSD",
          inputs: [],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getCreditPriceInCLAWD",
          inputs: [],
          outputs: [{ name: "priceInCLAWD", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getEthUsdPrice",
          inputs: [],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getClawdPerEth",
          inputs: [],
          outputs: [{ name: "clawdPerEth", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getOracleData",
          inputs: [],
          outputs: [
            { name: "clawdPerEth", type: "uint256", internalType: "uint256" },
            { name: "ethUsd", type: "uint256", internalType: "uint256" },
            { name: "pricePerCreditCLAWD", type: "uint256", internalType: "uint256" },
            { name: "usdPerCredit", type: "uint256", internalType: "uint256" },
            { name: "clawdUsd", type: "uint256", internalType: "uint256" },
          ],
          stateMutability: "view",
        },
      ],
    },
    USDC: {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      abi: [
        {
          type: "function",
          name: "approve",
          inputs: [
            { name: "spender", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" },
          ],
          outputs: [{ name: "", type: "bool", internalType: "bool" }],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "allowance",
          inputs: [
            { name: "owner", type: "address", internalType: "address" },
            { name: "spender", type: "address", internalType: "address" },
          ],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "balanceOf",
          inputs: [{ name: "", type: "address", internalType: "address" }],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
      ],
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
