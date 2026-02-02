import React, { useState } from 'react';

interface TransferFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    token: 'USDC',
    network: 'Solana',
    memo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="recipient" value={formData.recipient} onChange={handleChange} placeholder="Recipient Address" required className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <input name="amount" type="number" value={formData.amount} onChange={handleChange} placeholder="Amount" required className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg" />
        <select name="token" value={formData.token} onChange={handleChange} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
          <option value="USDC">USDC</option>
          {/* Add other tokens as needed */}
        </select>
      </div>
      <select name="network" value={formData.network} onChange={handleChange} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
        <option value="Solana">Solana</option>
        {/* Add other networks as needed */}
      </select>
      <input name="memo" value={formData.memo} onChange={handleChange} placeholder="Memo (optional)" className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg" />
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Review Transfer</button>
      </div>
    </form>
  );
};

export default TransferForm;
