"use client"
import React, { useState, useEffect } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStoredWallet, decryptSeed, clearWallet, networkLabel, Network } from '@/lib/wallet/crypto'
import { useWallet } from '@/components/WalletContext'
import { UnlockCardProps } from '../types'

const UnlockCard = ({ data }: UnlockCardProps) => {
    const { title, subtitle } = data
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setSeedWords } = useWallet()

    const [storedWallet, setStoredWallet] = useState<ReturnType<typeof loadStoredWallet>>(null)
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const w = loadStoredWallet()
        if (!w) router.replace('/')
        else setStoredWallet(w)
    }, [router])

    const pinLength = storedWallet ? (storedWallet.encryptedSeed ? 10 : 6) : 6
    const maxPin = 10

    const handleDigit = (d: string) => {
        if (pin.length < maxPin) {
            setPin(prev => prev + d)
            setError('')
        }
    }

    const handleDelete = () => setPin(prev => prev.slice(0, -1))

    const handleUnlock = async () => {
        if (!storedWallet) return
        setLoading(true)
        try {
            const words = await decryptSeed(
                storedWallet.encryptedSeed,
                storedWallet.salt,
                storedWallet.iv,
                pin
            )
            setSeedWords(words, storedWallet.network as Network)
            const next = searchParams.get('next')
            router.push(next || `/wallet/address?network=${storedWallet.network}`)
        } catch {
            setError('wrong pin. or ur wallet is corrupted. sorry.')
            setPin('')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (pin.length >= 4 && pin.length <= maxPin) {
            // auto-submit when pin matches expected length from any valid 4-10 digit pin
            // user taps the unlock button when ready
        }
    }, [pin])

    const net = (storedWallet?.network || 'ton') as Network
    const netLabel = networkLabel(net)
    const addressHint = storedWallet?.address
        ? storedWallet.address.slice(0, 6) + '...' + storedWallet.address.slice(-4)
        : ''

    return (
        <PieCard card='UnlockCard' data={data}>
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
                    width: 64,
                    height: 64,
                    background: '#1c1c1e',
                    borderRadius: '18px 4px 18px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    marginBottom: 16,
                }}>
                    🔒
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
                    maxWidth: 260,
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {subtitle}
                </p>

                {addressHint && (
                    <span style={{
                        marginTop: 8,
                        padding: '3px 10px',
                        background: '#e5e5ea',
                        borderRadius: '4px 10px 4px 10px',
                        fontSize: 11,
                        color: '#636366',
                        fontFamily: 'monospace',
                    }}>
                        {netLabel} · {addressHint}
                    </span>
                )}

                {/* PIN dots */}
                <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 280 }}>
                    {Array.from({ length: Math.min(pin.length || 4, maxPin) }).map((_, i) => (
                        <div key={i} style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: i < pin.length ? '#1c1c1e' : '#c7c7cc',
                        }} />
                    ))}
                </div>

                {/* Numpad */}
                <div style={{
                    marginTop: 20,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 10,
                    width: '100%',
                    maxWidth: 260,
                }}>
                    {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                        <button
                            key={i}
                            type="button"
                            disabled={d === ''}
                            onClick={() => {
                                if (d === '⌫') handleDelete()
                                else if (d) handleDigit(d)
                            }}
                            style={{
                                padding: '14px 0',
                                background: d === '' ? 'transparent' : '#fff',
                                border: d === '' ? 'none' : '1.5px solid #e5e5ea',
                                borderRadius: i % 2 === 0 ? '12px 3px 12px 3px' : '3px 12px 3px 12px',
                                fontSize: d === '⌫' ? 18 : 20,
                                fontWeight: 600,
                                color: '#1c1c1e',
                                cursor: d ? 'pointer' : 'default',
                                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            }}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                {error && (
                    <p style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: '#ff3b30',
                        textAlign: 'center',
                        maxWidth: 260,
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}>
                        {error}
                    </p>
                )}

                {pin.length >= 4 && (
                    <div style={{ marginTop: 16, width: '100%', maxWidth: 260 }}>
                        <button
                            type="button"
                            onClick={handleUnlock}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '15px 24px',
                                background: loading ? '#636366' : '#1c1c1e',
                                color: '#f2f2f7',
                                border: 'none',
                                borderRadius: '18px 4px 18px 4px',
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            }}
                        >
                            {loading ? 'unlocking...' : 'unclok →'}
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => {
                        if (confirm('this will delet ur wallet. no undo. u sure?')) {
                            clearWallet()
                            router.replace('/')
                        }
                    }}
                    style={{
                        marginTop: 24,
                        background: 'none',
                        border: 'none',
                        color: '#ff3b30',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        opacity: 0.6,
                    }}
                >
                    forgot pin (rip ur funds)
                </button>
            </div>
        </PieCard>
    )
}

export default UnlockCard
