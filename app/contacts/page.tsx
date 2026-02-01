import { ContactsTable } from "@/components/contacts-table"
import { SiteHeader } from "@/components/site-header"
import { getAllContacts } from "@/lib/actions/contacts"

export default async function ContactsPage() {
  const result = await getAllContacts()
  const contacts = result.success ? result.data : []

  return (
    <>
      <SiteHeader title="Manage Leads" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ContactsTable data={contacts} />
          </div>
        </div>
      </div>
    </>
  )
}
