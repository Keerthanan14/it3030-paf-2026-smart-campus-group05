import { Card } from "../../shared/components/ui/Card";
import TechnicianTicketFilters from "../../features/ticket/components/TechnicianTicketFilters";
import TechnicianTicketTable from "../../features/ticket/components/TechnicianTicketTable";
import TechnicianTicketDetail from "../../features/ticket/components/TechnicianTicketDetail";
import useTechnicianTicketsPageLogic from "../../features/ticket/hooks/useTechnicianTicketsPageLogic";

export default function TechnicianTicketsPage() {
  const { meta, list, detail, comments, actions } = useTechnicianTicketsPageLogic();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assigned Tickets</h1>
        <p className="mt-1 text-sm text-foreground/70">Focus on your assigned incidents and resolve them within SLA.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

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

      <Card className="space-y-4 p-5">
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
      </Card>
    </div>
  );
}
