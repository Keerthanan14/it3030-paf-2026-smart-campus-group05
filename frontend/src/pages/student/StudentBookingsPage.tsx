import { Button } from '../../shared/components/ui/Button';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import { BookingCreateModal } from '../../features/booking/components/BookingCreateModal';
import { BookingDetailPanel } from '../../features/booking/components/BookingDetailPanel';
import { BookingListSection } from '../../features/booking/components/BookingListSection';
import { useStudentBookingPage } from '../../features/booking/hooks/useStudentBookingPage';

export default function StudentBookingsPage() {
  const {
    items,
    selectedBooking,
    filters,
    page,
    size,
    totalPages,
    totalElements,
    isListLoading,
    isDetailLoading,
    isMutating,
    error,
    resources,
    isResourcesLoading,
    resourceQuery,
    setResourceQuery,
    onResourceSelect,
    selectedResource,
    availableSpace,
    bookingDate,
    onBookingDateChange,
    minBookingDate,
    maxBookingDate,
    selectedWeekday,
    selectedDayWindow,
    startTime,
    endTime,
    startTimeOptions,
    endTimeOptions,
    setStartTime,
    setEndTime,
    attendeesCount,
    setAttendeesCount,
    purpose,
    setPurpose,
    resetCreateForm,
    isCreateModalOpen,
    setIsCreateModalOpen,
    canSubmit,
    refreshList,
    onCreateBooking,
    onSelectBooking,
    onCancelBooking,
    setPage,
    setSize,
    patchFilters,
  } = useStudentBookingPage();

  const handleOpenCreateModal = (): void => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = (): void => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="My Bookings"
        description="Create and manage your booking requests with live status updates."
        action={
          <Button type="button" onClick={handleOpenCreateModal}>
            New Booking
          </Button>
        }
      />

      <BookingCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        resources={resources}
        isResourcesLoading={isResourcesLoading}
        resourceQuery={resourceQuery}
        selectedResource={selectedResource}
        availableSpace={availableSpace}
        bookingDate={bookingDate}
        minBookingDate={minBookingDate}
        maxBookingDate={maxBookingDate}
        selectedWeekday={selectedWeekday}
        selectedDayWindow={selectedDayWindow}
        startTime={startTime}
        endTime={endTime}
        startTimeOptions={startTimeOptions}
        endTimeOptions={endTimeOptions}
        attendeesCount={attendeesCount}
        purpose={purpose}
        errorMessage={error ? 'Please check your request and try again.' : null}
        canSubmit={canSubmit}
        isSubmitting={isMutating}
        onResourceQueryChange={setResourceQuery}
        onResourceSelect={onResourceSelect}
        onAttendeesChange={setAttendeesCount}
        onBookingDateChange={onBookingDateChange}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onPurposeChange={setPurpose}
        onSubmit={() => void onCreateBooking()}
      />

      <BookingListSection
        items={items}
        resources={resources}
        filters={filters}
        page={page}
        size={size}
        totalPages={totalPages}
        totalElements={totalElements}
        isListLoading={isListLoading}
        isMutating={isMutating}
        onStatusChange={(status) => patchFilters({ status })}
        onFromChange={(value) => patchFilters({ from: value || undefined })}
        onToChange={(value) => patchFilters({ to: value || undefined })}
        onRefresh={() => void refreshList()}
        onSelectBooking={(id) => void onSelectBooking(id)}
        onCancelBooking={(id) => void onCancelBooking(id)}
        onPageChange={setPage}
        onSizeChange={setSize}
      />

      <BookingDetailPanel selectedBooking={selectedBooking} isDetailLoading={isDetailLoading} />
    </div>
  );
}
