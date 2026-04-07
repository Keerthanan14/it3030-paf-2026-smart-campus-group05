import { normalizeUserRole } from '../../../core/utils/userRole';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/components/ui/Table';
import type { UserListItem } from '../../../types/user';

type AdminUsersTableProps = {
  users: UserListItem[];
  loading: boolean;
};

export function AdminUsersTable({ users, loading }: AdminUsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="py-8 text-center text-foreground/60">
              Loading users...
            </TableCell>
          </TableRow>
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="py-8 text-center text-foreground/60">
              No users found for current filter.
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-foreground">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                  {normalizeUserRole(user.role)}
                </span>
              </TableCell>
              <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default AdminUsersTable;
