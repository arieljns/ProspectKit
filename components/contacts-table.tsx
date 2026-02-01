"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  ExternalLinkIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  updateContactStatus,
  updateContactPriority,
  deleteContact
} from "@/lib/actions/contacts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcnui/alert-dialog"

import { Badge } from "@/components/shadcnui/badge"
import { Button } from "@/components/shadcnui/button"
import { Checkbox } from "@/components/shadcnui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu"
import { Input } from "@/components/shadcnui/input"
import { Label } from "@/components/shadcnui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table"

// Match the return type from getAllContacts
export type Contact = {
  id: string
  companyId: string
  name: string
  title: string
  department: string | null
  linkedinUrl: string | null
  contactStatus: string
  priority: string
  lastContactedAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type ContactWithCompany = {
  contact: Contact
  company: {
    id: string
    companyName: string
    industry: string | null
  } | null
}

export function ContactsTable({
  data: initialData,
}: {
  data: ContactWithCompany[]
}) {
  // Sort by createdAt descending on initial load
  const [data, setData] = React.useState(() =>
    [...initialData].sort((a, b) =>
      new Date(b.contact.createdAt).getTime() - new Date(a.contact.createdAt).getTime()
    )
  )
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleBatchDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedContacts = selectedRows.map((row) => row.original.contact)

    if (selectedContacts.length === 0) {
      toast.error("No contacts selected")
      return
    }

    setIsDeleting(true)

    // Delete each contact
    const deletePromises = selectedContacts.map((contact) =>
      deleteContact(contact.id)
    )

    try {
      const results = await Promise.all(deletePromises)
      const failures = results.filter((r) => !r.success)

      if (failures.length === 0) {
        // All succeeded
        toast.success(
          `Successfully deleted ${selectedContacts.length} ${
            selectedContacts.length === 1 ? "contact" : "contacts"
          }`
        )

        // Remove from local state
        setData((prevData) =>
          prevData.filter(
            (c) => !selectedContacts.some((sc) => sc.id === c.contact.id)
          )
        )

        // Clear selection
        setRowSelection({})
      } else {
        toast.error(`Failed to delete ${failures.length} contacts`)
      }
    } catch (error) {
      toast.error("Failed to delete contacts")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (id: string, value: string) => {
    const contactData = data.find((c) => c.contact.id === id)
    if (!contactData) return

    const { contact } = contactData

    // Optimistically update UI
    setData((prevData) =>
      prevData.map((c) =>
        c.contact.id === id
          ? { ...c, contact: { ...c.contact, contactStatus: value } }
          : c
      )
    )

    // Update in database
    const result = await updateContactStatus(
      id,
      value as "new" | "contacted" | "responded" | "qualified" | "not_interested"
    )

    if (result.success) {
      toast.success(`Updated ${contact.name}`)
    } else {
      // Revert on error
      setData((prevData) =>
        prevData.map((c) =>
          c.contact.id === id
            ? { ...c, contact: { ...c.contact, contactStatus: contact.contactStatus } }
            : c
        )
      )
      toast.error(result.error || "Failed to update")
    }
  }

  const handlePriorityChange = async (id: string, value: string) => {
    const contactData = data.find((c) => c.contact.id === id)
    if (!contactData) return

    const { contact } = contactData

    // Optimistically update UI
    setData((prevData) =>
      prevData.map((c) =>
        c.contact.id === id
          ? { ...c, contact: { ...c.contact, priority: value } }
          : c
      )
    )

    // Update in database
    const result = await updateContactPriority(id, value as "High" | "Medium" | "Low")

    if (result.success) {
      toast.success(`Updated ${contact.name}`)
    } else {
      // Revert on error
      setData((prevData) =>
        prevData.map((c) =>
          c.contact.id === id
            ? { ...c, contact: { ...c.contact, priority: contact.priority } }
            : c
        )
      )
      toast.error(result.error || "Failed to update")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const result = await deleteContact(id)

    if (result.success) {
      toast.success(`Deleted ${name}`)
      setData((prevData) => prevData.filter((c) => c.contact.id !== id))
    } else {
      toast.error(result.error || "Failed to delete contact")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "secondary"
      case "contacted":
        return "outline"
      case "responded":
        return "default"
      case "qualified":
        return "default"
      case "not_interested":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "New"
      case "contacted":
        return "Contacted"
      case "responded":
        return "Responded"
      case "qualified":
        return "Qualified"
      case "not_interested":
        return "Not Interested"
      default:
        return status
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const columns: ColumnDef<ContactWithCompany>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "contact.name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.contact.name}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "contact.title",
      header: "Title",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.contact.title}</div>
      ),
    },
    {
      accessorKey: "company.companyName",
      header: "Company",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-2 text-muted-foreground">
          {row.original.company?.companyName || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "contact.linkedinUrl",
      header: "LinkedIn",
      cell: ({ row }) => {
        const url = row.original.contact.linkedinUrl
        if (!url) return <span className="text-muted-foreground text-sm">—</span>

        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
          >
            Profile
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        )
      },
    },
    {
      accessorKey: "contact.contactStatus",
      header: "Status",
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.contact.contactStatus}
          onValueChange={(value) => handleStatusChange(row.original.contact.id, value)}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "contact.priority",
      header: "Priority",
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.contact.priority}
          onValueChange={(value) => handlePriorityChange(row.original.contact.id, value)}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "contact.lastContactedAt",
      header: "Last Contacted",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.contact.lastContactedAt)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2Icon className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {row.original.contact.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(row.original.contact.id, row.original.contact.name)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.contact.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex w-full flex-col gap-4 px-4 lg:px-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={
                (table.getColumn("contact.name")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table.getColumn("contact.name")?.setFilterValue(event.target.value)
              }
              className="pl-8"
            />
          </div>

          {/* Delete button - only show when contacts are selected */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Delete ({table.getFilteredSelectedRowModel().rows.length})
                  </span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete{" "}
                    {table.getFilteredSelectedRowModel().rows.length}{" "}
                    {table.getFilteredSelectedRowModel().rows.length === 1
                      ? "contact"
                      : "contacts"}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBatchDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon />
                <span className="hidden lg:inline">Columns</span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <PlusIcon />
            <span className="hidden lg:inline">Add Contact</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
