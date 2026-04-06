import { Card } from "../../shared/components/ui/Card";
import StudentTicketCreateForm from "../../features/ticket/components/StudentTicketCreateForm";
import StudentTicketDetail from "../../features/ticket/components/StudentTicketDetail";
import StudentTicketFilters from "../../features/ticket/components/StudentTicketFilters";
import StudentTicketTable from "../../features/ticket/components/StudentTicketTable";
import useStudentTicketsPageLogic from "../../features/ticket/hooks/useStudentTicketsPageLogic";

export default function StudentTicketsPage() {
  const { meta, create, list, detail, comments } = useStudentTicketsPageLogic();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
        <p className="mt-1 text-sm text-foreground/70">Monitor your support requests and their latest status updates.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <Card className="space-y-4 p-5">
        <StudentTicketCreateForm
          category={create.category}
          description={create.description}
          priority={create.priority}
          preferredContact={create.preferredContact}
          images={create.images}
          imageError={create.imageError}
          canSubmit={create.canSubmit}
          actionLoading={create.actionLoading}
          actionError={create.actionError}
          onCategoryChange={create.setCategory}
          onDescriptionChange={create.setDescription}
          onPriorityChange={create.setPriority}
          onPreferredContactChange={create.setPreferredContact}
          onFileSelection={create.handleFileSelection}
          onSubmit={() => {
            void create.handleCreateTicket();
          }}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <StudentTicketFilters
          filters={list.filters}
          loading={list.loading}
          onStatusChange={(status) => list.updateFilters({ status })}
          onPriorityChange={(priority) => list.updateFilters({ priority })}
          onRefresh={() => {
            void list.refresh();
          }}
        />

        {list.error ? <p className="text-sm text-rose-600">{list.error}</p> : null}

        <StudentTicketTable
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
        <StudentTicketDetail
          ticket={detail.ticket}
          detailLoading={detail.loading}
          detailError={detail.error}
          commentError={comments.error}
          commentLoading={comments.loading}
          canAddComment={detail.canAddComment}
          comments={comments.items}
          commentDraft={comments.draft}
          editingCommentId={comments.editingCommentId}
          editingCommentValue={comments.editingCommentValue}
          currentUserId={meta.currentUserId}
          onCommentDraftChange={comments.setDraft}
          onAddComment={() => {
            void comments.handleAddComment();
          }}
          onStartEditComment={comments.startEditComment}
          onCancelEditComment={comments.cancelEditComment}
          onEditingCommentValueChange={comments.setEditingCommentValue}
          onSaveEditedComment={() => {
            void comments.saveEditedComment();
          }}
          onRemoveComment={(commentId) => {
            void comments.removeComment(commentId);
          }}
        />
      </Card>
    </div>
  );
}
