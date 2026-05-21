"use client"
import React, { useState, useRef, useEffect } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter, useSearchParams } from 'next/navigation'
import { validateSeedPhraseForNetwork, deriveAddress, Network } from '@/lib/wallet/crypto'
import { useWallet } from '@/components/WalletContext'
import { SeedInputCardProps } from '../types'

type Mode = 'seed' | 'privkey'

// secp256k1 curve order — private key must be strictly within (0, ORDER)
const SECP256K1_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141')

function checkSecp256k1Range(hex: string): boolean {
    const k = BigInt('0x' + hex)
    return k > BigInt(0) && k < SECP256K1_ORDER
}

async function normalizePrivKey(raw: string, net: Network): Promise<string | null> {
    const trimmed = raw.trim()

    if (net === 'eth' || net === 'bsc') {
        const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null
        return checkSecp256k1Range(hex) ? hex.toLowerCase() : null
    }

    if (net === 'ton') {
        // TON uses Ed25519 — any 32-byte non-zero value is valid
        const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null
        return BigInt('0x' + hex) > BigInt(0) ? hex.toLowerCase() : null
    }

    if (net === 'btc') {
        // WIF format (compressed or uncompressed)
        if (/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(trimmed)) {
            try {
                const { WIF, NETWORK } = await import('@scure/btc-signer')
                const decoded = WIF(NETWORK).decode(trimmed)
                const hex = Buffer.from(decoded).toString('hex')
                return checkSecp256k1Range(hex) ? hex : null
            } catch { return null }
        }
        const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null
        return checkSecp256k1Range(hex) ? hex.toLowerCase() : null
    }

    if (net === 'sol') {
        // SOL uses Ed25519 — any 32-byte non-zero seed is valid
        // Base58-encoded full 64-byte keypair (phantom/solflare export)
        if (/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(trimmed)) {
            try {
                const { base58 } = await import('@scure/base')
                const decoded = base58.decode(trimmed)
                if (decoded.length >= 32) return Buffer.from(decoded.slice(0, 32)).toString('hex')
            } catch { return null }
        }
        const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null
        return BigInt('0x' + hex) > BigInt(0) ? hex.toLowerCase() : null
    }

    if (net === 'waves') {
        // WAVES base58 private key (~44 chars, as exported by Waves Keeper / exchange)
        if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(trimmed)) {
            try {
                const { base58Decode } = await import('@waves/ts-lib-crypto')
                const decoded = base58Decode(trimmed)
                if (decoded.length === 32) return Buffer.from(decoded).toString('hex')
            } catch { return null }
        }
        // raw hex
        const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null
        return BigInt('0x' + hex) > BigInt(0) ? hex.toLowerCase() : null
    }

    return null
}

