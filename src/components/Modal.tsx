import { useEffect, useMemo } from 'react'
import ReactModal from 'react-modal'
import Icon from './Icon'
import Button from './Button'
import { twMerge } from 'tailwind-merge'

type ModalProps = {
  isOpen: boolean
  title: string
  description?: string
  children: React.ReactNode
  onClose: () => void
  classNameModal?: string
}

const Modal = ({ description, children, onClose, isOpen, classNameModal }: ModalProps) => {
  const body = useMemo(() => (typeof document !== 'undefined' ? document.body : null), [])
  if (!body) return null

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = body.style.overflow
    const previousModal = body.dataset.modalOpen

    body.style.overflow = 'hidden'
    body.dataset.modalOpen = 'true'

    return () => {
      body.style.overflow = previousOverflow
      if (previousModal === undefined) {
        delete body.dataset.modalOpen
      } else {
        body.dataset.modalOpen = previousModal
      }
    }
  }, [body, isOpen])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      ReactModal.setAppElement('#root')
    }
  }, [])

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-6"
      className="flex items-center justify-center outline-none"
      bodyOpenClassName="overflow-hidden"
    >
      <div
        className={twMerge(
          "w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl sm:p-5",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{description}</h2>
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
        <div className={twMerge("mt-4", classNameModal)}>
          {children}
        </div>
      </div>
    </ReactModal>
  )
}

export default Modal
