"use client"

import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync } from '@scure/bip39'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { Network } from './crypto'

// ── Default RPC endpoints ────────────────────────────────────────────────────
// TON: toncenter (CORS-enabled). Free key → 10 req/s, no key → 1 req/s
// Get free key: https://t.me/tonapibot → set NEXT_PUBLIC_TON_API_KEY in .env
const TON_API_KEY = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_TON_API_KEY || '') : ''
const TON_ENDPOINT = TON_API_KEY
    ? `https://toncenter.com/api/v2/jsonRPC?api_key=${TON_API_KEY}`
    : 'https://toncenter.com/api/v2/jsonRPC'
const ETH_ENDPOINT = 'https://cloudflare-eth.com'
const SOL_ENDPOINT = 'https://api.mainnet-beta.solana.com'

// ── Balance fetching ─────────────────────────────────────────────────────────

export async function fetchBalance(address: string, network: Network): Promise<string> {
    try {
        if (network === 'ton') {
            const tonBalanceUrl = `https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}${TON_API_KEY ? `&api_key=${TON_API_KEY}` : ''}`
            const res = await fetch(tonBalanceUrl)
            const data = await res.json()
            if (data.ok) {
                const nanotons = BigInt(data.result)
                return (Number(nanotons) / 1e9).toFixed(4)
            }
            return '0'
        }

        if (network === 'eth') {
            const res = await fetch(ETH_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1,
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                }),
            })
            const data = await res.json()
            const wei = BigInt(data.result)
            return (Number(wei) / 1e18).toFixed(6)
        }

        if (network === 'sol') {
            const res = await fetch(SOL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1,
                    method: 'getBalance',
                    params: [address],
                }),
            })
            const data = await res.json()
            const lamports = data.result?.value ?? 0
            return (lamports / 1e9).toFixed(6)
        }
    } catch {
        // network error — return cached/zero
    }
    return '0'
}

// ── Transaction sending ──────────────────────────────────────────────────────

export async function sendTransaction(
    words: string[],
    network: Network,
    toAddress: string,
    amount: string
): Promise<string> {
    if (network === 'ton') return sendTon(words, toAddress, amount)
    if (network === 'eth') return sendEth(words, toAddress, amount)
    if (network === 'sol') return sendSol(words, toAddress, amount)
    throw new Error(`unsupported network: ${network}`)
}

async function sendTon(words: string[], to: string, amount: string): Promise<string> {
    const { WalletContractV4, TonClient } = await import('@ton/ton')
    const { toNano, internal, Address } = await import('@ton/core')

    const keyPair = await mnemonicToPrivateKey(words)
    const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })

    const client = new TonClient({ endpoint: TON_ENDPOINT })
    const contract = client.open(wallet)

    const seqno = await contract.getSeqno()
    await contract.sendTransfer({
        secretKey: keyPair.secretKey,
        seqno,
        messages: [
            internal({
                to: Address.parse(to),
                value: toNano(amount),
                bounce: false,
            }),
        ],
    })
    return `sent ${amount} TON to ${to}`
}

async function sendEth(words: string[], to: string, amount: string): Promise<string> {
    const { createWalletClient, createPublicClient, http, parseEther } = await import('viem')
    const { mainnet } = await import('viem/chains')
    const { privateKeyToAccount } = await import('viem/accounts')

    const seed = mnemonicToSeedSync(words.join(' '))
    const hd = HDKey.fromMasterSeed(seed)
    const child = hd.derive("m/44'/60'/0'/0/0")
    if (!child.privateKey) throw new Error('key derivation failed')
    const privateKey = ('0x' + Buffer.from(child.privateKey).toString('hex')) as `0x${string}`
    const account = privateKeyToAccount(privateKey)

    const { isAddress } = await import('viem')
    if (!isAddress(to)) throw new Error(`invalid ETH address: ${to}`)

    const walletClient = createWalletClient({ account, chain: mainnet, transport: http(ETH_ENDPOINT) })

    const hash = await walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
        chain: mainnet,
    })
    return hash
}

async function sendSol(words: string[], to: string, amount: string): Promise<string> {
    const { Connection, PublicKey, SystemProgram, Transaction, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = await import('@solana/web3.js')
    const nacl = (await import('tweetnacl')).default

    const seed = mnemonicToSeedSync(words.join(' '))
    const hd = HDKey.fromMasterSeed(seed)
    const child = hd.derive("m/44'/501'/0'/0'")
    if (!child.privateKey) throw new Error('key derivation failed')
    const kp = nacl.sign.keyPair.fromSeed(child.privateKey)
    const keypair = Keypair.fromSecretKey(kp.secretKey)

    const connection = new Connection(SOL_ENDPOINT, 'confirmed')
    const { blockhash } = await connection.getLatestBlockhash()

    const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: keypair.publicKey,
    }).add(
        SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new PublicKey(to),
            lamports: Math.round(parseFloat(amount) * LAMPORTS_PER_SOL),
        })
    )

    const sig = await sendAndConfirmTransaction(connection, transaction, [keypair])
    return sig
}
