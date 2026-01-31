import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface ChamberAssignmentFactors {
  serviceType: string;
  duration: number;
  equipmentNeeded: string[];
  doctorPreference?: string[];
  patientMobility?: 'high' | 'medium' | 'low';
}

export class ChamberService {
  /**
   * Get all chambers with optional filters
   */
  async getAllChambers(filters?: {
    facilityId?: string;
    status?: string;
    floor?: number;
    type?: string;
  }) {
    try {
      const where: any = {};
      
      if (filters?.facilityId) where.facilityId = filters.facilityId;
      if (filters?.status) where.status = filters.status;
      if (filters?.floor) where.floor = filters.floor;
      if (filters?.type) where.type = filters.type;

      const chambers = await prisma.chamber.findMany({
        where,
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: [
          { floor: 'asc' },
          { name: 'asc' },
        ],
      });

      return chambers;
    } catch (error) {
      logger.error('Error fetching chambers:', error);
      throw error;
    }
  }

  /**
   * Get chamber by ID with details
   */
  async getChamberById(id: string) {
    try {
      const chamber = await prisma.chamber.findUnique({
        where: { id },
        include: {
          facility: true,
          bookings: {
            where: {
              status: { in: ['confirmed', 'pending'] },
            },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              doctor: {
                select: {
                  firstName: true,
                  lastName: true,
                  specialty: true,
                },
              },
            },
            orderBy: {
              startTime: 'asc',
            },
          },
          schedules: {
            where: {
              endTime: { gte: new Date() },
            },
            orderBy: {
              startTime: 'asc',
            },
          },
          maintenanceRecords: {
            where: {
              status: { in: ['scheduled', 'in_progress'] },
            },
            orderBy: {
              scheduledAt: 'asc',
            },
          },
        },
      });

      return chamber;
    } catch (error) {
      logger.error('Error fetching chamber:', error);
      throw error;
    }
  }

  /**
   * Update chamber status
   */
  async updateChamberStatus(id: string, status: string) {
    try {
      const chamber = await prisma.chamber.update({
        where: { id },
        data: { status },
      });

      logger.info(`Chamber ${id} status updated to ${status}`);
      return chamber;
    } catch (error) {
      logger.error('Error updating chamber status:', error);
      throw error;
    }
  }

  /**
   * Check chamber availability for a time slot
   */
  async checkAvailability(
    chamberId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      const conflicts = await prisma.booking.count({
        where: {
          chamberId,
          status: { in: ['confirmed', 'pending'] },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
      });

      return conflicts === 0;
    } catch (error) {
      logger.error('Error checking chamber availability:', error);
      throw error;
    }
  }

  /**
   * Get available chambers for a time slot
   */
  async getAvailableChambers(
    facilityId: string,
    startTime: Date,
    endTime: Date,
    filters?: {
      type?: string;
      floor?: number;
      equipment?: string[];
    }
  ) {
    try {
      const chambers = await prisma.chamber.findMany({
        where: {
          facilityId,
          status: 'available',
          ...(filters?.type && { type: filters.type }),
          ...(filters?.floor && { floor: filters.floor }),
        },
      });

      const availableChambers = [];

      for (const chamber of chambers) {
        const isAvailable = await this.checkAvailability(
          chamber.id,
          startTime,
          endTime
        );

        if (isAvailable) {
          // Check equipment if specified
          if (filters?.equipment && filters.equipment.length > 0) {
            const chamberEquipment = chamber.equipment as string[];
            const hasAllEquipment = filters.equipment.every((eq) =>
              chamberEquipment.includes(eq)
            );
            if (hasAllEquipment) {
              availableChambers.push(chamber);
            }
          } else {
            availableChambers.push(chamber);
          }
        }
      }

      return availableChambers;
    } catch (error) {
      logger.error('Error fetching available chambers:', error);
      throw error;
    }
  }

  /**
   * Smart chamber assignment algorithm
   */
  async assignOptimalChamber(
    facilityId: string,
    startTime: Date,
    endTime: Date,
    factors: ChamberAssignmentFactors
  ) {
    try {
      const availableChambers = await this.getAvailableChambers(
        facilityId,
        startTime,
        endTime,
        {
          type: factors.serviceType,
          equipment: factors.equipmentNeeded,
        }
      );

      if (availableChambers.length === 0) {
        return null;
      }

      // Get today's usage count for each chamber
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const chambersWithScores = await Promise.all(
        availableChambers.map(async (chamber) => {
          const todayUsageCount = await prisma.booking.count({
            where: {
              chamberId: chamber.id,
              startTime: {
                gte: today,
                lt: tomorrow,
              },
            },
          });

          let score = 100;

          // Match service type (+30 points)
          if (chamber.type === factors.serviceType) {
            score += 30;
          }

          // Has required equipment (+25 points per match)
          const chamberEquipment = chamber.equipment as string[];
          factors.equipmentNeeded.forEach((eq) => {
            if (chamberEquipment.includes(eq)) {
              score += 25;
            }
          });

          // Doctor preference (+20 points)
          if (
            factors.doctorPreference &&
            factors.doctorPreference.includes(chamber.id)
          ) {
            score += 20;
          }

          // Floor preference for mobility (-10 per floor for low mobility)
          if (factors.patientMobility === 'low' && chamber.floor > 1) {
            score -= (chamber.floor - 1) * 10;
          }

          // Recent usage (prefer less-used rooms for even distribution)
          score -= todayUsageCount * 5;

          return {
            ...chamber,
            score,
            todayUsageCount,
          };
        })
      );

      // Sort by score (highest first)
      chambersWithScores.sort((a, b) => b.score - a.score);

      logger.info('Chamber assignment scores:', {
        chambers: chambersWithScores.map((c) => ({
          id: c.id,
          name: c.name,
          score: c.score,
        })),
      });

      return chambersWithScores[0];
    } catch (error) {
      logger.error('Error assigning optimal chamber:', error);
      throw error;
    }
  }

  /**
   * Get chamber utilization metrics
   */
  async getChamberUtilization(chamberId: string, date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await prisma.booking.findMany({
        where: {
          chamberId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { in: ['confirmed', 'completed'] },
        },
        select: {
          startTime: true,
          endTime: true,
          duration: true,
        },
      });

      const totalMinutesOccupied = bookings.reduce(
        (sum, booking) => sum + booking.duration,
        0
      );

      const availableHours = 8; // Assuming 8-hour workday
      const totalMinutesAvailable = availableHours * 60;
      const occupancyRate = (totalMinutesOccupied / totalMinutesAvailable) * 100;

      return {
        date,
        totalBookings: bookings.length,
        totalMinutesOccupied,
        totalMinutesAvailable,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        averageBookingDuration:
          bookings.length > 0
            ? Math.round(totalMinutesOccupied / bookings.length)
            : 0,
      };
    } catch (error) {
      logger.error('Error calculating chamber utilization:', error);
      throw error;
    }
  }

  /**
   * Schedule chamber maintenance
   */
  async scheduleMaintenance(data: {
    chamberId: string;
    type: string;
    scheduledAt: Date;
    notes?: string;
    assignedTo?: string;
  }) {
    try {
      const maintenance = await prisma.chamberMaintenance.create({
        data: {
          ...data,
          status: 'scheduled',
        },
      });

      // Update chamber status to maintenance
      await this.updateChamberStatus(data.chamberId, 'maintenance');

      logger.info(`Maintenance scheduled for chamber ${data.chamberId}`);
      return maintenance;
    } catch (error) {
      logger.error('Error scheduling maintenance:', error);
      throw error;
    }
  }

  /**
   * Complete chamber maintenance
   */
  async completeMaintenance(maintenanceId: string) {
    try {
      const maintenance = await prisma.chamberMaintenance.update({
        where: { id: maintenanceId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update chamber status back to available
      await this.updateChamberStatus(maintenance.chamberId, 'available');

      logger.info(`Maintenance completed for chamber ${maintenance.chamberId}`);
      return maintenance;
    } catch (error) {
      logger.error('Error completing maintenance:', error);
      throw error;
    }
  }
}

export const chamberService = new ChamberService();
