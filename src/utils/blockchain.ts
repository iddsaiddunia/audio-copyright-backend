import { ethers } from 'ethers';
import { BLOCKCHAIN_PROVIDER_URL, BLOCKCHAIN_PRIVATE_KEY, COPYRIGHT_CONTRACT_ADDRESS } from './config';

// Replace with your actual contract ABI
const CONTRACT_ABI = [
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "owner",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "string",
      "name": "trackId",
      "type": "string"
    },
    {
      "indexed": false,
      "internalType": "string",
      "name": "artistId",
      "type": "string"
    },
    {
      "indexed": false,
      "internalType": "string",
      "name": "metadata",
      "type": "string"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "start",
      "type": "uint256"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "end",
      "type": "uint256"
    }
  ],
  "name": "CopyrightRegistered",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "licensee",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "string",
      "name": "terms",
      "type": "string"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "start",
      "type": "uint256"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "end",
      "type": "uint256"
    }
  ],
  "name": "LicenseIssued",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "from",
      "type": "address"
    },
    {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "indexed": false,
      "internalType": "uint256",
      "name": "timestamp",
      "type": "uint256"
    }
  ],
  "name": "OwnershipTransferred",
  "type": "event"
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "name": "copyrights",
  "outputs": [
    {
      "internalType": "address",
      "name": "owner",
      "type": "address"
    },
    {
      "internalType": "string",
      "name": "trackId",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "artistId",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "metadata",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "start",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "end",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "name": "fingerprintRegistered",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "name": "licenses",
  "outputs": [
    {
      "internalType": "address",
      "name": "licensee",
      "type": "address"
    },
    {
      "internalType": "string",
      "name": "terms",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "start",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "end",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "name": "transfers",
  "outputs": [
    {
      "internalType": "address",
      "name": "from",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "to",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "timestamp",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "trackId",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "artistId",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "metadata",
      "type": "string"
    }
  ],
  "name": "registerCopyright",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    },
    {
      "internalType": "address",
      "name": "licensee",
      "type": "address"
    },
    {
      "internalType": "string",
      "name": "terms",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "duration",
      "type": "uint256"
    }
  ],
  "name": "issueLicense",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    },
    {
      "internalType": "address",
      "name": "newOwner",
      "type": "address"
    }
  ],
  "name": "transferOwnership",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    }
  ],
  "name": "getLicenses",
  "outputs": [
    {
      "components": [
        {
          "internalType": "address",
          "name": "licensee",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "terms",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "start",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "end",
          "type": "uint256"
        }
      ],
      "internalType": "struct CopyrightRegistry.License[]",
      "name": "",
      "type": "tuple[]"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "fingerprint",
      "type": "string"
    }
  ],
  "name": "getTransfers",
  "outputs": [
    {
      "components": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "internalType": "struct CopyrightRegistry.Transfer[]",
      "name": "",
      "type": "tuple[]"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
}
] ;

const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_PROVIDER_URL);
const wallet = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(COPYRIGHT_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

export async function isFingerprintRegistered(fingerprint: string): Promise<boolean> {
  return await contract.fingerprintRegistered(fingerprint);
}

export async function publishCopyrightToBlockchain(fingerprint: string, trackId: string, artistId: string, metadata: string): Promise<string> {
  const tx = await contract.registerCopyright(fingerprint, trackId, artistId, metadata);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * Transfer copyright ownership on the blockchain.
 * @param fingerprint - The unique fingerprint of the track (bytes32)
 * @param newOwner - The address of the new owner (string)
 * @returns The blockchain transaction hash
 */
/**
 * Transfer copyright ownership on-chain.
 * @param fingerprint - The unique fingerprint of the track (bytes32)
 * @param newOwner - The address of the new owner (string)
 * @returns The blockchain transaction hash
 */
export async function transferOwnershipOnChain(fingerprint: string, newOwner: string): Promise<string> {
  const tx = await contract.transferOwnership(fingerprint, newOwner);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * Issue a license for a track on the blockchain.
 * @param fingerprint - The unique fingerprint of the track (bytes32)
 * @param licensee - The address of the licensee (string)
 * @param terms - The license terms (string)
 * @param duration - The license duration in seconds
 * @returns The blockchain transaction hash
 */
export async function issueLicenseOnChain(fingerprint: string, licensee: string, terms: string, duration: number): Promise<string> {
  const tx = await contract.issueLicense(fingerprint, licensee, terms, duration);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

