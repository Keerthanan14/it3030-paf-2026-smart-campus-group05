import { Card } from "../../shared/components/ui/Card";
import { Modal } from "../../shared/components/ui/Modal";
import { StickyPageHeader } from "../../shared/components/ui/StickyPageHeader";
import TechnicianTicketFilters from "../../features/ticket/components/TechnicianTicketFilters";
import TechnicianTicketTable from "../../features/ticket/components/TechnicianTicketTable";
import TechnicianTicketDetail from "../../features/ticket/components/TechnicianTicketDetail";
import useTechnicianTicketsPageLogic from "../../features/ticket/hooks/useTechnicianTicketsPageLogic";

export default function TechnicianTicketsPage() {
  const { meta, list, detail, comments, actions } = useTechnicianTicketsPageLogic();

  const closeTicketDetail = (): void => {
    detail.setSelectedTicketId(null);
  };

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Ticket Management"
        description="Review your assigned incidents and resolve them within SLA."
      />

      <Card className="space-y-4 p-5">
        <TechnicianTicketFilters
          filters={list.filters}
          loading={list.loading}
          onStatusChange={(status) => list.updateFilters({ status })}
          onSlaBreachedChange={(enabled) => list.updateFilters({ slaBreached: enabled ? true : undefined })}
          onRefresh={() => {
            void list.refresh();
          }}
        />

        {list.error ? <p className="text-sm text-rose-600">{list.error}</p> : null}

        <TechnicianTicketTable
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
        className="max-w-6xl p-4 sm:p-6"
      >
        <TechnicianTicketDetail
          ticket={detail.ticket}
          detailLoading={detail.loading}
          detailError={detail.error}
          actionError={actions.error}
          commentError={comments.error}
          actionLoading={actions.loading}
          commentLoading={comments.loading}
          canUpdateStatus={detail.canUpdateStatus}
          canAddComment={detail.canAddComment}
          comments={comments.items}
          commentDraft={comments.draft}
          editingCommentId={comments.editingCommentId}
          editingCommentValue={comments.editingCommentValue}
          currentUserId={meta.currentUserId}
          onStatusUpdate={(status) => {
            void actions.handleStatusUpdate(status);
          }}
          onCommentDraftChange={comments.setDraft}
          onAddComment={() => {
            void actions.handleAddComment();
          }}
          onStartEditComment={comments.startEditComment}
          onCancelEditComment={comments.cancelEditComment}
          onEditingCommentValueChange={comments.setEditingCommentValue}
          onSaveEditedComment={() => {
            void actions.saveEditedComment();
          }}
          onRemoveComment={(commentId) => {
            void actions.removeComment(commentId);
          }}
        />
      </Modal>
    </div>
  );
}
