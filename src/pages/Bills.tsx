import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useBills } from "@/hooks/useAgri";
import { formatDate, formatINR } from "@/lib/format";

const Bills = () => {
  const { data: bills = [], isLoading } = useBills();
  const [party, setParty] = useState<"all" | "farmer" | "buyer">("all");
  const shown = bills.filter((b) => party === "all" || b.party_type === party);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Bills</h1>
        <p className="text-sm text-muted-foreground">Each sale produces a farmer bill and a buyer bill. Create them from a lot.</p>
      </div>

      <ToggleGroup type="single" value={party} onValueChange={(v) => v && setParty(v as typeof party)} className="justify-start">
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="farmer">Farmer</ToggleGroupItem>
        <ToggleGroupItem value="buyer">Buyer</ToggleGroupItem>
      </ToggleGroup>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading bills...</p>
      ) : shown.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No bills yet. Confirm a sale on a lot to issue the first pair.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {shown.map((b) => {
            const due = Math.round((Number(b.net_amount) - b.paid) * 100) / 100;
            const name = b.party_type === "farmer" ? b.farmers?.name : b.buyers?.name;
            return (
              <Link key={b.id} to={`/bills/${b.id}`}>
                <Card className="hover:border-agri-green-500 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{b.number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(b.issued_at)} · {b.party_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatINR(Number(b.net_amount))}</p>
                      <p className={`text-xs ${due > 0 ? "text-red-600" : "text-green-700"}`}>{due > 0 ? `Due ${formatINR(due)}` : "Settled"}</p>
                      <StatusBadge status={b.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bills;
