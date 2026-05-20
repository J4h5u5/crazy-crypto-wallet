import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface SeedPhraseDisplayCardData {
    name: string
    title: string
    warning: string
    words: string[]
    network: string
    confirmLabel: string
    backLabel: string
    pathname?: string
    depsNames: string[]
    kwargs: Record<string, string | number | boolean>
}

export type SeedPhraseDisplayCardProps = PieSimpleComponentProps<SeedPhraseDisplayCardData>
