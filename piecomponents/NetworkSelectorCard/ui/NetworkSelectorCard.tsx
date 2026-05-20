"use client"
import React, { useState } from 'react'
import { PieCard } from '@swarm.ing/pieui'
import { useRouter } from 'next/navigation'
import { NetworkSelectorCardProps } from '../types'

const NetworkSelectorCard = ({ data }: NetworkSelectorCardProps) => {
    const { title, subtitle, networks, selectedNetwork, flow } = data
    const [selected, setSelected] = useState(selectedNetwork || networks[0]?.id || 'ton')
    const router = useRouter()

    const next = () => {
        if (flow === 'create') {
            router.push(`/wallet/create/seed?network=${selected}`)
        } else {
            router.push(`/wallet/import/seed?network=${selected}`)
        }
    }

    return (
        <PieCard card='NetworkSelectorCard' data={data}>
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
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#1c1c1e',
                    margin: 0,
                    letterSpacing: '-1px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {title}
                </h1>
                <p style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: '#636366',
                    textAlign: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {subtitle}
                </p>

                <div style={{ marginTop: 36, width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {networks.map(net => {
                        const isSelected = selected === net.id
                        return (
                            <button
                                key={net.id}
                                type="button"
                                onClick={() => setSelected(net.id)}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    background: isSelected ? '#1c1c1e' : '#fff',
                                    color: isSelected ? '#f2f2f7' : '#1c1c1e',
                                    border: `2px solid ${isSelected ? '#1c1c1e' : '#e5e5ea'}`,
                                    borderRadius: isSelected ? '16px 4px 16px 4px' : '4px 16px 4px 16px',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    textAlign: 'left',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ fontSize: 24 }}>{net.emoji}</span>
                                <span>
                                    <span style={{ display: 'block', fontWeight: 700 }}>{net.label}</span>
                                    <span style={{ display: 'block', fontSize: 11, opacity: 0.6, fontWeight: 400 }}>{net.desc}</span>
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div style={{ marginTop: 32, width: '100%', maxWidth: 320 }}>
                    <button
                        type="button"
                        onClick={next}
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
                        {flow === 'create' ? 'creat on this netwrk →' : 'improt on this netwrk →'}
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

export default NetworkSelectorCard