const SeedInputCard = ({ data }: SeedInputCardProps) => {
    const { title } = data
    const router = useRouter()
    const searchParams = useSearchParams()
    const network = (searchParams.get('network') || 'ton') as Network
    const { setSeedWords } = useWallet()

    const [mode, setMode] = useState<Mode>('seed')
    const [wordCount, setWordCount] = useState<12 | 24>(12)
    const [words, setWords] = useState<string[]>(Array(12).fill(''))
    const [privKey, setPrivKey] = useState('')
    const [addressPreview, setAddressPreview] = useState<string | null>(null)
    const [error, setError] = useState('')
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Derive address preview whenever privKey or network changes in privkey mode
    useEffect(() => {
        if (mode !== 'privkey' || !privKey.trim()) {
            setAddressPreview(null)
            return
        }
        let cancelled = false
        ;(async () => {
            const hexKey = await normalizePrivKey(privKey, network)
            if (cancelled || !hexKey) { setAddressPreview(null); return }
            try {
                const addr = await deriveAddress(['__privkey__', hexKey], network)
                if (!cancelled) setAddressPreview(addr)
            } catch {
                if (!cancelled) setAddressPreview(null)
            }
        })()
        return () => { cancelled = true }
    }, [privKey, network, mode])

    const dynamicSubtitle = mode === 'privkey'
        ? "paste ur private key. we wont tell anyone."
        : wordCount === 12
            ? "12 words, in order, dont mess it up"
            : "24 words. yeah really. hope u have time."

    const handleModeChange = (m: Mode) => {
        setMode(m)
        setError('')
    }

    const handleWordCountChange = (n: 12 | 24) => {
        setMode('seed')
        setWordCount(n)
        setWords(Array(n).fill(''))
        setError('')
        inputRefs.current = []
    }

    const updateWord = (i: number, val: string) => {
        const parts = val.trim().split(/\s+/)
        if (parts.length === wordCount && i === 0) {
            setWords(parts.slice(0, wordCount))
            setError('')
            return
        }
        const next = [...words]
        next[i] = val.trim()
        setWords(next)
        setError('')
    }

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            inputRefs.current[i + 1]?.focus()
        }
    }

    const handleConfirmSeed = async () => {
        const trimmed = words.map(w => w.trim().toLowerCase())
        if (trimmed.some(w => !w)) {
            setError(`fill in all ${wordCount} words. yes all of them.`)
            return
        }
        const valid = await validateSeedPhraseForNetwork(trimmed, network)
        if (!valid) {
            setError('invalid seed phrase. did u typo? classic.')
            return
        }
        setSeedWords(trimmed, network)
        router.push(`/wallet/pin?network=${network}&flow=import`)
    }

    const handleConfirmPrivKey = async () => {
        if (!privKey.trim()) {
            setError('paste ur key first genius')
            return
        }
        const hexKey = await normalizePrivKey(privKey, network)
        if (!hexKey) {
            setError(`invalid ${network.toUpperCase()} private key format`)
            return
        }
        setSeedWords(['__privkey__', hexKey], network)
        router.push(`/wallet/pin?network=${network}&flow=import`)
    }

    const isSeedActive = mode === 'seed'
    const isPrivkeyActive = mode === 'privkey'

    const tabStyle = (active: boolean) => ({
        padding: '7px 16px',
        background: active ? '#1c1c1e' : 'transparent',
        color: active ? '#f2f2f7' : '#636366',
        border: 'none',
        borderRadius: '8px 2px 8px 2px',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        transition: 'all 0.15s',
    })

    return (
        <PieCard card='SeedInputCard' data={data}>
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 28px',
                background: '#f2f2f7',
            }}>
                <h1 style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#1c1c1e',
                    margin: 0,
                    letterSpacing: '-0.8px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    textAlign: 'center',
                }}>
                    {title}
                </h1>
                <p style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: '#636366',
                    textAlign: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {dynamicSubtitle}
                </p>

                {/* 12 / 24 / priv key tabs */}
                <div style={{
                    marginTop: 20,
                    display: 'flex',
                    background: '#e5e5ea',
                    borderRadius: '10px 3px 10px 3px',
                    padding: 3,
                    gap: 3,
                }}>
                    <button type="button" onClick={() => handleWordCountChange(12)} style={tabStyle(isSeedActive && wordCount === 12)}>
                        12 wrds
                    </button>
                    <button type="button" onClick={() => handleWordCountChange(24)} style={tabStyle(isSeedActive && wordCount === 24)}>
                        24 wrds
                    </button>
                    <button type="button" onClick={() => handleModeChange('privkey')} style={tabStyle(isPrivkeyActive)}>
                        priv key
                    </button>
                </div>

                {/* Seed phrase grid */}
                {isSeedActive && (
                    <div style={{
                        marginTop: 24,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 8,
                        width: '100%',
                        maxWidth: 340,
                    }}>
                        {words.map((word, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    top: 6,
                                    left: 8,
                                    fontSize: 9,
                                    color: '#aeaeb2',
                                    fontFamily: 'monospace',
                                }}>
                                    {i + 1}
                                </span>
                                <input
                                    ref={el => { inputRefs.current[i] = el }}
                                    type="text"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    value={word}
                                    onChange={e => updateWord(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        paddingTop: 18,
                                        paddingBottom: 8,
                                        paddingLeft: 8,
                                        paddingRight: 6,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#1c1c1e',
                                        background: '#fff',
                                        border: `1.5px solid ${word ? '#1c1c1e' : '#e5e5ea'}`,
                                        borderRadius: i % 2 === 0 ? '10px 3px 10px 3px' : '3px 10px 3px 10px',
                                        outline: 'none',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Private key textarea */}
                {isPrivkeyActive && (
                    <div style={{ marginTop: 24, width: '100%', maxWidth: 340 }}>
                        <textarea
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            value={privKey}
                            onChange={e => { setPrivKey(e.target.value); setError('') }}
                            placeholder={
                                network === 'btc'
                                    ? 'WIF (K…/L…/5…) or 64 hex chars'
                                    : network === 'sol'
                                        ? 'base58 keypair or 64 hex chars'
                                        : network === 'waves'
                                            ? 'base58 private key or 64 hex chars'
                                            : '64 hex chars (0x optional)'
                            }
                            rows={4}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '12px 14px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#1c1c1e',
                                background: '#fff',
                                border: `1.5px solid ${privKey ? (addressPreview ? '#34c759' : '#ff3b30') : '#e5e5ea'}`,
                                borderRadius: '10px 3px 10px 3px',
                                outline: 'none',
                                fontFamily: 'monospace',
                                resize: 'none',
                                lineHeight: 1.5,
                                transition: 'border-color 0.2s',
                            }}
                        />
                        {addressPreview && (
                            <div style={{
                                marginTop: 8,
                                padding: '10px 12px',
                                background: '#d1f5dc',
                                borderRadius: '3px 10px 3px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                            }}>
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#1a7a3a',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    ur address
                                </span>
                                <span style={{
                                    fontSize: 11,
                                    color: '#1c1c1e',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                }}>
                                    {addressPreview}
                                </span>
                            </div>
                        )}
                        {privKey && !addressPreview && (
                            <div style={{
                                marginTop: 8,
                                padding: '8px 12px',
                                background: '#ffeaea',
                                borderRadius: '3px 10px 3px 10px',
                            }}>
                                <span style={{
                                    fontSize: 11,
                                    color: '#c0392b',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                }}>
                                    invalid key format
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <p style={{
                        marginTop: 12,
                        fontSize: 12,
                        color: '#ff3b30',
                        textAlign: 'center',
                        maxWidth: 280,
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}>
                        {error}
                    </p>
                )}

                <div style={{ marginTop: 24, width: '100%', maxWidth: 320 }}>
                    <button
                        type="button"
                        onClick={isSeedActive ? handleConfirmSeed : handleConfirmPrivKey}
                        style={{
                            width: '100%',
                            padding: '17px 24px',
                            background: '#1c1c1e',
                            color: '#f2f2f7',
                            border: 'none',
                            borderRadius: '18px 4px 18px 4px',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        }}
                        onMouseDown={e => (e.currentTarget.style.opacity = '0.75')}
                        onMouseUp={e => (e.currentTarget.style.opacity = '1')}
                        onTouchStart={e => (e.currentTarget.style.opacity = '0.75')}
                        onTouchEnd={e => (e.currentTarget.style.opacity = '1')}
                    >
                        improt it (fingers crosed) →
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => router.back()}
                    style={{
                        marginTop: 16,
                        background: 'none',
                        border: 'none',
                        color: '#636366',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}
                >
                    ← go bak
                </button>
            </div>
        </PieCard>
    )
}

export default SeedInputCard
