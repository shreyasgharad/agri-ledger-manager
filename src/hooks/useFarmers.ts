
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { useAuth } from "./useAuth";

export interface Farmer {
  id: string;
  org_id: string;
  name: string;
  phone: string;
  address: string | null;
  crop_type: string | null;
  balance: number | null;
  created_at: string;
  updated_at: string;
}

export const useFarmers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, user } = useAuth();

  console.log('useFarmers - profile:', profile);
  console.log('useFarmers - user:', user);

  const {
    data: farmers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["farmers", profile?.org_id],
    queryFn: async () => {
      console.log('Fetching farmers for org_id:', profile?.org_id);
      
      if (!profile?.org_id) {
        console.log('No org_id found, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });
      
      console.log('Farmers query result:', { data, error });
      
      if (error) {
        console.error('Error fetching farmers:', error);
        throw error;
      }
      return data as Farmer[];
    },
    enabled: !!profile?.org_id && !!user,
  });

  // Subscribe to real-time updates
  useRealtimeSubscription({ 
    table: 'farmers', 
    onUpdate: () => {
      console.log('Farmers table updated, refetching...');
      refetch();
    }
  });

  const addFarmerMutation = useMutation({
    mutationFn: async (farmer: Omit<Farmer, "id" | "created_at" | "updated_at" | "balance" | "org_id">) => {
      console.log('Adding farmer with profile:', profile);
      
      if (!profile?.org_id) {
        const error = new Error("Organization ID not found. Please ensure you're properly logged in and have an organization assigned.");
        console.error('Add farmer error:', error);
        throw error;
      }
      
      const farmerData = { 
        ...farmer,
        org_id: profile.org_id,
        balance: 0
      };

      console.log('Inserting farmer data:', farmerData);
      
      const { data, error } = await supabase
        .from("farmers")
        .insert([farmerData])
        .select()
        .single();
      
      console.log('Insert result:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Farmer added successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer added successfully!",
      });
    },
    onError: (error) => {
      console.error('Add farmer mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to add farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateFarmerMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Farmer> & { id: string }) => {
      console.log('Updating farmer:', id, updates);
      
      const { data, error } = await supabase
        .from("farmers")
        .update(updates)
        .eq("id", id)
        .eq("org_id", profile?.org_id) // Ensure user can only update farmers in their org
        .select()
        .single();
      
      console.log('Update result:', { data, error });
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Farmer updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Update farmer error:', error);
      toast({
        title: "Error",
        description: `Failed to update farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteFarmerMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting farmer:', id);
      
      const { error } = await supabase
        .from("farmers")
        .delete()
        .eq("id", id)
        .eq("org_id", profile?.org_id); // Ensure user can only delete farmers in their org
      
      console.log('Delete result error:', error);
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Farmer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer deleted successfully!",
      });
    },
    onError: (error) => {
      console.error('Delete farmer error:', error);
      toast({
        title: "Error",
        description: `Failed to delete farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    farmers,
    isLoading,
    error,
    refetch,
    addFarmer: addFarmerMutation.mutate,
    updateFarmer: updateFarmerMutation.mutate,
    deleteFarmer: deleteFarmerMutation.mutate,
    isAddingFarmer: addFarmerMutation.isPending,
    isUpdatingFarmer: updateFarmerMutation.isPending,
    isDeletingFarmer: deleteFarmerMutation.isPending,
  };
};
