"use client"
import React, { useState, useEffect } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStoredWallet, Network } from '@/lib/wallet/crypto'
import { fetchTokenBalances, TokenBalance } from '@/lib/wallet/tokens'
import { TokenListCardProps } from '../types'

const TokenListCard = ({ data }: TokenListCardProps) => {
    const { title, subtitle, networkLabel, emptyLabel, sendLabel, backLabel } = data
    const router = useRouter()
    const searchParams = useSearchParams()

    const net = (searchParams.get('network') || 'ton') as Network

    const [tokens, setTokens] = useState<TokenBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    useEffect(() => {
        const stored = loadStoredWallet()
        if (!stored) { router.replace('/'); return }
        setLoading(true)
        fetchTokenBalances(stored.address, net)
            .then(setTokens)
            .finally(() => setLoading(false))
    }, [net]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSend = (token: TokenBalance) => {
        router.push(
            `/wallet/send?network=${net}` +
            `&tokenContract=${encodeURIComponent(token.contractAddress)}` +
            `&tokenSymbol=${encodeURIComponent(token.symbol)}` +
            `&tokenDecimals=${token.decimals}` +
            `&tokenBalance=${encodeURIComponent(token.balance)}`
        )
    }

    const netLabelDisplay = net === 'ton' ? 'TON' : net === 'eth' ? 'ETH' : 'SOL'

    return (
        <PieCard card='TokenListCard' data={data}>
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 28px',
                background: '#f2f2f7',
            }}>
                {/* Network badge */}
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
                    {netLabelDisplay}
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
                    marginBottom: 28,
                }}>
                    {subtitle}
                </p>

                {/* Token list */}
                <div style={{ width: '100%', maxWidth: 340 }}>
                    {loading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 0',
                            fontSize: 13,
                            color: '#aeaeb2',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        }}>
                            scanning ur bags...
                        </div>
                    ) : tokens.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 0',
                            fontSize: 13,
                            color: '#aeaeb2',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        }}>
                            {emptyLabel}
                        </div>
                    ) : (
                        tokens.map((token, i) => (
                            <div
                                key={token.contractAddress || i}
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                onTouchStart={() => setHoveredIndex(i)}
                                onTouchEnd={() => setHoveredIndex(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: '#fff',
                                    borderRadius: i === 0
                                        ? '16px 4px 4px 4px'
                                        : i === tokens.length - 1
                                        ? '4px 4px 4px 16px'
                                        : '4px',
                                    padding: '14px 16px',
                                    marginBottom: 2,
                                    transition: 'background 0.15s',
                                    cursor: 'default',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Logo or placeholder */}
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    background: '#f2f2f7',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#636366',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                }}>
                                    {token.logoUrl ? (
                                        <img
                                            src={token.logoUrl}
                                            alt={token.symbol}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                    ) : (
                                        token.symbol.slice(0, 2)
                                    )}
                                </div>

                                {/* Token info */}
                                <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#1c1c1e',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                    }}>
                                        {token.symbol}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#aeaeb2',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                        marginTop: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {token.name}
                                    </div>
                                </div>

                                {/* Balance */}
                                <div style={{
                                    textAlign: 'right',
                                    marginLeft: 8,
                                    flexShrink: 0,
                                    transition: 'transform 0.2s ease, opacity 0.2s ease',
                                    transform: hoveredIndex === i ? 'translateX(-8px)' : 'translateX(0)',
                                    opacity: hoveredIndex === i ? 0.5 : 1,
                                }}>
                                    <div style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: '#1c1c1e',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                        letterSpacing: '-0.4px',
                                    }}>
                                        {token.balance}
                                    </div>
                                    <div style={{
                                        fontSize: 10,
                                        color: '#aeaeb2',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                        marginTop: 1,
                                    }}>
                                        {token.symbol}
                                    </div>
                                </div>

                                {/* Hover send button */}
                                <button
                                    type="button"
                                    onClick={() => handleSend(token)}
                                    style={{
                                        flexShrink: 0,
                                        marginLeft: 8,
                                        padding: '8px 12px',
                                        background: '#1c1c1e',
                                        color: '#f2f2f7',
                                        border: 'none',
                                        borderRadius: '4px 12px 4px 12px',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                        whiteSpace: 'nowrap',
                                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                                        opacity: hoveredIndex === i ? 1 : 0,
                                        transform: hoveredIndex === i ? 'translateX(0)' : 'translateX(12px)',
                                        pointerEvents: hoveredIndex === i ? 'auto' : 'none',
                                    }}
                                >
                                    {sendLabel}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Back button */}
                <button
                    type="button"
                    onClick={() => router.back()}
                    style={{
                        marginTop: 32,
                        background: 'none',
                        border: 'none',
                        color: '#636366',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}
                >
                    {backLabel}
                </button>
            </div>
        </PieCard>
    )
}

export default TokenListCard
