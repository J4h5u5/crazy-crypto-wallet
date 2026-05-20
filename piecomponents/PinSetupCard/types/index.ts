import { PieSimpleComponentProps } from '@swarm.ing/pieui'

export interface PinSetupCardData {
    name: string
    title: string
    subtitle: string
    minPinLength: number
    maxPinLength: number
    defaultPinLength: number
    network: string
    flow: string
    confirmLabel: string
    backLabel: string
    sliderLabel: string
    pathname?: string
    depsNames: string[]
    kwargs: Record<string, string | number | boolean>
}

export type PinSetupCardProps = PieSimpleComponentProps<PinSetupCardData>
