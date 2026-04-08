import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Admin Settings"
        description="Configure system options and administrative preferences."
      />
    </div>
  );
}
