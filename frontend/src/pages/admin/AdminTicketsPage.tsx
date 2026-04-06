import { Card } from "../../shared/components/ui/Card";
import AdminTicketAuditTrail from "../../features/ticket/components/AdminTicketAuditTrail";
import AdminTicketDetail from "../../features/ticket/components/AdminTicketDetail";
import AdminTicketFilters from "../../features/ticket/components/AdminTicketFilters";
import AdminTicketTable from "../../features/ticket/components/AdminTicketTable";
import useAdminTicketsPageLogic from "../../features/ticket/hooks/useAdminTicketsPageLogic";

export default function AdminTicketsPage() {
  const { meta, list, detail, comments, actions, audit } = useAdminTicketsPageLogic();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ticket Management</h1>
        <p className="mt-1 text-sm text-foreground/70">Review incidents, assignments, and overall ticket performance.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <Card className="space-y-4 p-5">
        <AdminTicketFilters
          status={list.status}
          priority={list.priority}
          assignedToFilter={list.assignedToFilter}
          loading={list.loading}
          onStatusChange={list.setStatus}
          onPriorityChange={list.setPriority}
          onAssignedToFilterChange={list.setAssignedToFilter}
          onApplyAssignedFilter={list.applyAssignedFilter}
          onRefresh={() => void list.refresh()}
        />

        {list.error ? <p className="text-sm text-rose-600">{list.error}</p> : null}

        <AdminTicketTable
          tickets={list.tickets}
          loading={list.loading}
          page={list.page}
          size={list.size}
          totalPages={list.totalPages}
          totalElements={list.totalElements}
          onSelectTicket={detail.setSelectedTicketId}
          onSetPage={list.setPage}
          onSetSize={list.setSize}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <AdminTicketDetail
          ticket={detail.ticket}
          detailLoading={detail.loading}
          detailError={detail.error}
          actionError={actions.error}
          commentError={comments.error}
          actionLoading={actions.loading}
          commentLoading={comments.loading}
          canAssign={detail.canAssign}
          canUpdateStatus={detail.canUpdateStatus}
          canAddComment={detail.canAddComment}
          technicianId={detail.technicianId}
          comments={comments.items}
          commentDraft={comments.draft}
          editingCommentId={comments.editingCommentId}
          editingCommentValue={comments.editingCommentValue}
          currentUserId={meta.currentUserId}
          onTechnicianIdChange={detail.setTechnicianId}
          onAssign={() => void actions.handleAssign()}
          onStatusUpdate={(status) => void actions.handleStatusUpdate(status)}
          onCommentDraftChange={comments.setDraft}
          onAddComment={() => void actions.handleAddComment()}
          onStartEditComment={comments.startEditComment}
          onCancelEditComment={comments.cancelEditComment}
          onEditingCommentValueChange={comments.setEditingCommentValue}
          onSaveEditedComment={() => void actions.saveEditedComment()}
          onRemoveComment={(commentId) => void actions.removeComment(commentId)}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <AdminTicketAuditTrail
          items={audit.items}
          loading={audit.loading}
          error={audit.error}
          filters={audit.filters}
          page={audit.page}
          size={audit.size}
          totalPages={audit.totalPages}
          totalElements={audit.totalElements}
          onEntityTypeChange={(value) => audit.updateFilters({ entityType: value })}
          onActionChange={(value) => audit.updateFilters({ action: value })}
          onUserIdChange={(value) => audit.updateFilters({ userId: value })}
          onRefresh={() => void audit.refresh()}
          onSetPage={audit.setPage}
          onSetSize={audit.setSize}
        />
      </Card>
    </div>
  );
}
