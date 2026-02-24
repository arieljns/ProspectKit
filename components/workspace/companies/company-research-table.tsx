"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
} from "@tanstack/react-table";
import {
  BuildingIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  FileTextIcon,
  LoaderIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { updateCompanyPriority, deleteCompany } from "@/lib/actions/companies";
import { AddCompanyDialog } from "@/components/workspace/companies/add-company-dialog";
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
} from "@/components/shared/ui/alert-dialog";

import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { Checkbox } from "@/components/shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shared/ui/dropdown-menu";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/ui/table";

// Match database schema
export type Company = {
  id: string;
  companyName: string;
  industry: string | null;
  size: string | null;
  priority: string;
  reportStatus: string;
  website: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const sortCompaniesByCreatedAt = (rows: Company[]) =>
  [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export function CompanyResearchTable({
  data: initialData,
}: {
  data: Company[];
}) {
  const router = useRouter();
  // Sort by createdAt descending on initial load
  const [data, setData] = React.useState(() =>
    sortCompaniesByCreatedAt(initialData),
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = React.useState(false);
  // Track contact finding status per company (client-side only)
  const [contactFindingStatus, setContactFindingStatus] = React.useState<
    Record<string, "none" | "finding" | "completed" | "failed">
  >({});

  React.useEffect(() => {
    setData(sortCompaniesByCreatedAt(initialData));
  }, [initialData]);

  const handleBatchDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedCompanies = selectedRows.map((row) => row.original);

    if (selectedCompanies.length === 0) {
      toast.error("No companies selected");
      return;
    }

    setIsDeleting(true);

    // Delete each company
    const deletePromises = selectedCompanies.map((company) =>
      deleteCompany(company.id),
    );

    try {
      const results = await Promise.all(deletePromises);
      const failures = results.filter((r) => !r.success);

      if (failures.length === 0) {
        // All succeeded
        toast.success(
          `Successfully deleted ${selectedCompanies.length} ${
            selectedCompanies.length === 1 ? "company" : "companies"
          }`,
        );

        // Remove from local state
        setData((prevData) =>
          prevData.filter(
            (c) => !selectedCompanies.some((sc) => sc.id === c.id),
          ),
        );

        // Clear selection
        setRowSelection({});
      } else {
        toast.error(`Failed to delete ${failures.length} companies`);
      }
    } catch (error) {
      toast.error("Failed to delete companies");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePriorityChange = async (id: string, value: string) => {
    const company = data.find((c) => c.id === id);
    if (!company) return;

    // Optimistically update UI
    setData((prevData) =>
      prevData.map((c) => (c.id === id ? { ...c, priority: value } : c)),
    );

    // Update in database
    const result = await updateCompanyPriority(
      id,
      value as "High" | "Medium" | "Low",
    );

    if (result.success) {
      toast.success(`Updated ${company.companyName}`);
    } else {
      // Revert on error
      setData((prevData) =>
        prevData.map((c) =>
          c.id === id ? { ...c, priority: company.priority } : c,
        ),
      );
      toast.error(result.error || "Failed to update");
    }
  };

  const handleReportClick = async (company: Company) => {
    if (company.reportStatus === "completed") {
      // Navigate to report page
      router.push(`/app/reports/${company.id}`);
    } else if (company.reportStatus === "generating") {
      toast.info("Report is currently being generated...");
    } else {
      // Immediately update UI to show generating state
      setData((prevData) =>
        prevData.map((c) =>
          c.id === company.id ? { ...c, reportStatus: "generating" } : c,
        ),
      );

      // Generate report
      toast.promise(
        fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: company.id }),
        }).then(async (res) => {
          if (!res.ok) {
            // Revert to none on error
            setData((prevData) =>
              prevData.map((c) =>
                c.id === company.id ? { ...c, reportStatus: "failed" } : c,
              ),
            );
            throw new Error("Failed to generate report");
          }
          const result = await res.json();

          // Update to completed
          setData((prevData) =>
            prevData.map((c) =>
              c.id === company.id ? { ...c, reportStatus: "completed" } : c,
            ),
          );

          return result;
        }),
        {
          loading: `Generating report for ${company.companyName}...`,
          success: `Report generated for ${company.companyName}!`,
          error: "Failed to generate report",
        },
      );
    }
  };

  const handleFindContacts = async (company: Company) => {
    const currentStatus = contactFindingStatus[company.id] || "none";

    // If already finding or completed, do nothing
    if (currentStatus === "finding" || currentStatus === "completed") {
      return;
    }

    // Update status to finding
    setContactFindingStatus((prev) => ({
      ...prev,
      [company.id]: "finding",
    }));

    // Find contacts via AI
    toast.promise(
      fetch("/api/contacts/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      }).then(async (res) => {
        if (!res.ok) {
          // Set to failed on error
          setContactFindingStatus((prev) => ({
            ...prev,
            [company.id]: "failed",
          }));
          throw new Error("Failed to find contacts");
        }
        const result = await res.json();

        // Update to completed
        setContactFindingStatus((prev) => ({
          ...prev,
          [company.id]: "completed",
        }));

        return result;
      }),
      {
        loading: `Finding contacts at ${company.companyName}...`,
        success: (data: any) =>
          `Found and saved ${data.data.contactsSaved} contacts! Go to Contacts tab to view.`,
        error: "Failed to find contacts",
      },
    );
  };

  const columns: ColumnDef<Company>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
      accessorKey: "companyName",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.companyName}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-2 text-muted-foreground">
          {row.original.industry || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.size ? `${row.original.size} employees` : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.priority}
          onValueChange={(value) =>
            handlePriorityChange(row.original.id, value)
          }
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
      id: "report",
      header: "Report",
      cell: ({ row }) => {
        const status = row.original.reportStatus;
        const isGenerating = status === "generating";
        const hasReport = status === "completed";

        return (
          <Button
            variant={hasReport ? "outline" : "default"}
            size="sm"
            className="gap-1.5"
            onClick={() => handleReportClick(row.original)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileTextIcon className="h-3.5 w-3.5" />
                {hasReport ? "View Report" : "Generate Report"}
              </>
            )}
          </Button>
        );
      },
    },
    {
      id: "findContacts",
      header: "Contacts",
      cell: ({ row }) => {
        const status = contactFindingStatus[row.original.id] || "none";
        const isFinding = status === "finding";
        const isCompleted = status === "completed";
        const isFailed = status === "failed";

        return (
          <Button
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            className="gap-1.5"
            onClick={() => handleFindContacts(row.original)}
            disabled={isFinding || isCompleted}
          >
            {isFinding ? (
              <>
                <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                Finding...
              </>
            ) : isCompleted ? (
              <>
                <UsersIcon className="h-3.5 w-3.5" />
                View Contacts
              </>
            ) : (
              <>
                <UsersIcon className="h-3.5 w-3.5" />
                Find Contacts
              </>
            )}
          </Button>
        );
      },
    },
  ];

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
    getRowId: (row) => row.id.toString(),
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
  });

  return (
    <div className="flex w-full flex-col gap-4 px-4 lg:px-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={
                (table.getColumn("companyName")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn("companyName")
                  ?.setFilterValue(event.target.value)
              }
              className="pl-8"
            />
          </div>

          {/* Delete button - only show when companies are selected */}
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
                      ? "company"
                      : "companies"}{" "}
                    and their associated reports. This action cannot be undone.
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
                    column.getCanHide(),
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
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddCompanyDialogOpen(true)}
          >
            <PlusIcon />
            <span className="hidden lg:inline">Add Company</span>
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
                            header.getContext(),
                          )}
                    </TableHead>
                  );
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
                        cell.getContext(),
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
                  No companies found.
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
                table.setPageSize(Number(value));
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

      {/* Add Company Dialog */}
      <AddCompanyDialog
        open={addCompanyDialogOpen}
        onOpenChange={setAddCompanyDialogOpen}
        onSuccess={() => {
          // Refresh the page to show the new company
          router.refresh();
        }}
      />
    </div>
  );
}
