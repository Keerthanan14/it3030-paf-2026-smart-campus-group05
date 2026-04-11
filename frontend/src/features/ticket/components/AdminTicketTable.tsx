import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../../shared/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/Table";
import { formatDurationLabel, getFirstResponseSlaTone, getResolutionSlaTone, getSlaLabel, getSlaToneClass } from "../utils/ticketUi";
import type { Ticket } from "../../../types/ticket";
import type { UserListItem } from "../../../types/user";

type AdminTicketTableProps = {
  tickets: Ticket[];
  loading: boolean;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  technicians: UserListItem[];
  actionLoading: boolean;
  onSelectTicket: (ticketId: string) => void;
  onAssignTicket: (ticketId: string, technicianInput: string) => void;
  onRejectTicket: (ticketId: string) => void;
  onSetPage: (page: number) => void;
  onSetSize: (size: number) => void;
};

const statusColor: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-200 text-slate-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

export function AdminTicketTable({
  tickets,
  loading,
  page,
  size,
  totalPages,
  totalElements,
  technicians,
  actionLoading,
  onSelectTicket,
  onAssignTicket,
  onRejectTicket,
  onSetPage,
  onSetSize,
}: AdminTicketTableProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [technicianInputs, setTechnicianInputs] = useState<Record<string, string>>({});
  const [openMenuTicketId, setOpenMenuTicketId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const technicianOptions = useMemo(
    () =>
      technicians.map((technician) => ({
        id: technician.id,
        name: technician.name,
        email: technician.email,
        label: `${technician.name} (${technician.email})`,
      })),
    [technicians]
  );

  const updateTechnicianInput = (ticketId: string, value: string): void => {
    setTechnicianInputs((prev) => ({ ...prev, [ticketId]: value }));
  };

  const assignFromRow = (ticketId: string): void => {
    onAssignTicket(ticketId, technicianInputs[ticketId] ?? "");
  };

  const updateMenuPosition = (ticketId: string): void => {
    const inputElement = inputRefs.current[ticketId];
    if (!inputElement) return;

    const rect = inputElement.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  const getFilteredTechnicians = (ticketId: string) => {
    const term = (technicianInputs[ticketId] ?? "").trim().toLowerCase();
    if (!term) return technicianOptions;

    return technicianOptions.filter((technician) => {
      return (
        technician.id.toLowerCase().includes(term) ||
        technician.name.toLowerCase().includes(term) ||
        technician.email.toLowerCase().includes(term)
      );
    });
  };

  const selectTechnician = (ticketId: string, technicianLabel: string): void => {
    setTechnicianInputs((prev) => ({ ...prev, [ticketId]: technicianLabel }));
    setOpenMenuTicketId(null);
    setMenuPosition(null);
  };

  useEffect(() => {
    if (!openMenuTicketId) return;

    updateMenuPosition(openMenuTicketId);

    const handleWindowUpdate = (): void => updateMenuPosition(openMenuTicketId);
    const handleOutsideClick = (event: MouseEvent): void => {
      const inputElement = inputRefs.current[openMenuTicketId];
      if (!inputElement) return;

      const target = event.target as Node;
      if (inputElement.contains(target)) return;

      const menuElement = document.getElementById("admin-ticket-table-technician-menu");
      if (menuElement?.contains(target)) return;

      setOpenMenuTicketId(null);
      setMenuPosition(null);
    };

    window.addEventListener("resize", handleWindowUpdate);
    window.addEventListener("scroll", handleWindowUpdate, true);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("resize", handleWindowUpdate);
      window.removeEventListener("scroll", handleWindowUpdate, true);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenuTicketId]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((item) => {
            return (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => onSelectTicket(item.id)}>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.userName}</TableCell>
              <TableCell>{item.assignedToName ?? "Unassigned"}</TableCell>
              <TableCell>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor[item.status] || "bg-muted text-foreground"}`}>
                  {item.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className={`inline-block rounded px-2 py-0.5 text-xs ${getSlaToneClass(getFirstResponseSlaTone(item))}`}>
                    {getSlaLabel(getFirstResponseSlaTone(item))}: {formatDurationLabel(item.timeToFirstResponse)}
                  </p>
                  <p className={`inline-block rounded px-2 py-0.5 text-xs ${getSlaToneClass(getResolutionSlaTone(item))}`}>
                    {getSlaLabel(getResolutionSlaTone(item))}: {formatDurationLabel(item.timeToResolution)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {!item.assignedToId ? (
                  <div className="flex items-start gap-1" onClick={(event) => event.stopPropagation()}>
                    <div className="min-w-48">
                      <input
                        ref={(element) => {
                          inputRefs.current[item.id] = element;
                        }}
                        type="text"
                        value={technicianInputs[item.id] ?? ""}
                        onChange={(event) => {
                          updateTechnicianInput(item.id, event.target.value);
                          setOpenMenuTicketId(item.id);
                          updateMenuPosition(item.id);
                        }}
                        onFocus={() => {
                          setOpenMenuTicketId(item.id);
                          updateMenuPosition(item.id);
                        }}
                        placeholder="Search technician"
                        className="h-8 w-full rounded-md border border-border bg-background px-2 text-[11px]"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => assignFromRow(item.id)}
                      disabled={!item.links?.assign || !(technicianInputs[item.id] ?? "").trim() || actionLoading}
                      className="mt-0.5"
                    >
                      Assign
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => onRejectTicket(item.id)}
                      disabled={!item.links?.updateStatus || actionLoading}
                      className="mt-0.5"
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-foreground/60">-</span>
                )}
              </TableCell>
            </TableRow>
          );
          })}
          {tickets.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-foreground/60">
                No tickets found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/70">
          Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total)
        </p>
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm" value={size} onChange={(e) => onSetSize(Number(e.target.value))}>
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => onSetPage(page - 1)} disabled={page <= 0 || loading}>
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetPage(page + 1)}
            disabled={loading || totalPages === 0 || page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>

      {openMenuTicketId && menuPosition
        ? createPortal(
            <div
              id="admin-ticket-table-technician-menu"
              className="fixed z-1200 max-h-48 overflow-y-auto rounded-md border border-border/70 bg-background p-1 shadow-lg"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                width: `${menuPosition.width}px`,
              }}
            >
              {getFilteredTechnicians(openMenuTicketId).length > 0 ? (
                getFilteredTechnicians(openMenuTicketId).map((technician) => (
                  <button
                    key={technician.id}
                    type="button"
                    className="block w-full rounded px-2 py-1 text-left hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectTechnician(openMenuTicketId, technician.label)}
                  >
                    <div className="text-xs font-medium">{technician.name}</div>
                    <div className="text-[11px] text-foreground/60">{technician.email}</div>
                  </button>
                ))
              ) : (
                <p className="px-2 py-1 text-[11px] text-foreground/60">No technicians found.</p>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export default AdminTicketTable;
