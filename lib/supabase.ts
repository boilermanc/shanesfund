
// In a real app, these would come from environment variables.
// Since we are building a demo, we provide the structure.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-anon-key';

// Note: Using a dummy client for the frontend logic
export const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data generator for initial state
export const getMockPools = (): any[] => [
  {
    id: '1',
    name: 'Mega Millions Syndicate',
    total_jackpot: 540000000,
    current_pool_value: 12450,
    participants_count: 42,
    draw_date: '2024-05-20',
    status: 'active',
  },
  {
    id: '2',
    name: 'Powerball High Rollers',
    total_jackpot: 820000000,
    current_pool_value: 28900,
    participants_count: 18,
    draw_date: '2024-05-22',
    status: 'active',
  },
  {
    id: '3',
    name: 'Weekly Retirement Goal',
    total_jackpot: 12000000,
    current_pool_value: 5200,
    participants_count: 125,
    draw_date: '2024-05-18',
    status: 'active',
  }
];
