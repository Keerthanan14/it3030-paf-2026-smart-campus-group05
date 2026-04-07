import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import type { CreateStaffRequest } from '../../../types/user';

type AdminCreateStaffModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStaffRequest) => Promise<void>;
};

export function AdminCreateStaffModal({ isOpen, isLoading, onClose, onSubmit }: AdminCreateStaffModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TECHNICIAN'>('TECHNICIAN');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    const emailValue = email.trim();
    if (!emailValue) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      email: emailValue,
      role,
    });

    if (!isLoading) {
      setName('');
      setEmail('');
      setRole('TECHNICIAN');
      setErrors({});
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Staff Account" className="max-w-xl">
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <Input label="Full Name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={role}
            onChange={(event) => setRole(event.target.value as 'ADMIN' | 'TECHNICIAN')}
          >
            <option value="TECHNICIAN">Technician</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <p className="text-xs text-foreground/60">
          Temporary password will be sent by backend email service after account creation.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AdminCreateStaffModal;
