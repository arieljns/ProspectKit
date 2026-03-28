import { UsersIcon } from "lucide-react";

export function ContactsSection() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <UsersIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Contacts</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        No contacts discovered yet. Generate a brief to find key contacts at this company.
      </p>
    </div>
  );
}
