
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InventoryItem {
  id: string;
  farmer_id: string;
  product: string;
  given_bags: number;
  returned_bags: number;
  status: "Active" | "Completed";
  created_at: string;
  updated_at: string;
  farmers?: {
    name: string;
  };
}

export const useInventory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: inventory = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*, farmers(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const addInventoryMutation = useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at" | "updated_at" | "farmers" | "returned_bags" | "status">) => {
      const { data, error } = await supabase
        .from("inventory")
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Success",
        description: "Inventory record added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add inventory record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventory")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Success",
        description: "Inventory updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update inventory: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    inventory,
    isLoading,
    error,
    refetch,
    addInventory: addInventoryMutation.mutate,
    updateInventory: updateInventoryMutation.mutate,
    isAddingInventory: addInventoryMutation.isPending,
    isUpdatingInventory: updateInventoryMutation.isPending,
  };
};
