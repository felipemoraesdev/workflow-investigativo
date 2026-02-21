import { memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import Button from './Button'

type ModalProps = {
  title: string
  description?: string
  children: React.ReactNode
  onClose: () => void
}

const Modal = memo(function ({ title, description, children, onClose }: ModalProps) {
  const body = useMemo(() => (typeof document !== 'undefined' ? document.body : null), [])
  if (!body) return null

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
          </div>
          <Button
            variant="secondary"
            className="px-2 py-1 text-slate-300"
            onClick={onClose}
            aria-label="Fechar"
          >
            <Icon name="close" size={14} />
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    body,
  )
})

export default Modal
