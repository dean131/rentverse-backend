import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env.js";
import AppError from "../../shared/utils/AppError.js";
import authRepository from "./auth.repository.js";
import { SendOtpInput, VerifyOtpInput } from "./auth.schema.js";
import otpService from "./otp.service.js";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "./auth.schema.js";
import eventBus from "../../shared/bus/event-bus.js";
import redis from "../../config/redis.js";

class AuthService {
  /**
   * Helper: Generate Access (JWT) & Refresh (Opaque) Tokens
   * Stores Refresh Token in Redis with TTL.
   */
  private async generateTokens(userId: string, email: string, role: string) {
    // 1. Access Token (Stateless, 15 Minutes)
    const accessToken = jwt.sign({ id: userId, email, role }, env.JWT_SECRET, {
      expiresIn: "60m",
    });

    // 2. Refresh Token (Stateful, 30 Days)
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const redisKey = `rt:${refreshToken}`;
    const redisPayload = JSON.stringify({ userId, email, role });

    // Store in Redis: Expires in 30 days (seconds)
    await redis.setex(redisKey, 30 * 24 * 60 * 60, redisPayload);

    return { accessToken, refreshToken };
  }

  async register(input: RegisterInput) {
    // 1. Uniqueness Checks
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) throw new AppError("Email is already registered", 409);

    if (input.phone) {
      const existingPhone = await authRepository.findUserByPhone(input.phone);
      if (existingPhone)
        throw new AppError("Phone number is already registered", 409);
    }

    // 2. Role Validation
    const role = await authRepository.findRoleByName(input.role);
    if (!role) throw new AppError(`Role '${input.role}' not found`, 500);

    // 3. Create User
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const newUser = await authRepository.createUserWithProfile(
      {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        phone: input.phone,
      },
      role.id,
      input.role as "TENANT" | "LANDLORD"
    );

    // 4. [EVENT] Trigger Side Effects (Trust Score, Notifications)
    eventBus.publish("AUTH:USER_REGISTERED", {
      userId: newUser.id,
      email: newUser.email,
      role: input.role as "TENANT" | "LANDLORD",
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: input.role,
      createdAt: newUser.createdAt,
    };
  }

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const primaryRole =
      user.roles.length > 0 ? user.roles[0].role.name : "UNKNOWN";

    // Generate Token Pair
    const tokens = await this.generateTokens(user.id, user.email, primaryRole);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primaryRole,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const redisKey = `rt:${token}`;
    const data = await redis.get(redisKey);

    if (!data) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const { userId, email, role } = JSON.parse(data);

    // Rotation: Delete used token immediately
    await redis.del(redisKey);

    // Issue new pair
    return this.generateTokens(userId, email, role);
  }

  async logout(refreshToken: string) {
    await redis.del(`rt:${refreshToken}`);
    return true;
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserByIdWithProfiles(userId);
    if (!user) throw new AppError("User not found", 404);
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.phone) {
      const existing = await authRepository.findUserByPhone(input.phone);
      if (existing && existing.id !== userId) {
        throw new AppError("Phone number already in use", 409);
      }
    }
    const updated = await authRepository.updateUser(userId, {
      name: input.name,
      phone: input.phone,
    });
    const { password, ...safeUser } = updated;
    return safeUser;
  }

  /**
   * Send OTP
   */
  async sendVerificationOtp(input: SendOtpInput) {
    // Business Logic: You might want to check if user exists here if strict,
    // or just allow sending to prevent enumeration attacks.
    return await otpService.sendOtp(input.target, input.channel);
  }

  /**
   * Verify OTP & Update User Status
   */
  async verifyUserOtp(input: VerifyOtpInput) {
    // 1. Verify Logic (Redis)
    const isValid = await otpService.verifyOtp(input.target, input.channel, input.code);
    
    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // 2. Find User (Repository Call)
    const user = await authRepository.findUserByEmailOrPhone(input.target);

    if (!user) {
      // Logic decision: OTP is valid, but no user found in DB.
      return { message: "OTP verified successfully", isUserUpdated: false };
    }

    // 3. Prepare Update Data
    const updateData: { 
      emailVerifiedAt?: Date; 
      phoneVerifiedAt?: Date; 
      isVerified?: boolean 
    } = { isVerified: true };

    if (input.channel === "EMAIL") {
      updateData.emailVerifiedAt = new Date();
    } else {
      updateData.phoneVerifiedAt = new Date();
    }

    // 4. Update User (Repository Call)
    await authRepository.updateUserVerification(user.id, updateData);

    return { message: "User verified successfully", isUserUpdated: true };
  }
}

export default new AuthService();
