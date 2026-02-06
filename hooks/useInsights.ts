import { useState, useEffect, useCallback } from 'react';
import { getUserInsights, type InsightsData } from '../services/insights';

export const useInsights = (userId: string | undefined) => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getUserInsights(userId);

    if (fetchError) {
      console.error('Failed to fetch insights:', fetchError);
      setError(fetchError);
    }

    setInsights(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchInsights();
  }, [userId, fetchInsights]);

  return { insights, loading, error, refetch: fetchInsights };
};
