"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWallet } from '@/components/WalletContext'
import { loadStoredWallet, Network } from '@/lib/wallet/crypto'
import { fetchBalance, sendTransaction } from '@/lib/wallet/send'
import { sendJetton, sendErc20, sendSplToken } from '@/lib/wallet/tokens'
import { SendCardProps } from '../types'

const SendCard = ({ data }: SendCardProps) => {
    const { title, subtitle, toLabel, amountLabel, sendLabel, maxLabel, backLabel } = data
    const router = useRouter()
    const searchParams = useSearchParams()
    const { seedWords } = useWallet()

    const net = (searchParams.get('network') || 'ton') as Network
    const tokenContract = searchParams.get('tokenContract') || ''
    const tokenSymbol = searchParams.get('tokenSymbol') || ''
    const tokenDecimals = parseInt(searchParams.get('tokenDecimals') || '0', 10)
    const tokenBalance = searchParams.get('tokenBalance') || ''
    const isToken = !!tokenContract

    const [address, setAddress] = useState('')
    const [balance, setBalance] = useState('...')
    const [toAddress, setToAddress] = useState('')
    const [amount, setAmount] = useState('')
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

    const netLabel = net === 'ton' ? 'TON' : net === 'eth' ? 'ETH' : 'SOL'
    const currency = isToken ? tokenSymbol : (net === 'ton' ? 'TON' : net === 'eth' ? 'ETH' : 'SOL')

    useEffect(() => {
        const stored = loadStoredWallet()
        if (!stored) { router.replace('/'); return }
        setAddress(stored.address)
        // if wallet exists but seed not in memory — go unlock first
        if (!seedWords || seedWords.length === 0) {
            const nextUrl = `/wallet/send?${searchParams.toString()}`
            router.replace(`/wallet/unlock?network=${net}&next=${encodeURIComponent(nextUrl)}`)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const loadBalance = useCallback(async () => {
        if (!address) return
        if (isToken) { setBalance(tokenBalance); return }
        setBalance('...')
        const b = await fetchBalance(address, net)
        setBalance(b)
    }, [address, net, isToken, tokenBalance])

    useEffect(() => {
        loadBalance()
    }, [loadBalance])

    const handleMax = () => setAmount(balance === '...' ? '' : balance)

    const handleSend = async () => {
        if (!toAddress.trim() || !amount.trim()) return
        if (!seedWords || seedWords.length === 0) {
            setResult({ ok: false, msg: 'wallet locked — unlock first' })
            return
        }
        setSending(true)
        setResult(null)
        try {
            let txHash: string
            if (isToken) {
                if (net === 'ton') txHash = await sendJetton(seedWords, tokenContract, toAddress.trim(), amount.trim(), tokenDecimals)
                else if (net === 'eth') txHash = await sendErc20(seedWords, tokenContract, toAddress.trim(), amount.trim(), tokenDecimals)
                else txHash = await sendSplToken(seedWords, tokenContract, toAddress.trim(), amount.trim(), tokenDecimals)
            } else {
                txHash = await sendTransaction(seedWords, net, toAddress.trim(), amount.trim())
            }
            setResult({ ok: true, msg: txHash })
            setAmount('')
            setToAddress('')
            loadBalance()
        } catch (e: unknown) {
            setResult({ ok: false, msg: e instanceof Error ? e.message : String(e) })
        } finally {
            setSending(false)
        }
    }

    return (
        <PieCard card='SendCard' data={data}>
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
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
                    {isToken ? `snd ${tokenSymbol}` : title}
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

                {/* From address + balance */}
                <div style={{
                    marginTop: 20,
                    padding: '10px 14px',
                    background: '#fff',
                    borderRadius: '4px 12px 4px 12px',
                    width: '100%',
                    maxWidth: 320,
                }}>
                    <p style={{
                        margin: '0 0 6px',
                        fontSize: 10,
                        color: '#aeaeb2',
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}>
                        from
                    </p>
                    <p style={{
                        margin: 0,
                        fontSize: 11,
                        color: '#636366',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        lineHeight: 1.5,
                    }}>
                        {address || 'loading...'}
                    </p>
                    <div style={{
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 4,
                    }}>
                        <span style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: '#1c1c1e',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            letterSpacing: '-0.8px',
                        }}>
                            {balance}
                        </span>
                        <span style={{ fontSize: 12, color: '#636366', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                            {currency}
                        </span>
                        <button
                            type="button"
                            onClick={loadBalance}
                            style={{
                                marginLeft: 4,
                                background: 'none',
                                border: 'none',
                                fontSize: 12,
                                color: '#007aff',
                                cursor: 'pointer',
                                padding: 0,
                                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            }}
                        >
                            ↻
                        </button>
                    </div>
                </div>

                {/* To address input */}
                <div style={{ marginTop: 16, width: '100%', maxWidth: 320 }}>
                    <label style={{
                        display: 'block',
                        fontSize: 11,
                        color: '#636366',
                        marginBottom: 6,
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}>
                        {toLabel}
                    </label>
                    <input
                        type="text"
                        value={toAddress}
                        onChange={e => setToAddress(e.target.value)}
                        placeholder={net === 'ton' ? 'UQ...' : net === 'eth' ? '0x...' : 'base58...'}
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: '#fff',
                            border: '1.5px solid #e5e5ea',
                            borderRadius: '4px 12px 4px 12px',
                            fontSize: 13,
                            color: '#1c1c1e',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Amount input */}
                <div style={{ marginTop: 12, width: '100%', maxWidth: 320 }}>
                    <label style={{
                        display: 'block',
                        fontSize: 11,
                        color: '#636366',
                        marginBottom: 6,
                        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    }}>
                        {amountLabel}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.0"
                            min="0"
                            step="any"
                            style={{
                                width: '100%',
                                padding: '12px 60px 12px 14px',
                                background: '#fff',
                                border: '1.5px solid #e5e5ea',
                                borderRadius: '12px 4px 12px 4px',
                                fontSize: 16,
                                color: '#1c1c1e',
                                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                fontWeight: 600,
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleMax}
                            style={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#f2f2f7',
                                border: 'none',
                                borderRadius: '4px 8px 4px 8px',
                                padding: '4px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#636366',
                                cursor: 'pointer',
                                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            }}
                        >
                            {maxLabel}
                        </button>
                    </div>
                </div>

                {/* Result message */}
                {result && (
                    <div style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        background: result.ok ? '#e8fce8' : '#ffe5e5',
                        borderRadius: result.ok ? '4px 12px 4px 12px' : '12px 4px 12px 4px',
                        width: '100%',
                        maxWidth: 320,
                        boxSizing: 'border-box',
                    }}>
                        <p style={{
                            margin: 0,
                            fontSize: 11,
                            color: result.ok ? '#1a7a1a' : '#c0392b',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            lineHeight: 1.5,
                        }}>
                            {result.ok ? '✓ tx: ' : '✗ '}{result.msg}
                        </p>
                    </div>
                )}

                {/* Send button */}
                <div style={{ marginTop: 20, width: '100%', maxWidth: 320 }}>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !toAddress.trim() || !amount.trim()}
                        style={{
                            width: '100%',
                            padding: '17px 24px',
                            background: sending ? '#636366' : '#1c1c1e',
                            color: '#f2f2f7',
                            border: 'none',
                            borderRadius: '18px 4px 18px 4px',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: sending ? 'wait' : 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            opacity: (!toAddress.trim() || !amount.trim()) ? 0.5 : 1,
                            transition: 'all 0.2s',
                        }}
                        onMouseDown={e => { if (!sending) e.currentTarget.style.opacity = '0.75' }}
                        onMouseUp={e => { if (!sending) e.currentTarget.style.opacity = '1' }}
                        onTouchStart={e => { if (!sending) e.currentTarget.style.opacity = '0.75' }}
                        onTouchEnd={e => { if (!sending) e.currentTarget.style.opacity = '1' }}
                    >
                        {sending ? 'signing & sending...' : sendLabel}
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
                    {backLabel}
                </button>
            </div>
        </PieCard>
    )
}

export default SendCard
