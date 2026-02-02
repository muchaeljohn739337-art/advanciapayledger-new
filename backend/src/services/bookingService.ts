import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { chamberService } from './chamberService';

const prisma = new PrismaClient();

interface CreateBookingData {
  patientId: string;
  doctorId: string;
  facilityId: string;
  bookingDate: Date;
  startTime: Date;
  duration: number;
  serviceType: string;
  notes?: string;
  createdBy: string;
  chamberId?: string;
  equipmentNeeded?: string[];
  patientMobility?: 'high' | 'medium' | 'low';
}

export class BookingService {
  /**
   * Create a new booking with smart chamber assignment
   */
  async createBooking(data: CreateBookingData) {
    try {
      const endTime = new Date(
        data.startTime.getTime() + data.duration * 60000,
      );

      let chamberId = data.chamberId;

      // If no chamber specified, use smart assignment
      if (!chamberId) {
        const optimalChamber = await chamberService.assignOptimalChamber(
          data.facilityId,
          data.startTime,
          endTime,
          {
            serviceType: data.serviceType,
            duration: data.duration,
            equipmentNeeded: data.equipmentNeeded || [],
            patientMobility: data.patientMobility,
          },
        );

        if (!optimalChamber) {
          throw new Error("No available chambers for the requested time slot");
        }

        chamberId = optimalChamber.id;
        logger.info("Smart chamber assignment:", {
          chamberId,
          chamberName: optimalChamber.name,
          score: optimalChamber.score,
        });
      } else {
        // Verify chamber is available
        const isAvailable = await chamberService.checkAvailability(
          chamberId,
          data.startTime,
          endTime,
        );

        if (!isAvailable) {
          throw new Error(
            "Selected chamber is not available for the requested time slot",
          );
        }
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          chamberId,
          facilityId: data.facilityId,
          bookingDate: data.bookingDate,
          startTime: data.startTime,
          endTime,
          duration: data.duration,
          serviceType: data.serviceType,
          notes: data.notes,
          status: "pending",
          paymentStatus: "pending",
          createdBy: data.createdBy,
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
          chamber: {
            select: {
              name: true,
              floor: true,
              type: true,
            },
          },
          facility: {
            select: {
              name: true,
              address: true,
            },
          },
        },
      });

      // Create chamber schedule entry
      await prisma.chamberSchedule.create({
        data: {
          chamberId,
          bookingId: booking.id,
          status: "reserved",
          startTime: data.startTime,
          endTime,
        },
      });

      logger.info("Booking created:", {
        bookingId: booking.id,
        chamberId,
        startTime: data.startTime,
      });

