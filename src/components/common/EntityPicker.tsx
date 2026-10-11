import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface PickerItem {
  id: string;
  label: string;
  sub?: string;
}

interface EntityPickerProps {
  items: PickerItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

/** Searchable single-select, sized for thumbs. Handles hundreds of farmers. */
export function EntityPicker({ items, value, onChange, placeholder = "Select...", searchPlaceholder = "Search...", className }: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className={cn("h-12 w-full justify-between text-base font-normal", className)}>
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? `${selected.label}${selected.sub ? ` · ${selected.sub}` : ""}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.sub ?? ""} ${item.id}`}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="py-3"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.sub && <span className="ml-2 text-xs text-muted-foreground">{item.sub}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
