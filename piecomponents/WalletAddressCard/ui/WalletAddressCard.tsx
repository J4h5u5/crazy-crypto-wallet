"use client"
import React, { useState, useEffect } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useSearchParams, useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { loadStoredWallet, clearWallet, networkLabel, networkCurrency, Network } from '@/lib/wallet/crypto'
import { fetchBalance } from '@/lib/wallet/send'
import { WalletAddressCardProps } from '../types'

const WalletAddressCard = ({ data }: WalletAddressCardProps) => {
    const { title, subtitle } = data
    const router = useRouter()
    const searchParams = useSearchParams()
    const [wallet, setWallet] = useState<{ address: string; network: Network } | null>(null)
    const [copied, setCopied] = useState(false)
    const [balance, setBalance] = useState<string>('...')

    useEffect(() => {
        const stored = loadStoredWallet()
        if (stored) {
            const net = (searchParams.get('network') || stored.network) as Network
            setWallet({ address: stored.address, network: net })
        }
    }, [searchParams])

    useEffect(() => {
        if (!wallet?.address) return
        setBalance('...')
        fetchBalance(wallet.address, wallet.network).then(setBalance)
    }, [wallet])

    const handleCopy = () => {
        if (wallet?.address) {
            navigator.clipboard.writeText(wallet.address).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
        }
    }

    const handleReset = () => {
        if (confirm('this will delet ur wallet. make sure u have ur seed phrase. really sure?')) {
            clearWallet()
            window.location.href = '/'
        }
    }

    const net = wallet?.network || 'ton'
    const netLabel = networkLabel(net as Network)
    const currency = networkCurrency(net as Network)
    const address = wallet?.address || ''

    return (
        <PieCard card='WalletAddressCard' data={data}>
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 28px',
                background: '#f2f2f7',
            }}>
                <div style={{
                    padding: '4px 12px',
                    background: '#1c1c1e',
                    borderRadius: '4px 12px 4px 12px',
                    fontSize: 11,
                    color: '#f2f2f7',
                    fontWeight: 600,
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    letterSpacing: '0.05em',
                    marginBottom: 16,
                }}>
                    {netLabel}
                </div>

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
                    marginTop: 6,
                    fontSize: 12,
                    color: '#636366',
                    textAlign: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {subtitle}
                </p>

                {/* QR */}
                <div style={{
                    marginTop: 24,
                    padding: 16,
                    background: '#fff',
                    borderRadius: '16px 4px 16px 4px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                }}>
                    {address ? (
                        <QRCode value={address} size={180} />
                    ) : (
                        <div style={{ width: 180, height: 180, background: '#f2f2f7', borderRadius: 8 }} />
                    )}
                </div>

                {/* Address */}
                <div style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    background: '#fff',
                    borderRadius: '4px 12px 4px 12px',
                    maxWidth: 300,
                    width: '100%',
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: 11,
                        color: '#636366',
                        wordBreak: 'break-all',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        lineHeight: 1.6,
                    }}>
                        {address || 'loading...'}
                    </p>
                </div>

                {/* Balance */}
                <div style={{
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                }}>
                    <span style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: '#1c1c1e',
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        letterSpacing: '-1px',
                    }}>
                        {balance}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#636366', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        {currency}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            if (!wallet?.address) return
                            setBalance('...')
                            fetchBalance(wallet.address, wallet.network).then(setBalance)
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 14,
                            color: '#007aff',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                        }}
                    >
                        ↻
                    </button>
                </div>

                {/* Copy button */}
                <div style={{ marginTop: 28, width: '100%', maxWidth: 300 }}>
                    <button
                        type="button"
                        onClick={handleCopy}
                        style={{
                            width: '100%',
                            padding: '15px 24px',
                            background: copied ? '#34c759' : '#1c1c1e',
                            color: '#f2f2f7',
                            border: 'none',
                            borderRadius: '18px 4px 18px 4px',
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            transition: 'background 0.2s',
                        }}
                    >
                        {copied ? 'copyed! ✓' : 'copi adress'}
                    </button>
                </div>

                {/* Send button */}
                <div style={{ marginTop: 10, width: '100%', maxWidth: 300 }}>
                    <button
                        type="button"
                        onClick={() => router.push(`/wallet/send?network=${net}`)}
                        style={{
                            width: '100%',
                            padding: '15px 24px',
                            background: 'transparent',
                            color: '#1c1c1e',
                            border: '2px solid #1c1c1e',
                            borderRadius: '4px 18px 4px 18px',
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        }}
                        onMouseDown={e => (e.currentTarget.style.opacity = '0.75')}
                        onMouseUp={e => (e.currentTarget.style.opacity = '1')}
                        onTouchStart={e => (e.currentTarget.style.opacity = '0.75')}
                        onTouchEnd={e => (e.currentTarget.style.opacity = '1')}
                    >
                        snd coins →
                    </button>
                </div>

                {/* Shitcoins button */}
                <div style={{ marginTop: 10, width: '100%', maxWidth: 300 }}>
                    <button
                        type="button"
                        onClick={() => router.push(`/wallet/tokens?network=${net}`)}
                        style={{
                            width: '100%',
                            padding: '15px 24px',
                            background: 'transparent',
                            color: '#636366',
                            border: '2px solid #e5e5ea',
                            borderRadius: '18px 4px 18px 4px',
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        }}
                        onMouseDown={e => (e.currentTarget.style.opacity = '0.75')}
                        onMouseUp={e => (e.currentTarget.style.opacity = '1')}
                        onTouchStart={e => (e.currentTarget.style.opacity = '0.75')}
                        onTouchEnd={e => (e.currentTarget.style.opacity = '1')}
                    >
                        shitcoins 🪙
                    </button>
                </div>

                {/* Reset / danger zone */}
                <button
                    type="button"
                    onClick={handleReset}
                    style={{
                        marginTop: 32,
                        background: 'none',
                        border: 'none',
                        color: '#ff3b30',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        opacity: 0.6,
                    }}
                >
                    delet wallet (rip)
                </button>
            </div>
        </PieCard>
    )
}

export default WalletAddressCard
