import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  UserPlus,
  UserMinus,
  MapPin,
  Users,
  ShieldCheck,
  Database,
  Truck,
  User,
  Loader2,
  X,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const HUBS = [
  { id: 'dwangwa-hub', name: 'Dwangwa Hub' },
  { id: 'linga-hub', name: 'Linga Hub' },
  { id: 'suluwi-hub', name: 'Suluwi Hub' },
  { id: 'salima-hub', name: 'Salima Hub' }
];

const AGGREGATION_ROLES = [
  { id: 'hub-coordinator', name: 'Hub Coordinator', icon: User },
  { id: 'security-lead', name: 'Security Lead', icon: ShieldCheck },
  { id: 'second-security', name: 'Second Security', icon: ShieldCheck },
  { id: 'data-team-lead', name: 'Data Team Lead', icon: Database },
  { id: 'warehouse-supervisor', name: 'Warehouse Supervisor', icon: Truck }
];

export default function HubManagement() {
  const { userDepartment, userRole, currentUser } = useAuth();
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Assignment state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch all users who have at least one hub assignment
  useEffect(() => {
    if (userDepartment !== 'aggregation' || userRole !== 'manager') return;

    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['supervisor', 'hub-coordinator', 'security-lead', 'data-team', 'warehouse-supervisor', 'manager'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => u.hubAssignments && u.hubAssignments.length > 0);

      setAssignedUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userDepartment, userRole]);

  // 2. Organization-wide user search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    console.log("Searching for:", searchQuery);
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const searchLower = searchQuery.toLowerCase().trim();

      console.log(`Found ${snapshot.docs.length} total users in DB. Filtering...`);

      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => {
          // Extremely robust check for any text field
          const name = String(u.name || "").toLowerCase();
          const displayName = String(u.displayName || "").toLowerCase();
          const firstName = String(u.firstName || "").toLowerCase();
          const lastName = String(u.lastName || "").toLowerCase();
          const email = String(u.email || "").toLowerCase();
          const combinedName = `${firstName} ${lastName}`.trim();

          const matches = name.includes(searchLower) ||
            displayName.includes(searchLower) ||
            firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            email.includes(searchLower) ||
            combinedName.includes(searchLower);

          if (matches) console.log("Match found:", u.name || u.email || u.id);
          return matches;
        });

      console.log(`Total matches for "${searchQuery}":`, results.length);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast.error('Search Failed', { description: 'Error searching users. Please try again.' });
    } finally {
      setSearching(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedUser || !selectedHub || !selectedRole) return;

    setSubmitting(true);
    try {
      // Prevent duplicate hub assignments
      const isAlreadyAssigned = selectedUser.hubAssignments?.some(a => a.hub === selectedHub.id);
      if (isAlreadyAssigned) {
        toast.warning('Already Assigned', {
          description: `${selectedUser.name} is already assigned to ${selectedHub.name}.`,
        });
        setSubmitting(false);
        return;
      }

      const userRef = doc(db, 'users', selectedUser.id);
      const newAssignment = {
        hub: selectedHub.id,
        aggregationRole: selectedRole,
        assignedBy: currentUser.uid,
        assignedAt: new Date()
      };

      await updateDoc(userRef, {
        hubAssignments: arrayUnion(newAssignment)
      });

      setIsModalOpen(false);
      resetModal();
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error('Assignment Failed', { description: 'Could not assign user to hub. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (userId, assignment) => {
    toast.warning(`Remove ${getRoleName(assignment.aggregationRole)} from this hub?`, {
      action: {
        label: 'Remove',
        onClick: async () => {
          try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { hubAssignments: arrayRemove(assignment) });
            toast.success('Assignment Removed ✓');
          } catch (error) {
            console.error("Removal error:", error);
            toast.error('Removal Failed', { description: 'Could not remove assignment. Please try again.' });
          }
        },
      },
      duration: 6000,
    });
  };

  const resetModal = () => {
    setSelectedUser(null);
    setSelectedRole('');
    setSearchQuery('');
    setSearchResults([]);
  };

  const getRoleName = (roleId) => AGGREGATION_ROLES.find(r => r.id === roleId)?.name || roleId;

  if (userDepartment !== 'aggregation' || userRole !== 'manager') {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized. This page is for Aggregation Managers only.</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <MapPin className="text-primary w-8 h-8" /> Hub Staff Management
        </h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Assign organization staff to market hubs for aggregation activities.
          Staff will keep their original department access while gaining access to aggregation checklists.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {HUBS.map(hub => {
          const staff = assignedUsers.filter(u => u.hubAssignments.some(a => a.hub === hub.id));

          return (
            <Card key={hub.id} className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{hub.name}</CardTitle>
                  <CardDescription>{staff.length} staff members assigned</CardDescription>
                </div>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setSelectedHub(hub);
                    setIsModalOpen(true);
                  }}
                >
                  <UserPlus className="w-4 h-4" /> Add Staff
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-md border-dashed border-2">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No staff assigned to this hub yet.</p>
                    </div>
                  ) : (
                    staff.map(user => {
                      const assignment = user.hubAssignments.find(a => a.hub === hub.id);
                      return (
                        <div key={`${user.id}-${assignment.hub}`} className="flex items-center justify-between p-3 bg-white border rounded-md hover:bg-gray-50 group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] font-medium bg-blue-50 text-blue-700 border-blue-100">
                                  {getRoleName(assignment.aggregationRole)}
                                </Badge>
                                <span className="text-[10px] text-gray-400">• Dept: {user.department}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveAssignment(user.id, assignment)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assignment Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetModal();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Staff to {selectedHub?.name}</DialogTitle>
            <DialogDescription>
              Search for an existing user to add to this aggregation hub.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 1. Search Section */}
            {!selectedUser ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                  {searchQuery && (
                    <Button variant="ghost" size="icon" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y bg-gray-50/30">
                  {searchResults.length === 0 && !searching && searchQuery && (
                    <p className="p-4 text-center text-gray-400 text-sm">No users found.</p>
                  )}
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="p-3 flex items-center justify-between hover:bg-white cursor-pointer group border-b last:border-0"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {user.name || user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.email || 'No Email'} • Dept: {
                            Array.isArray(user.department)
                              ? user.department.join(', ')
                              : (user.department || 'No Dept')
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">{user.role}</Badge>
                        <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 2. Selection Review & Role Section */
              <div className="space-y-6">
                <Alert className="bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{selectedUser.name}</p>
                        <p className="text-xs text-gray-500">Selected Hub: {selectedHub.name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change Staff</Button>
                  </div>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Select Aggregation Role</p>
                  <div className="grid grid-cols-1 gap-2">
                    {AGGREGATION_ROLES.map(role => {
                      const Icon = role.icon;
                      return (
                        <div
                          key={role.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedRole === role.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'hover:bg-gray-50 border-gray-100'
                            }`}
                          onClick={() => setSelectedRole(role.id)}
                        >
                          <Icon className={`w-5 h-5 ${selectedRole === role.id ? 'text-primary' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${selectedRole === role.id ? 'text-primary' : 'text-gray-700'}`}>
                            {role.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedUser || !selectedRole || submitting}
              onClick={handleAddAssignment}
            >
              {submitting ? "Assigning..." : "Assign to Hub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
