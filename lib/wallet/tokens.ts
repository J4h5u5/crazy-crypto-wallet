"use client"

import { Network } from './crypto'

export interface TokenBalance {
    symbol: string
    name: string
    balance: string       // human-readable
    rawBalance: string    // raw integer string
    contractAddress: string
    decimals: number
    logoUrl?: string
}

const TON_API_KEY = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_TON_API_KEY || '') : ''

// Popular ERC-20 tokens to check on ETH
const ETH_TOKENS: { symbol: string; name: string; address: string; decimals: number }[] = [
    { symbol: 'USDT', name: 'Tether USD',      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin',         address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'DAI',  name: 'Dai',              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { symbol: 'WBTC', name: 'Wrapped BTC',      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    { symbol: 'WETH', name: 'Wrapped ETH',      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    { symbol: 'LINK', name: 'Chainlink',        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
    { symbol: 'UNI',  name: 'Uniswap',          address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
]

export async function fetchTokenBalances(address: string, network: Network): Promise<TokenBalance[]> {
    if (network === 'ton') return fetchTonJettons(address)
    if (network === 'eth') return fetchEthTokens(address)
    if (network === 'sol') return fetchSolTokens(address)
    return []
}

// ── TON: tonapi.io jetton balances ───────────────────────────────────────────
async function fetchTonJettons(address: string): Promise<TokenBalance[]> {
    try {
        const res = await fetch(
            `https://tonapi.io/v2/accounts/${encodeURIComponent(address)}/jettons?supported_extensions=custom_payload`,
            { headers: { 'Accept': 'application/json' } }
        )
        const data = await res.json()
        const balances: TokenBalance[] = []
        for (const item of data.balances ?? []) {
            const raw = item.balance ?? '0'
            const decimals = item.jetton?.decimals ?? 9
            const human = (Number(BigInt(raw)) / Math.pow(10, decimals)).toFixed(decimals > 6 ? 4 : 2)
            if (raw === '0') continue
            balances.push({
                symbol: item.jetton?.symbol ?? '???',
                name: item.jetton?.name ?? 'Unknown',
                balance: human,
                rawBalance: raw,
                contractAddress: item.jetton?.address ?? '',
                decimals,
                logoUrl: item.jetton?.image,
            })
        }
        return balances
    } catch {
        return []
    }
}

// ── ETH: balanceOf() for popular ERC-20s ────────────────────────────────────
async function fetchEthTokens(address: string): Promise<TokenBalance[]> {
    const ETH_RPC = 'https://cloudflare-eth.com'
    // balanceOf(address) selector: 0x70a08231
    const calls = ETH_TOKENS.map(t => ({
        jsonrpc: '2.0', id: t.address,
        method: 'eth_call',
        params: [{ to: t.address, data: '0x70a08231' + address.slice(2).padStart(64, '0') }, 'latest'],
    }))

    try {
        const res = await fetch(ETH_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(calls),
        })
        const results: { id: string; result: string }[] = await res.json()
        const balances: TokenBalance[] = []
        for (const r of results) {
            const token = ETH_TOKENS.find(t => t.address === r.id)
            if (!token || !r.result || r.result === '0x') continue
            const raw = BigInt(r.result)
            if (raw === BigInt(0)) continue
            const human = (Number(raw) / Math.pow(10, token.decimals)).toFixed(token.decimals > 6 ? 4 : 2)
            balances.push({
                symbol: token.symbol,
                name: token.name,
                balance: human,
                rawBalance: raw.toString(),
                contractAddress: token.address,
                decimals: token.decimals,
            })
        }
        return balances
    } catch {
        return []
    }
}

// ── SOL: SPL token accounts ──────────────────────────────────────────────────
async function fetchSolTokens(address: string): Promise<TokenBalance[]> {
    const SOL_RPC = 'https://api.mainnet-beta.solana.com'
    try {
        const res = await fetch(SOL_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1,
                method: 'getTokenAccountsByOwner',
                params: [
                    address,
                    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                    { encoding: 'jsonParsed' },
                ],
            }),
        })
        const data = await res.json()
        const balances: TokenBalance[] = []
        for (const acct of data.result?.value ?? []) {
            const info = acct.account?.data?.parsed?.info
            if (!info) continue
            const amount = info.tokenAmount
            if (!amount || amount.uiAmount === 0 || amount.uiAmount === null) continue
            balances.push({
                symbol: info.mint?.slice(0, 6) ?? '???',
                name: 'SPL Token',
                balance: amount.uiAmountString,
                rawBalance: amount.amount,
                contractAddress: info.mint ?? '',
                decimals: amount.decimals,
            })
        }
        return balances
    } catch {
        return []
    }
}

