import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface SeedInputCardData {
    name: string
    title: string
    subtitle: string
    wordCount: number
    network: string
    confirmLabel: string
    backLabel: string
    errorMessage: string
    pathname?: string
    depsNames: string[]
    kwargs: Record<string, string | number | boolean>
}

export type SeedInputCardProps = PieSimpleComponentProps<SeedInputCardData>
