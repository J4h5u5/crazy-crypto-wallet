import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface TokenListCardData {
    name: string
    title: string
    subtitle: string
    network: string
    networkLabel: string
    address: string
    emptyLabel: string
    sendLabel: string
    backLabel: string
}

export type TokenListCardProps = PieSimpleComponentProps<TokenListCardData>
