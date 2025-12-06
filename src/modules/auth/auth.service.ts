import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import AppError from "../../shared/utils/AppError.js";
import authRepository from "./auth.repository.js";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "./auth.schema.js";
import eventBus from "../../shared/bus/event-bus.js"; // [NEW] Import Event Bus

class AuthService {
  async register(input: RegisterInput) {
    // 1. Check Email
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) throw new AppError("Email is already registered", 409);

    // 2. Check Phone
    if (input.phone) {
      const existingPhone = await authRepository.findUserByPhone(input.phone);
      if (existingPhone)
        throw new AppError("Phone number is already registered", 409);
    }

    // 3. Validate Role
    const role = await authRepository.findRoleByName(input.role);
    if (!role) throw new AppError(`Role '${input.role}' not found`, 500);

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 5. Create User
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

    // 6. [CRITICAL] Publish Event
    // This triggers Trust Engine (Init Score) and Notification (Welcome Push)
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

    // [MOBILE OPTIMIZATION] Increased expiry to 30 days
    const token = jwt.sign(
      { id: user.id, email: user.email, role: primaryRole },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primaryRole,
      },
    };
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
}

export default new AuthService();
