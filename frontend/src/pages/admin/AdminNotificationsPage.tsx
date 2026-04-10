import { NotificationInbox } from '../../features/notification/components/NotificationInbox';

export default function AdminNotificationsPage() {
  return (
    <NotificationInbox
      title="System Notifications"
      description="View booking, ticket, and comment notifications routed to the current admin account."
      emptyTitle="No system notifications yet"
      emptyDescription="Once booking approvals, rejections, or ticket updates happen, they will appear here."
    />
  );
}
