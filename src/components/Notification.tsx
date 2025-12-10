import { useEffect } from 'react';
import { useJsonStore } from '../store/useJsonStore';
import clsx from 'clsx';

export const Notification = () => {
  const { notifications, removeNotification } = useJsonStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          {...notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
  onRemove: (id: string) => void;
}

const NotificationItem = ({ id, type, message, onRemove }: NotificationItemProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded shadow-lg',
        'transform transition-all duration-300 animate-slide-in-right',
        'text-sm font-medium',
        {
          'bg-green-600 text-white': type === 'success',
          'bg-red-600 text-white': type === 'error',
          'bg-yellow-500 text-white': type === 'warning',
        }
      )}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="hover:opacity-70 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
};