      return booking;
    } catch (error) {
      logger.error("Error creating booking:", error);
      throw error;
    }
  }

  /**
   * Get all bookings with filters
   */
  async getBookings(
    user: { id: string; role: string },
    filters?: {
      facilityId?: string;
      patientId?: string;
      doctorId?: string;
      chamberId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    try {
      const where: any = {};

      // RLS-like filter: Non-admins/providers can only see their own bookings
      if (!["admin", "super_admin", "provider"].includes(user.role)) {
        where.patientId = user.id;
      }

      if (filters?.facilityId) where.facilityId = filters.facilityId;
      if (filters?.patientId) where.patientId = filters.patientId;
      if (filters?.doctorId) where.doctorId = filters.doctorId;
      if (filters?.chamberId) where.chamberId = filters.chamberId;
      if (filters?.status) where.status = filters.status;

      if (filters?.startDate || filters?.endDate) {
        where.startTime = {};
        if (filters.startDate) where.startTime.gte = filters.startDate;
        if (filters.endDate) where.startTime.lte = filters.endDate;
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
          chamber: {
            select: {
              name: true,
              floor: true,
              type: true,
            },
          },
          facility: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      });

      return bookings;
    } catch (error) {
      logger.error("Error fetching bookings:", error);
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: true,
          chamber: true,
          facility: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return booking;
    } catch (error) {
      logger.error("Error fetching booking:", error);
      throw error;
    }
  }

  /**
   * Update booking
   */
  async updateBooking(
    id: string,
    data: {
      startTime?: Date;
      duration?: number;
      chamberId?: string;
      status?: string;
      notes?: string;
      paymentStatus?: string;
    },
  ) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // If time or chamber is being changed, check availability
      if (data.startTime || data.duration || data.chamberId) {
        const startTime = data.startTime || booking.startTime;
        const duration = data.duration || booking.duration;
        const chamberId = data.chamberId || booking.chamberId;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        const isAvailable = await chamberService.checkAvailability(
          chamberId,
          startTime,
          endTime,
        );

        if (!isAvailable) {
          throw new Error("Chamber is not available for the requested time");
        }

        // Update chamber schedule
        await prisma.chamberSchedule.updateMany({
          where: { bookingId: id },
          data: {
            chamberId,
            startTime,
            endTime,
          },
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          ...data,
          ...(data.startTime &&
            data.duration && {
              endTime: new Date(
                data.startTime.getTime() + data.duration * 60000,
              ),
            }),
        },
        include: {
          patient: true,
          doctor: true,
          chamber: true,
          facility: true,
        },
      });

      logger.info("Booking updated:", { bookingId: id });
      return updatedBooking;
    } catch (error) {
      logger.error("Error updating booking:", error);
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason?: string) {
    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          notes: reason
            ? `${reason}\n\nCancelled at: ${new Date().toISOString()}`
            : `Cancelled at: ${new Date().toISOString()}`,
        },
      });

      // Update chamber schedule
      await prisma.chamberSchedule.updateMany({
        where: { bookingId: id },
        data: {
          status: "cancelled",
        },
      });

      logger.info("Booking cancelled:", { bookingId: id });
      return booking;
    } catch (error) {
      logger.error("Error cancelling booking:", error);
      throw error;
    }
  }

  /**
   * Confirm booking
   */
  async confirmBooking(id: string) {
    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          status: "confirmed",
        },
        include: {
          patient: true,
          doctor: true,
          chamber: true,
        },
      });

      // Update chamber schedule
      await prisma.chamberSchedule.updateMany({
        where: { bookingId: id },
        data: {
          status: "occupied",
        },
      });

      logger.info("Booking confirmed:", { bookingId: id });
      return booking;
    } catch (error) {
      logger.error("Error confirming booking:", error);
      throw error;
    }
  }

  /**
   * Complete booking
   */
  async completeBooking(id: string) {
    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          status: "completed",
        },
      });

      logger.info("Booking completed:", { bookingId: id });
      return booking;
    } catch (error) {
      logger.error("Error completing booking:", error);
      throw error;
    }
  }

  /**
   * Get daily schedule
   */
  async getDailySchedule(
    user: { id: string; role: string },
    facilityId: string,
    date: Date,
  ) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await this.getBookings(user, {
        facilityId,
        startDate: startOfDay,
        endDate: endOfDay,
      });

      return bookings;
    } catch (error) {
      logger.error("Error fetching daily schedule:", error);
      throw error;
    }
  }

  /**
   * Get weekly schedule
   */
  async getWeeklySchedule(
    user: { id: string; role: string },
    facilityId: string,
    startDate: Date,
  ) {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const bookings = await this.getBookings(user, {
        facilityId,
        startDate,
        endDate,
      });

      return bookings;
    } catch (error) {
      logger.error("Error fetching weekly schedule:", error);
      throw error;
    }
  }

  /**
   * Get doctor's schedule
   */
  async getDoctorSchedule(
    user: { id: string; role: string },
    doctorId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      const bookings = await this.getBookings(user, {
        doctorId,
        startDate,
        endDate,
      });

      return bookings;
    } catch (error) {
      logger.error("Error fetching doctor schedule:", error);
      throw error;
    }
  }

  /**
   * Get chamber schedule
   */
  async getChamberSchedule(
    user: { id: string; role: string },
    chamberId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      const bookings = await this.getBookings(user, {
        chamberId,
        startDate,
        endDate,
      });

      return bookings;
    } catch (error) {
      logger.error("Error fetching chamber schedule:", error);
      throw error;
    }
  }

  /**
   * Check for booking conflicts
   */
  async checkConflicts(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ) {
    try {
      const where: any = {
        doctorId,
        status: { in: ["confirmed", "pending"] },
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
      };

      if (excludeBookingId) {
        where.id = { not: excludeBookingId };
      }

      const conflicts = await prisma.booking.findMany({
        where,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          chamber: {
            select: {
              name: true,
            },
          },
        },
      });

      return conflicts;
    } catch (error) {
      logger.error("Error checking booking conflicts:", error);
      throw error;
    }
  }
}

export const bookingService = new BookingService();
