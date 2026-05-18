import { Modal, Button } from 'react-bootstrap'
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoWarningOutline } from 'react-icons/io5'
import './ConfirmModal.css'

export default function ConfirmModal({
  show,
  title,
  text,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  type = 'primary', // primary | danger | warning
}) {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <IoAlertCircleOutline className="cm-icon cm-icon--danger" />
      case 'warning':
        return <IoWarningOutline className="cm-icon cm-icon--warning" />
      default:
        return <IoCheckmarkCircleOutline className="cm-icon cm-icon--primary" />
    }
  }

  const getButtonVariant = () => {
    if (confirmVariant) return confirmVariant
    switch (type) {
      case 'danger':
        return 'danger'
      case 'warning':
        return 'warning'
      default:
        return 'primary'
    }
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="cm-body">
          <div className="cm-icon-wrap">{getIcon()}</div>
          <p className="cm-text">{text}</p>
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button variant="outline-secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={getButtonVariant()} onClick={onConfirm} disabled={loading}>
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
