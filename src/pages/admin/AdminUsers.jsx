import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUsers, updateUser, createUser, getCreateUserErrorMessage } from '@/features/admin/lib/adminService';
import { USER_ROLE_OPTIONS, USER_DEPARTMENT_OPTIONS } from '@/features/admin/lib/userOptions';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_CREATE_FORM = {
  email: '',
  name: '',
  role: 'supervisor',
  department: 'warehouse',
  status: 'active',
  password: '',
  sendSetupEmail: true,
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();

  const refreshUsers = async () => {
    const usersData = await getUsers();
    setUsers(usersData);
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      await updateUser(
        selectedUser.uid,
        {
          name: selectedUser.name,
          role: selectedUser.role,
          department: selectedUser.department,
        },
        currentUser.uid
      );
      setSelectedUser(null);
      await refreshUsers();
      toast.success('User updated');
    } catch (err) {
      console.error(err);
      toast.error('Could not update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUser(user.uid, { status: newStatus }, currentUser.uid);
      await refreshUsers();
      toast.success(newStatus === 'active' ? 'User activated' : 'User deactivated');
    } catch (err) {
      console.error(err);
      toast.error('Could not update status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!createForm.sendSetupEmail && createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters, or enable the setup email.');
      return;
    }

    setCreating(true);
    try {
      const result = await createUser(
        {
          email: createForm.email,
          name: createForm.name,
          role: createForm.role,
          department: createForm.department,
          status: createForm.status,
          password: createForm.password,
          sendSetupEmail: createForm.sendSetupEmail,
        },
        currentUser.uid
      );

      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      await refreshUsers();

      toast.success('User created', {
        description: result.setupEmailSent
          ? 'A password setup link was sent to their email.'
          : 'Share the password you set — they can change it after signing in.',
      });
    } catch (err) {
      console.error(err);
      toast.error(getCreateUserErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filterRole && user.role !== filterRole) return false;
    if (filterDepartment && user.department !== filterDepartment) return false;
    if (filterStatus && user.status !== filterStatus) return false;
    return true;
  });

  const selectClass = 'border rounded px-3 py-2 text-sm bg-white';

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-500 mt-1">
            Create accounts and manage roles. New users receive a login plus Firestore profile.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Add user</Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className={selectClass}
        >
          <option value="">All Roles</option>
          {USER_ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className={selectClass}
        >
          <option value="">All Departments</option>
          {USER_DEPARTMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectClass}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap">{user.name || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.department || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status === 'active' ? 'Active' : user.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setSelectedUser({ ...user })}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(user)}
                    className={`text-sm ml-3 hover:underline ${
                      user.status === 'active' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Creates Firebase login and a Firestore profile. Recommended: send a setup email so
              they choose their own password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="name@company.com"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-name">Full name</Label>
              <Input
                id="create-name"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <select
                id="create-role"
                className={`w-full ${selectClass}`}
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                {USER_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-department">Department</Label>
              <select
                id="create-department"
                className={`w-full ${selectClass}`}
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
              >
                {USER_DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={createForm.sendSetupEmail}
                onChange={(e) =>
                  setCreateForm({ ...createForm, sendSetupEmail: e.target.checked })
                }
              />
              <span>
                Email password setup link (recommended). User sets their own password from the
                link.
              </span>
            </label>

            {!createForm.sendSetupEmail && (
              <div className="space-y-2">
                <Label htmlFor="create-password">Temporary password</Label>
                <Input
                  id="create-password"
                  type="password"
                  minLength={6}
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setCreateForm(EMPTY_CREATE_FORM);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full name</Label>
                <Input
                  id="edit-name"
                  value={selectedUser.name || ''}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <select
                  id="edit-role"
                  className={`w-full ${selectClass}`}
                  value={selectedUser.role || ''}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                >
                  {USER_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <select
                  id="edit-department"
                  className={`w-full ${selectClass}`}
                  value={selectedUser.department || ''}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, department: e.target.value })
                  }
                >
                  {USER_DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
