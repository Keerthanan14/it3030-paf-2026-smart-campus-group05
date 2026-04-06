import { NotificationInbox } from '../../features/notification/components/NotificationInbox';

export default function StudentNotificationsPage() {
  return (
    <NotificationInbox
      title="Student Notifications"
      description="Stay updated with booking alerts, ticket updates, and comments on your incident reports."
      pageSize={10}
    />
  );
}
