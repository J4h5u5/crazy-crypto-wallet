"use client"
import React, { useState, useEffect } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter, useSearchParams } from 'next/navigation'
import { generateSeedPhrase, deriveAddress, encryptSeed, saveWallet, Network } from '@/lib/wallet/crypto'
import { useWallet } from '@/components/WalletContext'
import { SeedPhraseDisplayCardProps } from '../types'

const SeedPhraseDisplayCard = ({ data }: SeedPhraseDisplayCardProps) => {
    const { title, warning } = data
    const router = useRouter()
    const searchParams = useSearchParams()
    const network = (searchParams.get('network') || 'ton') as Network
    const { setSeedWords } = useWallet()

    const [wordCount, setWordCount] = useState<12 | 24>(12)
    const [words, setWords] = useState<string[]>([])
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setWords(generateSeedPhrase(wordCount))
    }, [wordCount])

    const handleCopy = () => {
        navigator.clipboard.writeText(words.join(' ')).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleConfirm = () => {
        setSeedWords(words, network)
        router.push(`/wallet/pin?network=${network}&flow=create`)
    }

    return (
        <PieCard card='SeedPhraseDisplayCard' data={data}>
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

                <div style={{
                    marginTop: 12,
                    padding: '10px 16px',
                    background: '#fff3cd',
                    borderRadius: '4px 14px 4px 14px',
                    maxWidth: 320,
                    fontSize: 12,
                    color: '#856404',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    ⚠️ {warning}
                </div>

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
                            onClick={() => setWordCount(n)}
                            style={{
                                padding: '7px 22px',
                                background: wordCount === n ? '#1c1c1e' : 'transparent',
                                color: wordCount === n ? '#f2f2f7' : '#636366',
                                border: 'none',
                                borderRadius: wordCount === n ? '8px 2px 8px 2px' : '8px 2px 8px 2px',
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
                    marginTop: 28,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                    width: '100%',
                    maxWidth: 340,
                }}>
                    {words.map((word, i) => (
                        <div key={i} style={{
                            background: '#fff',
                            border: '1.5px solid #e5e5ea',
                            borderRadius: i % 2 === 0 ? '10px 3px 10px 3px' : '3px 10px 3px 10px',
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <span style={{ fontSize: 10, color: '#aeaeb2', minWidth: 16, fontFamily: 'monospace' }}>
                                {i + 1}.
                            </span>
                            <span style={{ fontSize: 13, color: '#1c1c1e', fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                                {word}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 20, width: '100%', maxWidth: 320 }}>
                    <button
                        type="button"
                        onClick={handleCopy}
                        style={{
                            width: '100%',
                            padding: '13px 24px',
                            background: copied ? '#34c759' : 'transparent',
                            color: copied ? '#fff' : '#1c1c1e',
                            border: `2px solid ${copied ? '#34c759' : '#c7c7cc'}`,
                            borderRadius: '4px 16px 4px 16px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            transition: 'all 0.2s',
                        }}
                    >
                        {copied ? 'copyed! ✓' : 'copi seed phrse'}
                    </button>
                </div>

                <div style={{ marginTop: 12, width: '100%', maxWidth: 320 }}>
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
                        i wrote it down (probly) →
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

export default SeedPhraseDisplayCard
