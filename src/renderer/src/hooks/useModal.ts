import { useEffect } from 'react'

/**
 * Hook fuer alle Modals.
 * Beim Mount: IPC modal:open -> WebView versteckt.
 * Beim Unmount: IPC modal:close -> WebView wieder sichtbar.
 */
export function useModal(): void {
  useEffect(() => {
    window.electronAPI.modalOpen()
    return () => {
      window.electronAPI.modalClose()
    }
  }, [])
}
