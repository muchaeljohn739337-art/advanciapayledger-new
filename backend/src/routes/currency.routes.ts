import { Router, Request, Response } from "express";
import { currencyConversionService } from "../services/currencyConversionService";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * GET /api/currency/prices
 * Get current crypto prices
 */
router.get("/prices", async (req: Request, res: Response) => {
  try {
    const prices = await currencyConversionService.getPrices();

    res.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch crypto prices",
    });
  }
});

/**
 * POST /api/currency/convert
 * Convert between currencies
 */
router.post(
  "/convert",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;

      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: amount, fromCurrency, toCurrency",
        });
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
      }

      let result;

      // Fiat to Crypto
      if (
        ["USD", "EUR"].includes(fromCurrency) &&
        ["SOL", "ETH", "BTC", "USDC", "USDT"].includes(toCurrency)
      ) {
        result = await currencyConversionService.convertFiatToCrypto(
          numAmount,
          fromCurrency as "USD" | "EUR",
          toCurrency,
        );
      }
      // Crypto to Fiat
      else if (
        ["SOL", "ETH", "BTC", "USDC", "USDT"].includes(fromCurrency) &&
        ["USD", "EUR"].includes(toCurrency)
      ) {
        result = await currencyConversionService.convertCryptoToFiat(
          numAmount,
          fromCurrency,
          toCurrency as "USD" | "EUR",
        );
      }
      // Fiat to Fiat
      else if (
        ["USD", "EUR"].includes(fromCurrency) &&
        ["USD", "EUR"].includes(toCurrency)
      ) {
        result = currencyConversionService.convertFiatToFiat(
          numAmount,
          fromCurrency as "USD" | "EUR",
          toCurrency as "USD" | "EUR",
        );
      } else {
        return res.status(400).json({
          success: false,
          message: "Unsupported currency pair",
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error converting currency:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Conversion failed",
      });
    }
  },
);

/**
 * POST /api/currency/convert-with-fees
 * Convert with fee calculation
 */
router.post(
  "/convert-with-fees",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { amount, fromCurrency, toCurrency, feePercentage } = req.body;

      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const numAmount = parseFloat(amount);
      const numFee = feePercentage ? parseFloat(feePercentage) : 0.5;

      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
      }

      const result =
        await currencyConversionService.calculateConversionWithFees(
          numAmount,
          fromCurrency,
          toCurrency,
          numFee,
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error calculating conversion with fees:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Calculation failed",
      });
    }
  },
);

/**
 * GET /api/currency/rate/:from/:to
 * Get exchange rate between two currencies
 */
router.get("/rate/:from/:to", async (req: Request, res: Response) => {
  try {
    const { from, to } = req.params;

    const rate = await currencyConversionService.getExchangeRate(
      from.toUpperCase(),
      to.toUpperCase(),
    );

    res.json({
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch rate",
    });
  }
});

/**
 * GET /api/currency/historical/:from/:to
 * Get historical exchange rate
 */
router.get(
  "/historical/:from/:to",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { from, to } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter required",
        });
      }

      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const rate = await currencyConversionService.getHistoricalRate(
        from.toUpperCase(),
        to.toUpperCase(),
        targetDate,
      );

      res.json({
        success: true,
        data: {
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          rate,
          date: targetDate.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching historical rate:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch historical rate",
      });
    }
  },
);

/**
 * POST /api/currency/exchange
 * Execute currency exchange (with email notification)
 */
router.post(
  "/exchange",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      const user = (req as any).user;

      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
      }

      // Calculate conversion with fees
      const conversion =
        await currencyConversionService.calculateConversionWithFees(
          numAmount,
          fromCurrency,
          toCurrency,
          0.5, // 0.5% fee
        );

      // In production: Execute actual exchange transaction
      // For now, return the conversion details

      const exchangeRecord = {
        id: `exch_${Date.now()}`,
        userId: user.id,
        fromAmount: conversion.inputAmount,
        fromCurrency,
        toAmount: conversion.outputAmount,
        toCurrency,
        fee: conversion.fee,
        rate: conversion.rate,
        effectiveRate: conversion.effectiveRate,
        status: "completed",
        timestamp: new Date(),
      };

      // TODO: Send transaction notification email
      // import EmailTemplates from '../lib/emailTemplates';
      // import { emailService } from '../lib/emailService';
      //
      // const email = EmailTemplates.transactionNotification({
      //   amount: conversion.inputAmount.toFixed(2),
      //   cryptoAmount: conversion.outputAmount.toFixed(6),
      //   cryptoSymbol: toCurrency,
      //   senderName: user.name,
      //   paymentMethod: `${fromCurrency} to ${toCurrency}`,
      //   transactionId: exchangeRecord.id,
      //   dateTime: new Date().toLocaleString(),
      //   isCrypto: ['SOL', 'ETH', 'BTC'].includes(toCurrency),
      // });
      //
      // await emailService.sendEmail({
      //   from: 'notifications@advanciapayledger.com',
      //   to: user.email,
      //   subject: email.subject,
      //   html: email.html,
      //   text: email.text,
      // });

      res.json({
        success: true,
        data: exchangeRecord,
        message: "Exchange completed successfully",
      });
    } catch (error) {
      console.error("Error executing exchange:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Exchange failed",
      });
    }
  },
);

export default router;
