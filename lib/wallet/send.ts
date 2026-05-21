"use client"

import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync } from '@scure/bip39'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { Network, isPrivKeyImport } from './crypto'

// ── Default RPC endpoints ────────────────────────────────────────────────────
// TON: toncenter (CORS-enabled). Free key → 10 req/s, no key → 1 req/s
// Get free key: https://t.me/tonapibot → set NEXT_PUBLIC_TON_API_KEY in .env
const TON_API_KEY = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_TON_API_KEY || '') : ''
const TON_ENDPOINT = TON_API_KEY
    ? `https://toncenter.com/api/v2/jsonRPC?api_key=${TON_API_KEY}`
    : 'https://toncenter.com/api/v2/jsonRPC'
const ETH_ENDPOINT = 'https://cloudflare-eth.com'
const BSC_ENDPOINT = 'https://bsc-dataseed.binance.org/'
const SOL_ENDPOINT = 'https://api.mainnet-beta.solana.com'
const BTC_API = 'https://mempool.space/api'

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

        if (network === 'btc') {
            const res = await fetch(`${BTC_API}/address/${address}`)
            const data = await res.json()
            const sats = (data.chain_stats?.funded_txo_sum ?? 0) - (data.chain_stats?.spent_txo_sum ?? 0)
            return (sats / 1e8).toFixed(8)
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

        if (network === 'bsc') {
            const res = await fetch(BSC_ENDPOINT, {
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
    if (network === 'btc') return sendBtc(words, toAddress, amount)
    if (network === 'eth') return sendEth(words, toAddress, amount)
    if (network === 'bsc') return sendBsc(words, toAddress, amount)
    if (network === 'sol') return sendSol(words, toAddress, amount)
    if (network === 'ton') return sendTon(words, toAddress, amount)
    throw new Error(`unsupported network: ${network}`)
}

async function sendBtc(words: string[], to: string, amount: string): Promise<string> {
    const { p2wpkh, Transaction, NETWORK } = await import('@scure/btc-signer')

    let privateKeyBytes: Uint8Array
    if (isPrivKeyImport(words)) {
        privateKeyBytes = Uint8Array.from(Buffer.from(words[1], 'hex'))
    } else {
        const seed = mnemonicToSeedSync(words.join(' '))
        const hd = HDKey.fromMasterSeed(seed)
        const child = hd.derive("m/84'/0'/0'/0/0")
        if (!child.privateKey) throw new Error('key derivation failed')
        privateKeyBytes = child.privateKey
    }

    const { secp256k1 } = await import('@noble/curves/secp256k1.js')
    const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

    // Shim child-like object for the rest of the function
    const child = { privateKey: privateKeyBytes, publicKey: publicKeyBytes }
    if (!child.privateKey || !child.publicKey) throw new Error('key derivation failed')

    const payment = p2wpkh(child.publicKey, NETWORK)
    const fromAddress = payment.address!

    // Fetch UTXOs
    const utxoRes = await fetch(`${BTC_API}/address/${fromAddress}/utxo`)
    const utxos: { txid: string; vout: number; value: number }[] = await utxoRes.json()
    if (!utxos.length) throw new Error('no UTXOs available')

    // Fetch recommended fee rate (sat/vbyte)
    const feeRes = await fetch(`${BTC_API}/v1/fees/recommended`)
    const fees = await feeRes.json()
    const feeRate = fees.halfHourFee ?? 10

    const satAmount = Math.round(parseFloat(amount) * 1e8)
    const estimatedFee = feeRate * 141  // ~141 vbytes for 1-in-2-out P2WPKH

    const tx = new Transaction()
    let inputSum = 0
    for (const utxo of utxos) {
        const rawTxRes = await fetch(`${BTC_API}/tx/${utxo.txid}/hex`)
        const rawTx = await rawTxRes.text()
        tx.addInput({
            txid: utxo.txid,
            index: utxo.vout,
            witnessUtxo: { script: payment.script, amount: BigInt(utxo.value) },
        })
        inputSum += utxo.value
        if (inputSum >= satAmount + estimatedFee) break
    }

    if (inputSum < satAmount + estimatedFee) throw new Error('insufficient balance')

    tx.addOutputAddress(to, BigInt(satAmount), NETWORK)
    const change = inputSum - satAmount - estimatedFee
    if (change > 546) tx.addOutputAddress(fromAddress, BigInt(change), NETWORK)

    tx.sign(child.privateKey)
    tx.finalize()

    const rawHex = tx.hex
    const broadcastRes = await fetch(`${BTC_API}/tx`, { method: 'POST', body: rawHex })
    if (!broadcastRes.ok) throw new Error(await broadcastRes.text())
    return await broadcastRes.text()  // txid
}

async function sendBsc(words: string[], to: string, amount: string): Promise<string> {
    const { createWalletClient, http, parseEther, isAddress } = await import('viem')
    const { bsc } = await import('viem/chains')
    const { privateKeyToAccount } = await import('viem/accounts')

    let privateKey: `0x${string}`
    if (isPrivKeyImport(words)) {
        privateKey = ('0x' + words[1]) as `0x${string}`
    } else {
        const seed = mnemonicToSeedSync(words.join(' '))
        const hd = HDKey.fromMasterSeed(seed)
        const child = hd.derive("m/44'/60'/0'/0/0")
        if (!child.privateKey) throw new Error('key derivation failed')
        privateKey = ('0x' + Buffer.from(child.privateKey).toString('hex')) as `0x${string}`
    }
    const account = privateKeyToAccount(privateKey)

    if (!isAddress(to)) throw new Error(`invalid BSC address: ${to}`)

    const walletClient = createWalletClient({ account, chain: bsc, transport: http(BSC_ENDPOINT) })
    return walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
        chain: bsc,
    })
}

async function sendTon(words: string[], to: string, amount: string): Promise<string> {
    const { WalletContractV4, TonClient } = await import('@ton/ton')
    const { toNano, internal, Address } = await import('@ton/core')

    let keyPair: { publicKey: Buffer; secretKey: Buffer }
    if (isPrivKeyImport(words)) {
        const nacl = (await import('tweetnacl')).default
        const privBytes = Buffer.from(words[1], 'hex')
        const kp = nacl.sign.keyPair.fromSeed(privBytes)
        keyPair = { publicKey: Buffer.from(kp.publicKey), secretKey: Buffer.from(kp.secretKey) }
    } else {
        keyPair = await mnemonicToPrivateKey(words)
    }
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

    let privateKey: `0x${string}`
    if (isPrivKeyImport(words)) {
        privateKey = ('0x' + words[1]) as `0x${string}`
    } else {
        const seed = mnemonicToSeedSync(words.join(' '))
        const hd = HDKey.fromMasterSeed(seed)
        const child = hd.derive("m/44'/60'/0'/0/0")
        if (!child.privateKey) throw new Error('key derivation failed')
        privateKey = ('0x' + Buffer.from(child.privateKey).toString('hex')) as `0x${string}`
    }
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

    let keypair: InstanceType<typeof Keypair>
    if (isPrivKeyImport(words)) {
        const privBytes = Buffer.from(words[1], 'hex')
        const kp = nacl.sign.keyPair.fromSeed(privBytes)
        keypair = Keypair.fromSecretKey(kp.secretKey)
    } else {
        const seed = mnemonicToSeedSync(words.join(' '))
        const hd = HDKey.fromMasterSeed(seed)
        const child = hd.derive("m/44'/501'/0'/0'")
        if (!child.privateKey) throw new Error('key derivation failed')
        const kp = nacl.sign.keyPair.fromSeed(child.privateKey)
        keypair = Keypair.fromSecretKey(kp.secretKey)
    }

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
