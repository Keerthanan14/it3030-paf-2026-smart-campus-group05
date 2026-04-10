import { useState } from "react";
import { Card } from "../../shared/components/ui/Card";
import { Button } from "../../shared/components/ui/Button";
import { Modal } from "../../shared/components/ui/Modal";
import { StickyPageHeader } from "../../shared/components/ui/StickyPageHeader";
import StudentTicketCreateForm from "../../features/ticket/components/StudentTicketCreateForm";
import StudentTicketDetail from "../../features/ticket/components/StudentTicketDetail";
import StudentTicketFilters from "../../features/ticket/components/StudentTicketFilters";
import StudentTicketTable from "../../features/ticket/components/StudentTicketTable";
import useStudentTicketsPageLogic from "../../features/ticket/hooks/useStudentTicketsPageLogic";

export default function StudentTicketsPage() {
  const { meta, create, list, detail, comments } = useStudentTicketsPageLogic();
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);

  const openTicketDetail = (ticketId: string): void => {
    detail.setSelectedTicketId(ticketId);
    setIsTicketDetailOpen(true);
  };

  const closeTicketDetail = (): void => {
    setIsTicketDetailOpen(false);
    detail.setSelectedTicketId(null);
  };

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="My Tickets"
        description="Monitor your support requests and their latest status updates."
        action={
          <Button type="button" onClick={() => setIsCreateTicketOpen(true)}>
            Create Support Ticket
          </Button>
        }
      />

      <Modal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        title="Create Support Ticket"
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <StudentTicketCreateForm
            showTitle={false}
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
            onSubmit={async () => {
              const created = await create.handleCreateTicket();
              if (created) {
                setIsCreateTicketOpen(false);
              }
            }}
          />
        </div>
      </Modal>

      <Modal
        isOpen={isTicketDetailOpen}
        onClose={closeTicketDetail}
        title="Ticket Detail"
        className="max-w-5xl"
      >
        <div className="space-y-4">
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
        </div>
      </Modal>

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
          onSelectTicket={openTicketDetail}
          onSetPage={list.setPage}
          onSetSize={list.setSize}
        />
      </Card>
    </div>
  );
}
