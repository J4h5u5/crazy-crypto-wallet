import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface WalletLandingCardData {
    name: string
    title: string
    tagline: string
    createLabel: string
    importLabel: string
    disclaimer: string
    securityBadge: string

    pathname?: string
    depsNames: string[]
    kwargs: Record<string, string | number | boolean>
}

export type WalletLandingCardProps = PieSimpleComponentProps<WalletLandingCardData>
