import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getNotifications } from '../services/notifications';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const useNotifications = (userId: string | undefined) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setNotifications } = useStore();

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data, error } = await getNotifications(userId);
      if (data && !error) {
        setNotifications(data);
      }
    };

    // Fetch immediately on mount
    fetchNotifications();

    // Poll for new notifications
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, setNotifications]);
};

export default useNotifications;
