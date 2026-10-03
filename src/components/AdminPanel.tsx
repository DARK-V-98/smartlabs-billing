import React, { useEffect, useMemo, useState } from 'react';
import { ReceiptData } from '../types/receipt';
import { formatCurrency } from '../utils/numberToWords';
import {
  AppUser,
  Role,
  canSeeAll,
  createUser,
  deleteUser,
  isDeveloper,
  listUsers,
  setUserPassword
} from '../utils/auth';
import { StudentRecord, subscribeStudents } from '../utils/cloudStore';
import { Shield, Trash2, UserPlus, X } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  receipts: ReceiptData[];
}

type Tab = 'commission' | 'students' | 'users';

const ROLE_LABEL: Record<Role, string> = {
  developer: 'Developer',
  owner: 'Main Admin',
  admin: 'Admin'
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, user, receipts }) => {
  const seeAll = canSeeAll(user);
  const developer = isDeveloper(user);
  const [tab, setTab] = useState<Tab>('commission');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  // Form for creating accounts (developer only)
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<Role>('admin');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    return subscribeStudents(setStudents);
  }, [isOpen]);

  const refreshUsers = async () => {
    if (!developer) return;
    try {
      setUsers(await listUsers());
    } catch (err) {
      setMessage(`Could not load users: ${(err as Error).message}`);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'users') refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  // Commission figures per admin: students they enrolled and receipts they issued
  const commissionRows = useMemo(() => {
    const rows = new Map<string, { username: string; name: string; students: number; receipts: number; collected: number }>();
    const rowFor = (username: string, name: string) => {
      if (!rows.has(username)) rows.set(username, { username, name, students: 0, receipts: 0, collected: 0 });
      return rows.get(username)!;
    };
    students.forEach(s => {
      rowFor(s.addedBy, s.addedByName).students += 1;
    });
    receipts.forEach(r => {
      if (!r.createdBy) return;
      const row = rowFor(r.createdBy, r.createdByName || r.createdBy);
      row.receipts += 1;
      row.collected += r.amountPaid;
    });
    const all = Array.from(rows.values()).sort((a, b) => b.students - a.students);
    return seeAll ? all : all.filter(r => r.username === user.username);
  }, [students, receipts, seeAll, user.username]);

  const visibleStudents = useMemo(() => {
    const scoped = seeAll ? students : students.filter(s => s.addedBy === user.username);
    const q = search.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.addedByName.toLowerCase().includes(q)
    );
  }, [students, seeAll, user.username, search]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!newUsername.trim() || !newPassword) {
      setMessage('Username and password are required.');
      return;
    }
    try {
      await createUser(newUsername, newDisplayName, newRole, newPassword);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setMessage('User created.');
      refreshUsers();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleResetPassword = async (username: string) => {
    const pwd = prompt(`New password for ${username}:`);
    if (!pwd) return;
    try {
      await setUserPassword(username, pwd);
      setMessage(`Password updated for ${username}.`);
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Delete the login for ${username}? Their saved receipts and students stay in the records.`)) return;
    try {
      await deleteUser(username);
      setMessage(`${username} deleted.`);
      refreshUsers();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'commission', label: 'Commission & Enrollments', show: true },
    { id: 'students', label: 'Students', show: true },
    { id: 'users', label: 'User Accounts', show: developer }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-300 flex items-center justify-center text-sky-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Admin Panel</h2>
              <p className="text-xs text-slate-500">
                Signed in as {user.displayName} ({ROLE_LABEL[user.role]})
                {!seeAll && ' · showing your own enrollments only'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-3 flex gap-2 border-b border-slate-200">
          {tabs.filter(t => t.show).map(t => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setMessage('');
              }}
              className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px cursor-pointer ${
                tab === t.id ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {message && <div className="text-xs bg-sky-50 border border-sky-200 text-sky-700 rounded-lg px-3 py-2">{message}</div>}

          {tab === 'commission' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">Admin</th>
                    <th className="py-2 pr-3 text-right">Students Added</th>
                    <th className="py-2 pr-3 text-right">Receipts Issued</th>
                    <th className="py-2 pr-3 text-right">Collected (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionRows.map(row => (
                    <tr key={row.username} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-semibold">{row.name}</td>
                      <td className="py-2 pr-3 text-right font-mono">{row.students}</td>
                      <td className="py-2 pr-3 text-right font-mono">{row.receipts}</td>
                      <td className="py-2 pr-3 text-right font-mono">{formatCurrency(row.collected)}</td>
                    </tr>
                  ))}
                  {commissionRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">No enrollments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'students' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search by name, student ID, phone or admin..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-300"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 pr-3">Student ID</th>
                      <th className="py-2 pr-3">Phone</th>
                      <th className="py-2 pr-3">Batch</th>
                      <th className="py-2 pr-3">Added By</th>
                      <th className="py-2 pr-3">Added On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStudents.map(s => (
                      <tr key={s.studentId} className="border-b border-slate-100">
                        <td className="py-2 pr-3 font-semibold">{s.name}</td>
                        <td className="py-2 pr-3 font-mono">{s.studentId}</td>
                        <td className="py-2 pr-3 font-mono">{s.phone}</td>
                        <td className="py-2 pr-3">{s.batch}</td>
                        <td className="py-2 pr-3">{s.addedByName}</td>
                        <td className="py-2 pr-3">{new Date(s.addedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {visibleStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">No students found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'users' && developer && (
            <div className="space-y-5">
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Username</label>
                  <input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Display name</label>
                  <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Role</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as Role)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                    <option value="admin">Admin</option>
                    <option value="owner">Main Admin (sees all)</option>
                    <option value="developer">Developer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <button type="submit" className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg cursor-pointer">
                  <UserPlus className="w-3.5 h-3.5" /> Add User
                </button>
              </form>

              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">Username</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.username} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-mono">{u.username}</td>
                      <td className="py-2 pr-3">{u.displayName}</td>
                      <td className="py-2 pr-3">{ROLE_LABEL[u.role]}</td>
                      <td className="py-2 pr-3 text-right space-x-2">
                        <button onClick={() => handleResetPassword(u.username)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer">
                          Change password
                        </button>
                        {u.username !== 'vishwa' && (
                          <button onClick={() => handleDeleteUser(u.username)} className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer" title="Delete login">
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
