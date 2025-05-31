
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { googleSheetsApi, BillData } from "@/services/googleSheetsApi";
import { useToast } from "@/hooks/use-toast";

export const useBills = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch bills query
  const {
    data: bills = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["bills"],
    queryFn: googleSheetsApi.getBills,
    staleTime: 30000, // 30 seconds
  });

  // Add bill mutation
  const addBillMutation = useMutation({
    mutationFn: googleSheetsApi.addBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast({
        title: "Success",
        description: "Bill added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add bill: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    bills,
    isLoading,
    error,
    refetch,
    addBill: addBillMutation.mutate,
    isAddingBill: addBillMutation.isPending,
  };
};
