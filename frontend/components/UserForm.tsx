import React, { useState, useEffect } from 'react';

interface UserFormProps {
  user?: any;
  onSubmit: (userData: any) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'PATIENT',
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        role: user.role || 'PATIENT',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg" />
        <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" required className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg" />
      </div>
      <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg" />
      <input name="password" type="password" onChange={handleChange} placeholder="Password (leave blank to keep unchanged)" className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg" />
      <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
        <option value="PATIENT">Patient</option>
        <option value="PROVIDER">Provider</option>
        <option value="ADMIN">Admin</option>
      </select>
      <div className="flex items-center">
        <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="mr-2" />
        <label>Active</label>
      </div>
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{user ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
};

export default UserForm;
