import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface NetworkOption {
    id: string
    label: string
    emoji: string
    desc: string
}

export interface NetworkSelectorCardData {
    name: string
    title: string
    subtitle: string
    networks: NetworkOption[]
    selectedNetwork: string
    flow: string
    pathname?: string
    depsNames: string[]
    kwargs: Record<string, string | number | boolean>
}

export type NetworkSelectorCardProps = PieSimpleComponentProps<NetworkSelectorCardData>
