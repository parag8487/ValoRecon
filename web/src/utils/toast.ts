type ToastType = 'success' | 'info' | 'warn' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  durationMs?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener([...this.toasts]);
    }
  }

  show(message: string, type: ToastType = 'info', durationMs = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, message, type, durationMs };
    this.toasts.push(item);
    this.notify();

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  success(msg: string) { this.show(msg, 'success'); }
  info(msg: string) { this.show(msg, 'info'); }
  warn(msg: string) { this.show(msg, 'warn'); }
  error(msg: string) { this.show(msg, 'error'); }
}

export const toast = new ToastManager();
