import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface SendCardData {
    name: string
    title: string
    subtitle: string
    network: string
    networkLabel: string
    currency: string
    address: string
    balance: string
    toLabel: string
    amountLabel: string
    sendLabel: string
    maxLabel: string
    backLabel: string
}

export type SendCardProps = PieSimpleComponentProps<SendCardData>
