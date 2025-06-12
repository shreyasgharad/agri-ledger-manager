
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  address: string;
  items: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export const useFarmers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: farmers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Farmer[];
    },
  });

  const addFarmerMutation = useMutation({
    mutationFn: async (farmer: Omit<Farmer, "id" | "created_at" | "updated_at" | "balance">) => {
      const { data, error } = await supabase
        .from("farmers")
        .insert([farmer])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateFarmerMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Farmer> & { id: string }) => {
      const { data, error } = await supabase
        .from("farmers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update farmer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteFarmerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("farmers")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Farmer deleted successfully!",
      });
    },
    onError: (error) => {
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
