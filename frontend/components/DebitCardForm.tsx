"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, AlertCircle, DollarSign, Clock } from "lucide-react";

interface DebitCardFormProps {
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  description: string;
  isMedicalExpense?: boolean;
}

export default function DebitCardForm({ 
  onPaymentSuccess, 
  onPaymentError, 
  amount, 
  description,
  isMedicalExpense = true 
}: DebitCardFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    billingZip: "",
    pin: "",
    planType: "" as "HSA" | "FSA" | ""
  });

  const [loading, setLoading] = useState(false);
  const [usePin, setUsePin] = useState(false);
  const [cardType, setCardType] = useState<"DEBIT" | "HSA" | "FSA">("DEBIT");
  const [fees, setFees] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const fetchFees = async () => {
    try {
      const response = await fetch(`/api/debit-cards/fees?amount=${amount}`);
      const data = await response.json();
      setFees(data);
    } catch (error) {
      console.error("Failed to fetch fees:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cardData = {
        cardNumber: formData.cardNumber.replace(/\s/g, ""),
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        cardholderName: formData.cardholderName,
        billingZip: formData.billingZip,
        ...(usePin && { pin: formData.pin }),
        ...(cardType !== "DEBIT" && { planType: cardType })
      };

      const endpoint = cardType === "DEBIT" 
        ? "/api/debit-cards/process"
        : "/api/debit-cards/process-hsafsa";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          amount,
          description,
          cardData,
          isMedicalExpense
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onPaymentSuccess(result);
      } else {
        onPaymentError(result.error || "Payment failed");
      }
    } catch (error) {
      onPaymentError("Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  const getProcessingFee = () => {
    if (!fees) return 0;
    switch (cardType) {
      case "DEBIT": return fees.fees.DEBIT_CARD;
      case "HSA": return fees.fees.HSA_CARD;
      case "FSA": return fees.fees.FSA_CARD;
      default: return 0;
    }
  };

  const getSettlementDays = () => {
    switch (cardType) {
      case "DEBIT": return 2;
      case "HSA":
      case "FSA": return 1;
      default: return 5;
    }
  };

  // Fetch fees on mount
  React.useEffect(() => {
    fetchFees();
  }, [amount]);

  return (
    <div className="space-y-6">
      {/* Card Type Selection */}
      <div className="flex space-x-2">
        <Button
          variant={cardType === "DEBIT" ? "default" : "outline"}
          onClick={() => setCardType("DEBIT")}
          className="flex-1"
        >
          💳 Debit Card
        </Button>
        <Button
          variant={cardType === "HSA" ? "default" : "outline"}
          onClick={() => setCardType("HSA")}
          className="flex-1"
        >
          🏥 HSA Card
        </Button>
        <Button
          variant={cardType === "FSA" ? "default" : "outline"}
          onClick={() => setCardType("FSA")}
          className="flex-1"
        >
          💊 FSA Card
        </Button>
      </div>

      {/* Fee Comparison */}
      {fees && (
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Processing Fee:</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  ${getProcessingFee().toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">
                  Save ${fees.savings.debitVsCredit.toFixed(2)} vs credit card
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Settlement: {getSettlementDays()} business days</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HSA/FSA Notice */}
      {(cardType === "HSA" || cardType === "FSA") && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {cardType === "HSA" ? "Health Savings Account" : "Flexible Spending Account"} cards can only be used for qualified medical expenses. This transaction will be validated accordingly.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💳</span>
            <span>{cardType === "DEBIT" ? "Debit Card" : cardType} Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Number */}
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={formatCardNumber(formData.cardNumber)}
                onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value.replace(/\s/g, "") }))}
                maxLength={19}
                required
              />
            </div>

            {/* Expiry Date and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={formatExpiryDate(formData.expiryDate)}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value.replace(/\D/g, "") }))}
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  name="cvv"
                  type="text"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                name="cardholderName"
                type="text"
                placeholder="John Doe"
                value={formData.cardholderName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Billing ZIP */}
            <div>
              <Label htmlFor="billingZip">Billing ZIP Code</Label>
              <Input
                id="billingZip"
                name="billingZip"
                type="text"
                placeholder="12345"
                value={formData.billingZip}
                onChange={handleInputChange}
                maxLength={10}
                required
              />
            </div>

            {/* PIN (for debit cards) */}
            {cardType === "DEBIT" && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="usePin"
                    checked={usePin}
                    onChange={(e) => setUsePin(e.target.checked)}
                  />
                  <Label htmlFor="usePin">Use PIN for additional security</Label>
                </div>
                {usePin && (
                  <Input
                    name="pin"
                    type="password"
                    placeholder="Enter PIN (4-6 digits)"
                    value={formData.pin}
                    onChange={handleInputChange}
                    maxLength={6}
                    required
                  />
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay $${(amount + getProcessingFee()).toFixed(2)}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your payment information is encrypted and secure. Debit cards offer lower processing fees and faster settlement times compared to credit cards.
        </AlertDescription>
      </Alert>
    </div>
  );
}
