import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ResourceForm } from '../../features/resources/components/ResourceForm';
import { useResourceForm } from '../../features/resources/hooks/useResourceForm';

export default function AdminResourceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { values, loading, saving, error, isEdit, days, setField, setWindowField, save } = useResourceForm(id);

  const handleSubmit = async () => {
    const success = await save();
    if (!success) {
      return;
    }
    navigate('/admin/resources');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Resource' : 'Create Resource'}</h1>
          <p className="mt-1 text-sm text-foreground/70">Configure resource details and weekly availability windows.</p>
        </div>
        <Link
          to="/admin/resources"
          className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Resources
        </Link>
      </div>
      <hr className="-mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />

      {loading ? (
        <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">Loading resource...</div>
      ) : (
        <ResourceForm
          values={values}
          days={days}
          isEdit={isEdit}
          saving={saving}
          error={error}
          onFieldChange={setField}
          onWindowChange={setWindowField}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
