"use client"
import React, { useState } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter, useSearchParams } from 'next/navigation'
import { encryptSeed, deriveAddress, saveWallet, Network } from '@/lib/wallet/crypto'
import { useWallet } from '@/components/WalletContext'
import { PinSetupCardProps } from '../types'

const PinSetupCard = ({ data }: PinSetupCardProps) => {
    const { title, subtitle, minPinLength, maxPinLength, defaultPinLength, sliderLabel } = data
    const router = useRouter()
    const searchParams = useSearchParams()
    const network = (searchParams.get('network') || 'ton') as Network
    const flow = searchParams.get('flow') || 'create'
    const { seedWords } = useWallet()

    const [pinLength, setPinLength] = useState(defaultPinLength || 6)
    const [pin, setPin] = useState('')
    const [confirmPin, setConfirmPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleDigit = (digit: string, isConfirm: boolean) => {
        if (isConfirm) {
            if (confirmPin.length < pinLength) setConfirmPin(prev => prev + digit)
        } else {
            if (pin.length < pinLength) setPin(prev => prev + digit)
        }
        setError('')
    }

    const handleDelete = (isConfirm: boolean) => {
        if (isConfirm) setConfirmPin(prev => prev.slice(0, -1))
        else setPin(prev => prev.slice(0, -1))
    }

    const handleConfirm = async () => {
        if (pin.length < minPinLength) {
            setError(`pin must be at least ${minPinLength} digits. u chose ${pinLength}.`)
            return
        }
        if (pin !== confirmPin) {
            setError('pins dont match. try again genius.')
            setConfirmPin('')
            return
        }
        if (!seedWords) {
            setError('no seed found. go back and start over.')
            return
        }
        setLoading(true)
        try {
            const address = await deriveAddress(seedWords, network)
            const encrypted = await encryptSeed(seedWords, pin)
            saveWallet({ ...encrypted, address, network })
            router.push(`/wallet/address?network=${network}`)
        } catch (e) {
            setError('encryption failed. spooky.')
        } finally {
            setLoading(false)
        }
    }

    const isEnteringConfirm = pin.length === pinLength

    return (
        <PieCard card='PinSetupCard' data={data}>
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
                    fontSize: 12,
                    color: '#636366',
                    textAlign: 'center',
                    maxWidth: 280,
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {subtitle}
                </p>

                {/* PIN length slider */}
                <div style={{ marginTop: 24, width: '100%', maxWidth: 280 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#636366', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                            {sliderLabel}
                        </span>
                        <span style={{ fontSize: 11, color: '#1c1c1e', fontWeight: 700, fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                            {pinLength} digits
                        </span>
                    </div>
                    <input
                        type="range"
                        min={minPinLength}
                        max={maxPinLength}
                        value={pinLength}
                        onChange={e => {
                            setPinLength(Number(e.target.value))
                            setPin('')
                            setConfirmPin('')
                            setError('')
                        }}
                        style={{ width: '100%', accentColor: '#1c1c1e' }}
                    />
                </div>

                {/* PIN dots */}
                <div style={{ marginTop: 28, textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: '#636366', marginBottom: 12, fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        {isEnteringConfirm ? 'confirm ur pin:' : 'enter ur pin:'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 280 }}>
                        {Array.from({ length: pinLength }).map((_, i) => {
                            const current = isEnteringConfirm ? confirmPin : pin
                            return (
                                <div key={i} style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    background: i < current.length ? '#1c1c1e' : '#c7c7cc',
                                    transition: 'background 0.1s',
                                }} />
                            )
                        })}
                    </div>
                </div>

                {/* Numpad */}
                <div style={{
                    marginTop: 24,
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
                                if (d === '⌫') handleDelete(isEnteringConfirm)
                                else if (d) handleDigit(d, isEnteringConfirm)
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
                        marginTop: 12,
                        fontSize: 12,
                        color: '#ff3b30',
                        textAlign: 'center',
                        maxWidth: 260,
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}>
                        {error}
                    </p>
                )}

                {isEnteringConfirm && confirmPin.length === pinLength && (
                    <div style={{ marginTop: 20, width: '100%', maxWidth: 280 }}>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '17px 24px',
                                background: loading ? '#636366' : '#1c1c1e',
                                color: '#f2f2f7',
                                border: 'none',
                                borderRadius: '18px 4px 18px 4px',
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            }}
                        >
                            {loading ? 'encrypting... (pls wait)' : 'encript & save (gulp) →'}
                        </button>
                    </div>
                )}

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

export default PinSetupCard