// ── TON Jetton transfer ──────────────────────────────────────────────────────
export async function sendJetton(
    words: string[],
    jettonMasterAddress: string,
    toAddress: string,
    amount: string,
    decimals: number
): Promise<string> {
    const { WalletContractV4, TonClient, JettonMaster, JettonWallet } = await import('@ton/ton')
    const { toNano, Address, internal, beginCell } = await import('@ton/core')
    const { mnemonicToPrivateKey } = await import('@ton/crypto')

    const TON_API_KEY_VAL = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_TON_API_KEY || '') : ''
    const endpoint = TON_API_KEY_VAL
        ? `https://toncenter.com/api/v2/jsonRPC?api_key=${TON_API_KEY_VAL}`
        : 'https://toncenter.com/api/v2/jsonRPC'

    const keyPair = await mnemonicToPrivateKey(words)
    const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })
    const client = new TonClient({ endpoint })
    const contract = client.open(wallet)

    const jettonMaster = client.open(JettonMaster.create(Address.parse(jettonMasterAddress)))
    const jettonWalletAddr = await jettonMaster.getWalletAddress(Address.parse(wallet.address.toString()))
    const jettonWallet = client.open(JettonWallet.create(jettonWalletAddr))

    const rawAmount = BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))

    const seqno = await contract.getSeqno()
    await contract.sendTransfer({
        secretKey: keyPair.secretKey,
        seqno,
        messages: [
            internal({
                to: jettonWalletAddr,
                value: toNano('0.05'), // gas for jetton transfer
                bounce: true,
                body: beginCell()
                    .storeUint(0xf8a7ea5, 32)  // jetton transfer op
                    .storeUint(0, 64)           // query_id
                    .storeCoins(rawAmount)       // jetton amount
                    .storeAddress(Address.parse(toAddress))  // destination
                    .storeAddress(Address.parse(wallet.address.toString()))  // response destination
                    .storeBit(false)             // no custom payload
                    .storeCoins(0)               // forward amount
                    .storeBit(false)             // no forward payload
                    .endCell(),
            }),
        ],
    })
    return `sent ${amount} jettons to ${toAddress}`
}

// ── ETH ERC-20 transfer ──────────────────────────────────────────────────────
export async function sendErc20(
    words: string[],
    tokenAddress: string,
    toAddress: string,
    amount: string,
    decimals: number
): Promise<string> {
    const { createWalletClient, http, encodeFunctionData } = await import('viem')
    const { mainnet } = await import('viem/chains')
    const { privateKeyToAccount } = await import('viem/accounts')
    const { HDKey } = await import('@scure/bip32')
    const { mnemonicToSeedSync } = await import('@scure/bip39')

    const seed = mnemonicToSeedSync(words.join(' '))
    const hd = HDKey.fromMasterSeed(seed)
    const child = hd.derive("m/44'/60'/0'/0/0")
    if (!child.privateKey) throw new Error('key derivation failed')
    const privateKey = ('0x' + Buffer.from(child.privateKey).toString('hex')) as `0x${string}`
    const account = privateKeyToAccount(privateKey)

    const rawAmount = BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))

    const walletClient = createWalletClient({ account, chain: mainnet, transport: http('https://cloudflare-eth.com') })
    const hash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        chain: mainnet,
        data: encodeFunctionData({
            abi: [{ name: 'transfer', type: 'function', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }] }],
            functionName: 'transfer',
            args: [toAddress as `0x${string}`, rawAmount],
        }),
    })
    return hash
}

// ── SOL SPL transfer ─────────────────────────────────────────────────────────
export async function sendSplToken(
    words: string[],
    mintAddress: string,
    toAddress: string,
    amount: string,
    decimals: number
): Promise<string> {
    const { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction } = await import('@solana/web3.js')
    const nacl = (await import('tweetnacl')).default
    const { HDKey } = await import('@scure/bip32')
    const { mnemonicToSeedSync } = await import('@scure/bip39')

    const seed = mnemonicToSeedSync(words.join(' '))
    const hd = HDKey.fromMasterSeed(seed)
    const child = hd.derive("m/44'/501'/0'/0'")
    if (!child.privateKey) throw new Error('key derivation failed')
    const kp = nacl.sign.keyPair.fromSeed(child.privateKey)
    const keypair = Keypair.fromSecretKey(kp.secretKey)

    const { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token')

    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    const mint = new PublicKey(mintAddress)
    const destination = new PublicKey(toAddress)

    const fromAta = await getAssociatedTokenAddress(mint, keypair.publicKey)
    const toAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, destination)

    const rawAmount = BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))
    const { blockhash } = await connection.getLatestBlockhash()

    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: keypair.publicKey }).add(
        createTransferInstruction(fromAta, toAta.address, keypair.publicKey, rawAmount, [], TOKEN_PROGRAM_ID)
    )
    return sendAndConfirmTransaction(connection, tx, [keypair])
}
