import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface UnlockCardData {
    name: string
    title: string
    subtitle: string
    network: string
    networkLabel: string
    unlockLabel: string
    forgotLabel: string
    errorMessage: string
    addressHint: string
    pathname?: string
    depsNames: string[]
    kwargs: Record<string, string | number | boolean>
}

export type UnlockCardProps = PieSimpleComponentProps<UnlockCardData>
