import { memo, useCallback, useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'

type GroupModalProps = {
  isOpen: boolean
  title: string
  description: string
  initialValue?: string
  confirmLabel: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

const GroupModal = memo(function GroupModal({
  isOpen,
  title,
  description,
  initialValue = '',
  confirmLabel,
  onConfirm,
  onCancel,
}: GroupModalProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleConfirm = useCallback(() => {
    onConfirm(value)
    setValue('')
  }, [onConfirm, value])

  const handleCancel = () => {
    onCancel()
    setValue('')
  }

  return (
    <Modal 
      isOpen={isOpen} 
      title={title} 
      description={description} 
      onClose={handleCancel} 
      classNameModal="w-lg max-w-lg"
    >
      <input
        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
        placeholder="Nome do grupo"
        value={value}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleConfirm()
          if (event.key === 'Escape') handleCancel()
        }}
      />
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
})

export default GroupModal
