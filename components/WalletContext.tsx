"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Network } from '@/lib/wallet/crypto'

interface WalletContextValue {
    seedWords: string[] | null
    network: Network | null
    setSeedWords: (words: string[], network: Network) => void
    clearSeedWords: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
    const [seedWords, setSeedWordsState] = useState<string[] | null>(null)
    const [network, setNetwork] = useState<Network | null>(null)

    const setSeedWords = (words: string[], net: Network) => {
        setSeedWordsState(words)
        setNetwork(net)
    }

    const clearSeedWords = () => {
        setSeedWordsState(null)
        setNetwork(null)
    }

    return (
        <WalletContext.Provider value={{ seedWords, network, setSeedWords, clearSeedWords }}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet(): WalletContextValue {
    const ctx = useContext(WalletContext)
    if (!ctx) throw new Error('useWallet must be used within WalletProvider')
    return ctx
}
