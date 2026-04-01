export function redirectByRole(role: string, navigate: (path: string) => void) {
  if (role === 'ROLE_ADMIN') {
    navigate('/admin/dashboard');
    return;
  }

  if (role === 'ROLE_TECHNICIAN') {
    navigate('/technician/dashboard');
    return;
  }

  navigate('/student/dashboard');
}
