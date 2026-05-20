"use client"
import React from 'react'
import { PieCard, useAjaxSubmit, type SetUiAjaxConfigurationType } from '@swarm.ing/pieui'
import { WalletLandingCardProps } from '../types'
import { useRouter } from 'next/navigation'

const WalletLandingCard = ({ data, setUiAjaxConfiguration }: WalletLandingCardProps & { setUiAjaxConfiguration?: SetUiAjaxConfigurationType }) => {
    const {
        name,
        title,
        tagline,
        createLabel,
        importLabel,
        disclaimer,
        securityBadge,
        pathname,
        depsNames,
        kwargs,
    } = data

    const router = useRouter()
    const ajaxSubmit = useAjaxSubmit(setUiAjaxConfiguration, kwargs, depsNames, pathname)

    return (
        <PieCard card='WalletLandingCard' data={data}>
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 28px',
                background: '#f2f2f7',
            }}>
                {/* Logo */}
                <div style={{
                    width: 76,
                    height: 76,
                    background: '#1c1c1e',
                    borderRadius: '22px 6px 22px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    marginBottom: 20,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                }}>
                    💀
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: 34,
                    fontWeight: 800,
                    color: '#1c1c1e',
                    margin: 0,
                    letterSpacing: '-1.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {title}
                </h1>

                {/* Badge */}
                <span style={{
                    display: 'inline-block',
                    marginTop: 10,
                    padding: '5px 14px',
                    background: '#e5e5ea',
                    borderRadius: '6px 16px 6px 16px',
                    fontSize: 11,
                    color: '#636366',
                    letterSpacing: '0.03em',
                    fontWeight: 500,
                }}>
                    {securityBadge}
                </span>

                {/* Tagline */}
                <p style={{
                    marginTop: 22,
                    fontSize: 15,
                    color: '#48484a',
                    textAlign: 'center',
                    maxWidth: 270,
                    lineHeight: 1.6,
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {tagline}
                </p>

                {/* Divider */}
                <div style={{
                    marginTop: 36,
                    width: 40,
                    height: 3,
                    background: '#c7c7cc',
                    borderRadius: 99,
                }} />

                {/* Buttons */}
                <div style={{
                    marginTop: 36,
                    width: '100%',
                    maxWidth: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                }}>
                    {/* Primary — crazy asymmetric: big radius top-left/bottom-right, sharp top-right/bottom-left */}
                    <button
                        type="button"
                        onClick={() => router.push('/wallet/create')}
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
                            letterSpacing: '-0.2px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            transition: 'opacity 0.15s',
                        }}
                        onMouseDown={e => (e.currentTarget.style.opacity = '0.75')}
                        onMouseUp={e => (e.currentTarget.style.opacity = '1')}
                        onTouchStart={e => (e.currentTarget.style.opacity = '0.75')}
                        onTouchEnd={e => (e.currentTarget.style.opacity = '1')}
                    >
                        {createLabel}
                    </button>

                    {/* Secondary — mirrored asymmetric: sharp top-left/bottom-right, big radius top-right/bottom-left */}
                    <button
                        type="button"
                        onClick={() => router.push('/wallet/import')}
                        style={{
                            width: '100%',
                            padding: '15px 24px',
                            background: 'transparent',
                            color: '#1c1c1e',
                            border: '2.5px solid #1c1c1e',
                            borderRadius: '4px 18px 4px 18px',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: '-0.2px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                            transition: 'opacity 0.15s',
                        }}
                        onMouseDown={e => (e.currentTarget.style.opacity = '0.55')}
                        onMouseUp={e => (e.currentTarget.style.opacity = '1')}
                        onTouchStart={e => (e.currentTarget.style.opacity = '0.55')}
                        onTouchEnd={e => (e.currentTarget.style.opacity = '1')}
                    >
                        {importLabel}
                    </button>
                </div>

                {/* Disclaimer */}
                <p style={{
                    marginTop: 28,
                    fontSize: 11,
                    color: '#aeaeb2',
                    textAlign: 'center',
                    maxWidth: 290,
                    lineHeight: 1.6,
                    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                    {disclaimer}
                </p>
            </div>
        </PieCard>
    )
}

export default WalletLandingCard
