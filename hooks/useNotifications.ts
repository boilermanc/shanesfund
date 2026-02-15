import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useNotifications = (userId: string | undefined) => {
  const loadNotifications = useStore((s) => s.loadNotifications);
  const startNotificationListener = useStore((s) => s.startNotificationListener);
  const stopNotificationListener = useStore((s) => s.stopNotificationListener);

  useEffect(() => {
    if (!userId) return;

    loadNotifications(userId);
    startNotificationListener(userId);

    return () => {
      stopNotificationListener();
    };
  }, [userId, loadNotifications, startNotificationListener, stopNotificationListener]);
};

export default useNotifications;
