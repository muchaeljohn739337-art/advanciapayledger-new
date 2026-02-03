import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/encryption';
import { logger } from '../utils/logger';
import { UserRole, UserStatus } from "@prisma/client";

class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          status: true,
          facilityId: true,
          createdAt: true,
        },
      });
      res.json(users);
    } catch (error) {
      logger.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role,
        phoneNumber,
        facilityId,
        status,
      } = req.body;

      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }

      const passwordHash = await hashPassword(password);

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: role as UserRole,
          phoneNumber,
          facilityId,
          status: (status as UserStatus) || UserStatus.PENDING_VERIFICATION,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      });

      logger.info(`User created by admin: ${email}`);
      res.status(201).json(newUser);
    } catch (error) {
      logger.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, role, status, phoneNumber, facilityId } =
        req.body;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          role: role as UserRole,
          status: status as UserStatus,
          phoneNumber,
          facilityId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      });

      logger.info(`User updated: ${updatedUser.email}`);
      res.json(updatedUser);
    } catch (error) {
      logger.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.user.delete({ where: { id } });

      logger.info(`User deleted: ${id}`);
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }

  async approveUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(UserStatus).includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.status === status) {
        return res.status(400).json({ error: "User already has this status" });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      });

      logger.info(`User status updated to ${status}: ${updatedUser.email}`);
      res.json(updatedUser);
    } catch (error) {
      logger.error("Error approving user:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  }
}

export const userController = new UserController();
