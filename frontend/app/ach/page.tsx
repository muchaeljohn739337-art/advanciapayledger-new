import ACHTransferForm from "@/components/ACHTransferForm";

export default function ACHPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ACH Bank Transfer</h1>
          <p className="text-gray-600 mt-2">
            Make payments directly from your bank account with the lowest fees.
          </p>
        </div>
        
        <ACHTransferForm />
        
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">About ACH Transfers</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <strong>Lowest Fees:</strong> Only 0.8% + $0.25 per transaction
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <strong>Secure:</strong> Bank-level encryption and verification
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <strong>Settlement Time:</strong> 3 business days
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <strong>Convenient:</strong> Pay directly from your checking or savings account
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
