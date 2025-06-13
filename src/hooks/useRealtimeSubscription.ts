
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeSubscriptionProps {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onUpdate: () => void;
}

export const useRealtimeSubscription = ({ 
  table, 
  event = '*', 
  onUpdate 
}: UseRealtimeSubscriptionProps) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Clean up existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create new channel
    const channel = supabase
      .channel(`${table}-changes-${Date.now()}`) // Add timestamp to make channel name unique
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
        },
        (payload) => {
          console.log(`Realtime update on ${table}:`, payload);
          onUpdate();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event]); // Removed onUpdate from dependencies to prevent unnecessary re-subscriptions

  // Update the callback when it changes without re-subscribing
  useEffect(() => {
    // Store the latest callback in a ref that can be accessed by the subscription
    const callbackRef = { current: onUpdate };
    
    if (channelRef.current) {
      // Update the internal callback reference
      channelRef.current.onUpdate = callbackRef.current;
    }
  }, [onUpdate]);
};
