"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ACHFormData {
  routingNumber: string;
  accountNumber: string;
  accountType: "checking" | "savings";
  accountHolderName: string;
  amount: string;
  description: string;
  authorization: boolean;
}

export default function ACHTransferForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verification, setVerification] = useState<{
    routingValid?: boolean;
    accountValid?: boolean;
    bankName?: string;
  }>({});
  const [formData, setFormData] = useState<ACHFormData>({
    routingNumber: "",
    accountNumber: "",
    accountType: "checking",
    accountHolderName: "",
    amount: "",
    description: "",
    authorization: false,
  });

  const formatRoutingNumber = (value: string) => {
    // Remove non-digits and format as XXX XXX XXX
    const clean = value.replace(/\D/g, "").slice(0, 9);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === "routingNumber") {
      const formatted = formatRoutingNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "accountNumber") {
      // Only show last 4 digits after initial input
      const clean = value.replace(/\D/g, "");
      setFormData(prev => ({ 
        ...prev, 
        [name]: clean.length > 4 ? `****${clean.slice(-4)}` : clean 
      }));
    } else if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const verifyRoutingNumber = async () => {
    const cleanRouting = formData.routingNumber.replace(/\s/g, "");
    if (cleanRouting.length !== 9) return;

    try {
      const response = await fetch("/api/ach/verify-routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routingNumber: cleanRouting }),
      });

      const data = await response.json();
      setVerification(prev => ({ ...prev, routingValid: data.valid }));
      
      if (!data.valid) {
        setErrors(prev => ({ ...prev, routingNumber: "Invalid routing number" }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, routingNumber: "Routing number verification failed" }));
    }
  };

  const verifyAccount = async () => {
    const cleanRouting = formData.routingNumber.replace(/\s/g, "");
    const cleanAccount = formData.accountNumber.replace(/\*/g, "");
    
    if (cleanRouting.length !== 9 || cleanAccount.length < 4) return;

    try {
      const response = await fetch("/api/ach/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routingNumber: cleanRouting,
          accountNumber: cleanAccount,
          accountType: formData.accountType,
        }),
      });

      const data = await response.json();
      setVerification(prev => ({ 
        ...prev, 
        accountValid: data.valid,
        bankName: data.bankName 
      }));
      
      if (!data.valid) {
        setErrors(prev => ({ ...prev, accountNumber: "Account verification failed" }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, accountNumber: "Account verification failed" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.routingNumber || formData.routingNumber.replace(/\s/g, "").length !== 9) {
      newErrors.routingNumber = "Valid 9-digit routing number required";
    }

    if (!formData.accountNumber || formData.accountNumber.replace(/\*/g, "").length < 4) {
      newErrors.accountNumber = "Valid account number required";
    }

    if (!formData.accountHolderName || formData.accountHolderName.length < 3) {
      newErrors.accountHolderName = "Account holder name required";
    }

    if (!formData.amount || parseFloat(formData.amount) < 0.01) {
      newErrors.amount = "Amount must be at least $0.01";
    }

    if (!formData.description || formData.description.length < 3) {
      newErrors.description = "Description required (min 3 characters)";
    }

    if (!formData.authorization) {
      newErrors.authorization = "Authorization required for ACH transfer";
    }

    if (!verification.routingValid) {
      newErrors.routingNumber = "Routing number must be verified";
    }

    if (!verification.accountValid) {
      newErrors.accountNumber = "Account must be verified";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ach/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          description: formData.description,
          achData: {
            routingNumber: formData.routingNumber.replace(/\s/g, ""),
            accountNumber: formData.accountNumber.replace(/\*/g, ""),
            accountType: formData.accountType,
            accountHolderName: formData.accountHolderName,
            authorization: "Customer authorized ACH transfer via web form",
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`ACH transfer initiated! Transaction ID: ${data.transactionId}\nFee: $${data.fee}\nSettlement date: ${new Date(data.settlementDate).toLocaleDateString()}`);
        router.push("/payments");
      } else {
        setErrors({ submit: data.error || "Transfer failed" });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">ACH Bank Transfer</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Lowest fees!</strong> ACH transfers cost only 0.8% + $0.25 and settle in 3 business days.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bank Information */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Bank Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Routing Number</label>
              <input
                type="text"
                name="routingNumber"
                value={formData.routingNumber}
                onChange={handleInputChange}
                onBlur={verifyRoutingNumber}
                placeholder="XXX XXX XXX"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.routingNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.routingNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.routingNumber}</p>
              )}
              {verification.routingValid && (
                <p className="text-green-500 text-sm mt-1">✓ Routing number verified</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                onBlur={verifyAccount}
                placeholder="Account number"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accountNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
              )}
              {verification.accountValid && (
                <p className="text-green-500 text-sm mt-1">
                  ✓ Account verified {verification.bankName && `(${verification.bankName})`}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Holder Name</label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="Name on account"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accountHolderName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.accountHolderName && (
                <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Payment Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount ($)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Payment description"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Authorization */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Authorization</h3>
          
          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="checkbox"
                name="authorization"
                checked={formData.authorization}
                onChange={handleInputChange}
                className="mt-1 mr-2"
              />
              <span className="text-sm">
                I authorize the ACH transfer from my bank account. I understand this transaction 
                will take 3 business days to settle and the fee is 0.8% + $0.25.
              </span>
            </label>
            {errors.authorization && (
              <p className="text-red-500 text-sm">{errors.authorization}</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !verification.routingValid || !verification.accountValid}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Processing..." : "Initiate ACH Transfer"}
        </button>
      </form>
    </div>
  );
}
