"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/use-store";
import { getActiveDomain } from "@/lib/selectors";

export function DomainSwitcher() {
  const { state, run, refreshing } = useStore();
  const [open, setOpen] = useState(false);
  const [hostname, setHostname] = useState("");
  const [name, setName] = useState("");

  if (!state) return null;
  const active = getActiveDomain(state);

  async function addDomain() {
    const next = await run({
      action: "addDomain",
      hostname,
      displayName: name || undefined,
    });
    if (next) {
      toast.success(`${hostname} hinzugefügt`);
      setHostname("");
      setName("");
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[12rem] justify-between gap-2">
            <span className="truncate">
              {active ? active.displayName : "Keine Domain"}
            </span>
            <ChevronsUpDownIcon className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          {state.domains.map((d) => (
            <DropdownMenuItem
              key={d.id}
              className="flex items-center justify-between gap-2"
              onClick={() => void run({ action: "setActive", domainId: d.id })}
            >
              <span className="truncate">
                {d.displayName}
                <span className="ml-1 text-muted-foreground">({d.hostname})</span>
              </span>
              {d.id === state.activeDomainId ? <CheckIcon className="size-3.5" /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {active ? (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                void run({ action: "removeDomain", domainId: active.id }).then((s) => {
                  if (s) toast.message("Domain entfernt");
                });
              }}
            >
              <Trash2Icon className="size-3.5" />
              Aktive Domain entfernen
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            Domain
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Domain tracken</DialogTitle>
            <DialogDescription>
              Füge eine Domain hinzu. Daten bleiben lokal in <code>data/store.json</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="host">Hostname</Label>
              <Input
                id="host"
                placeholder="beispiel.de"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dname">Anzeigename (optional)</Label>
              <Input
                id="dname"
                placeholder="Meine Marke"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button disabled={!hostname.trim() || refreshing} onClick={() => void addDomain()}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
