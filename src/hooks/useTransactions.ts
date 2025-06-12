
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Transaction {
  id: string;
  farmer_id: string;
  type: "Given" | "Received";
  amount: number;
  notes: string | null;
  date: string;
  created_at: string;
  farmers?: {
    name: string;
  };
}

export const useTransactions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, farmers(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "created_at" | "farmers">) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert([transaction])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast({
        title: "Success",
        description: "Transaction recorded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record transaction: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    refetch,
    addTransaction: addTransactionMutation.mutate,
    isAddingTransaction: addTransactionMutation.isPending,
  };
};
