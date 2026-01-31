import { Request, Response, NextFunction } from "express";
import { authenticateToken } from "./auth";

export const authMiddleware = authenticateToken;

export default authMiddleware;
