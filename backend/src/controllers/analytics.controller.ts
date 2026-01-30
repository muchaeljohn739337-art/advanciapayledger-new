import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalRevenue,
      activeCustomers,
      totalTransactions,
      monthlyRevenue
    ] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" }
      }),
      prisma.user.count({
        where: { 
          role: { in: ["PATIENT", "PROVIDER"] },
          isActive: true
        }
      }),
      prisma.payment.count({
        where: { status: "COMPLETED" }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setDate(1))
          }
        }
      })
    ]);

    res.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      activeCustomers,
      totalTransactions,
      monthlyRevenue: monthlyRevenue._sum.amount || 0
    });
  } catch (error) {
    logger.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

export const getPaymentSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lte: endDate ? new Date(endDate as string) : new Date()
        }
      },
      include: {
        patient: true,
        facility: true
      }
    });

    const summary = payments.reduce((acc, payment) => {
      const method = payment.method;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += payment.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    res.json({
      summary,
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    });
  } catch (error) {
    logger.error("Error fetching payment summary:", error);
    res.status(500).json({ error: "Failed to fetch payment summary" });
  }
};

export const getRevenueTrends = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date(Date.now() - (parseInt(days as string) * 24 * 60 * 60 * 1000));
    
    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startDate }
      },
      select: {
        amount: true,
        createdAt: true,
        method: true
      }
    });

    const trends = payments.reduce((acc, payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0, byMethod: {} };
      }
      acc[date].total += payment.amount;
      acc[date].count += 1;
      
      const method = payment.method;
      if (!acc[date].byMethod[method]) {
        acc[date].byMethod[method] = 0;
      }
      acc[date].byMethod[method] += payment.amount;
      
      return acc;
    }, {} as Record<string, { total: number; count: number; byMethod: Record<string, number> }>);

    res.json(trends);
  } catch (error) {
    logger.error("Error fetching revenue trends:", error);
    res.status(500).json({ error: "Failed to fetch revenue trends" });
  }
};

export const getFacilityPerformance = async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        patients: {
          include: {
            payments: {
              where: { status: "COMPLETED" }
            }
          }
        },
        providers: true
      }
    });

    const performance = facilities.map(facility => {
      const totalRevenue = facility.patients.reduce((sum, patient) => 
        sum + patient.payments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
      );
      
      const totalTransactions = facility.patients.reduce((sum, patient) => 
        sum + patient.payments.length, 0
      );

      return {
        id: facility.id,
        name: facility.name,
        type: facility.type,
        patientCount: facility.patients.length,
        providerCount: facility.providers.length,
        totalRevenue,
        totalTransactions,
        avgTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      };
    });

    res.json(performance);
  } catch (error) {
    logger.error("Error fetching facility performance:", error);
    res.status(500).json({ error: "Failed to fetch facility performance" });
  }
};

export const getPatientOverview = async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.query;
    
    const where = facilityId ? { facilityId: facilityId as string } : {};
    
    const patients = await prisma.patient.findMany({
      where,
      include: {
        payments: {
          where: { status: "COMPLETED" }
        },
        facility: true
      }
    });

    const overview = patients.map(patient => ({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      facility: patient.facility.name,
      totalPayments: patient.payments.length,
      totalAmount: patient.payments.reduce((sum, payment) => sum + payment.amount, 0),
      lastPayment: patient.payments.length > 0 
        ? Math.max(...patient.payments.map(p => p.createdAt.getTime()))
        : null
    }));

    res.json(overview);
  } catch (error) {
    logger.error("Error fetching patient overview:", error);
    res.status(500).json({ error: "Failed to fetch patient overview" });
  }
};

export const getRevenueForecast = async (req: Request, res: Response) => {
  try {
    const { months = 12 } = req.query;
    
    // Get historical data for the last 3 months
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const historicalPayments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: threeMonthsAgo }
      },
      select: { amount: true, createdAt: true }
    });

    // Calculate monthly averages
    const monthlyAverages = Array.from({ length: 3 }, (_, i) => {
      const monthStart = new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000);
      
      return historicalPayments
        .filter(p => p.createdAt >= monthStart && p.createdAt < monthEnd)
        .reduce((sum, p) => sum + p.amount, 0);
    });

    const avgMonthlyRevenue = monthlyAverages.reduce((sum, val) => sum + val, 0) / 3;
    const growthRate = 0.05; // 5% monthly growth assumption

    // Generate forecast
    const forecast = Array.from({ length: parseInt(months as string) }, (_, i) => {
      const projectedRevenue = avgMonthlyRevenue * Math.pow(1 + growthRate, i);
      const date = new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000);
      
      return {
        month: date.toISOString().slice(0, 7),
        projectedRevenue,
        confidence: i < 3 ? 'high' : i < 6 ? 'medium' : 'low'
      };
    });

    res.json({
      forecast,
      assumptions: {
        avgMonthlyRevenue,
        growthRate,
        confidence: 'Based on 3-month historical data'
      }
    });
  } catch (error) {
    logger.error("Error generating revenue forecast:", error);
    res.status(500).json({ error: "Failed to generate revenue forecast" });
  }
};
