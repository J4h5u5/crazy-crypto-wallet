"use client"
import React, { useState, useRef } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter, useSearchParams } from 'next/navigation'
import { validateSeedPhraseForNetwork, Network } from '@/lib/wallet/crypto'
import { useWallet } from '@/components/WalletContext'
import { SeedInputCardProps } from '../types'

const SeedInputCard = ({ data }: SeedInputCardProps) => {
    const { title, subtitle } = data
    const router = useRouter()
    const searchParams = useSearchParams()
    const network = (searchParams.get('network') || 'ton') as Network
    const { setSeedWords } = useWallet()

    const [wordCount, setWordCount] = useState<12 | 24>(12)
    const [words, setWords] = useState<string[]>(Array(12).fill(''))
    const [error, setError] = useState('')
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleWordCountChange = (n: 12 | 24) => {
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

    const handleConfirm = async () => {
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
                    {subtitle}
                </p>

                {/* 12 / 24 toggle */}
                <div style={{
                    marginTop: 20,
                    display: 'flex',
                    background: '#e5e5ea',
                    borderRadius: '10px 3px 10px 3px',
                    padding: 3,
                    gap: 3,
                }}>
                    {([12, 24] as const).map(n => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => handleWordCountChange(n)}
                            style={{
                                padding: '7px 22px',
                                background: wordCount === n ? '#1c1c1e' : 'transparent',
                                color: wordCount === n ? '#f2f2f7' : '#636366',
                                border: 'none',
                                borderRadius: '8px 2px 8px 2px',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                transition: 'all 0.15s',
                            }}
                        >
                            {n} wrds
                        </button>
                    ))}
                </div>

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
                        onClick={handleConfirm}
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
