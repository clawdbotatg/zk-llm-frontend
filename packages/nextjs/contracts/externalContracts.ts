import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const externalContracts = {
  8453: {
    APICredits: {
      address: "0x234d536e1623546F394707D6dB700f9c8CD29476",
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
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
