import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface WalletAddressCardData {
    name: string
    title: string
    subtitle: string
    address: string
    network: string
    networkLabel: string
    copyLabel: string
    copiedLabel: string
    sendLabel: string
    receiveLabel: string
    balanceLabel: string
    balance: string
    currency: string
    pathname?: string
    depsNames: string[]
    kwargs: Record<string, string | number | boolean>
}

export type WalletAddressCardProps = PieSimpleComponentProps<WalletAddressCardData>
