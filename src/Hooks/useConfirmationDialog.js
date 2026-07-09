import { useEffect, useState } from 'react';

export function useConfirmationDialog() {
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!confirmation) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setConfirmation(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmation]);

  const requestConfirmation = ({
    title,
    message,
    confirmLabel = 'Continue',
    cancelLabel = 'Cancel',
    tone = 'accent',
    onConfirm,
  }) => {
    setConfirmation({
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
      onConfirm,
    });
  };

  const closeConfirmation = () => {
    setConfirmation(null);
  };

  const approveConfirmation = () => {
    const pendingConfirmation = confirmation;
    setConfirmation(null);
    pendingConfirmation?.onConfirm?.();
  };

  return {
    confirmation,
    requestConfirmation,
    closeConfirmation,
    approveConfirmation,
  };
}
