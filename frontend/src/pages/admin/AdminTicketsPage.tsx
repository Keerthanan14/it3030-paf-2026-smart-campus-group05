import { Card } from "../../shared/components/ui/Card";
import { Modal } from "../../shared/components/ui/Modal";
import { StickyPageHeader } from "../../shared/components/ui/StickyPageHeader";
import AdminTicketDetail from "../../features/ticket/components/AdminTicketDetail";
import AdminTicketFilters from "../../features/ticket/components/AdminTicketFilters";
import AdminTicketTable from "../../features/ticket/components/AdminTicketTable";
import useAdminTicketsPageLogic from "../../features/ticket/hooks/useAdminTicketsPageLogic";

export default function AdminTicketsPage() {
  const { meta, list, detail, comments, actions } = useAdminTicketsPageLogic();

  const closeTicketDetail = (): void => {
    detail.setSelectedTicketId(null);
  };

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Ticket Management"
        description="Review incidents, assignments, and overall ticket performance."
      />

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

      <Modal
        isOpen={Boolean(detail.ticket)}
        onClose={closeTicketDetail}
        title="Ticket Summary"
        className="max-w-3xl p-4 sm:p-6"
      >
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
      </Modal>

    </div>
  );
}
