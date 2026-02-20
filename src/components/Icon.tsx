import { memo } from 'react'
import {
  ArrowLeft,
  PencilSimple,
  X,
  type IconProps,
} from 'phosphor-react'

type IconName = 'back' | 'edit' | 'close'

type Props = IconProps & {
  name: IconName
}

const iconMap: Record<IconName, (props: IconProps) => JSX.Element> = {
  back: (props) => <ArrowLeft {...props} />,
  edit: (props) => <PencilSimple {...props} />,
  close: (props) => <X {...props} />,
}

const Icon = memo(function Icon({ name, ...props }: Props) {
  const Component = iconMap[name]
  return <Component {...props} />
})

export default Icon
