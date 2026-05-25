export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-cream rounded-lg p-5 max-w-sm w-full shadow-xl border-2 border-gold"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="text-center text-xs text-goldDark tracking-widest uppercase mb-2">
            {title}
          </div>
        )}
        <div className="text-sm text-brown text-center leading-snug mb-5">
          {message}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded border-2 border-gold/50 text-brown text-sm font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded bg-gold text-darkBg text-sm font-bold tracking-wide uppercase"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
