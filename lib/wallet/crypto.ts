"use client"

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js'
import { HDKey } from '@scure/bip32'
import { privateKeyToAddress } from 'viem/accounts'
import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import { mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto'

export type Network = 'btc' | 'eth' | 'bsc' | 'sol' | 'ton'

export interface WalletKeys {
    network: Network
    address: string
    privateKeyHex: string
}

export function generateSeedPhrase(wordCount: 12 | 24 = 12): string[] {
    const mnemonic = generateMnemonic(englishWordlist, wordCount === 24 ? 256 : 128)
    return mnemonic.split(' ')
}

export function validateSeedPhrase(words: string[]): boolean {
    return validateMnemonic(words.join(' '), englishWordlist)
}

export async function validateSeedPhraseForNetwork(words: string[], network: Network): Promise<boolean> {
    if (network === 'ton') {
        return mnemonicValidate(words)
    }
    return validateMnemonic(words.join(' '), englishWordlist)
}

export function isPrivKeyImport(words: string[]): boolean {
    return words.length === 2 && words[0] === '__privkey__'
}

export async function deriveAddress(words: string[], network: Network): Promise<string> {
    // Handle imported private key (stored as ['__privkey__', hexKey])
    if (isPrivKeyImport(words)) {
        const hexKey = words[1]
        const privBytes = Uint8Array.from(Buffer.from(hexKey, 'hex'))

        if (network === 'ton') {
            const { WalletContractV4 } = await import('@ton/ton')
            const kp = nacl.sign.keyPair.fromSeed(privBytes)
            const contract = WalletContractV4.create({ publicKey: Buffer.from(kp.publicKey), workchain: 0 })
            return contract.address.toString({ urlSafe: true, bounceable: false })
        }
        if (network === 'btc') {
            const { p2wpkh, NETWORK } = await import('@scure/btc-signer')
            const { secp256k1 } = await import('@noble/curves/secp256k1.js')
            const pubKey = secp256k1.getPublicKey(privBytes, true)
            const payment = p2wpkh(pubKey, NETWORK)
            if (!payment.address) throw new Error('failed to compute BTC address')
            return payment.address
        }
        if (network === 'eth' || network === 'bsc') {
            return privateKeyToAddress(('0x' + hexKey) as `0x${string}`)
        }
        if (network === 'sol') {
            const kp = nacl.sign.keyPair.fromSeed(privBytes)
            return new PublicKey(kp.publicKey).toBase58()
        }
        throw new Error(`unsupported network for privkey import: ${network}`)
    }

    const mnemonic = words.join(' ')

    if (network === 'ton') {
        const keyPair = await mnemonicToPrivateKey(words)
        const { WalletContractV4 } = await import('@ton/ton')
        const contract = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })
        return contract.address.toString({ urlSafe: true, bounceable: false })
    }

    const seed = mnemonicToSeedSync(mnemonic)
    const hd = HDKey.fromMasterSeed(seed)

    if (network === 'btc') {
        const child = hd.derive("m/84'/0'/0'/0/0")  // BIP84 native segwit
        if (!child.publicKey) throw new Error('failed to derive BTC key')
        const { p2wpkh, NETWORK } = await import('@scure/btc-signer')
        const payment = p2wpkh(child.publicKey, NETWORK)
        if (!payment.address) throw new Error('failed to compute BTC address')
        return payment.address
    }

    if (network === 'eth' || network === 'bsc') {
        const child = hd.derive("m/44'/60'/0'/0/0")
        if (!child.privateKey) throw new Error('failed to derive key')
        return privateKeyToAddress(('0x' + Buffer.from(child.privateKey).toString('hex')) as `0x${string}`)
    }

    if (network === 'sol') {
        const child = hd.derive("m/44'/501'/0'/0'")
        if (!child.privateKey) throw new Error('failed to derive SOL key')
        const kp = nacl.sign.keyPair.fromSeed(child.privateKey)
        return new PublicKey(kp.publicKey).toBase58()
    }

    throw new Error(`unsupported network: ${network}`)
}

const PBKDF2_ITERATIONS = 600_000

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']
    )
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

export async function encryptSeed(words: string[], pin: string): Promise<{
    encryptedSeed: string
    salt: string
    iv: string
    iterations: number
}> {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(pin, salt)
    const enc = new TextEncoder()
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(words.join(' '))
    )
    return {
        encryptedSeed: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv)),
        iterations: PBKDF2_ITERATIONS,
    }
}

export async function decryptSeed(
    encryptedSeed: string,
    salt: string,
    iv: string,
    pin: string
): Promise<string[]> {
    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0))
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0))
    const cipherBytes = Uint8Array.from(atob(encryptedSeed), c => c.charCodeAt(0))
    const key = await deriveKey(pin, saltBytes)
    const dec = new TextDecoder()
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, cipherBytes)
    return dec.decode(plaintext).split(' ')
}

export interface StoredWallet {
    encryptedSeed: string
    salt: string
    iv: string
    iterations: number
    address: string
    network: Network
}

const STORAGE_KEY = 'ccw_wallet'

export function loadStoredWallet(): StoredWallet | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function saveWallet(wallet: StoredWallet): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet))
}

export function clearWallet(): void {
    localStorage.removeItem(STORAGE_KEY)
}

export function networkLabel(network: Network): string {
    return { btc: 'Bitcoin', eth: 'Ethereum', bsc: 'BNB Chain', sol: 'Solana', ton: 'TON' }[network]
}

export function networkCurrency(network: Network): string {
    return { btc: 'BTC', eth: 'ETH', bsc: 'BNB', sol: 'SOL', ton: 'TON' }[network]
}
