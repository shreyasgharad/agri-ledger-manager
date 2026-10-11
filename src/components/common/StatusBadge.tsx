import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  auctioned: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  billed: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-gray-200 text-gray-700 hover:bg-gray-200",
  issued: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  paid: "bg-green-100 text-green-800 hover:bg-green-100",
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant="secondary" className={styles[status] ?? ""}>
    {status}
  </Badge>
);
