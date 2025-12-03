import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import AppError from "../../shared/utils/AppError.js";
import authRepository from "./auth.repository.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";

class AuthService {
  /**
   * Handle Registration Logic
   */
  async register(input: RegisterInput) {
    // 1. Check if email exists
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    // 2. Check if phone number exists (if provided)
    if (input.phone) {
      const existingPhone = await authRepository.findUserByPhone(input.phone);
      if (existingPhone) {
        throw new AppError("Phone number is already registered", 409);
      }
    }

    // 3. Validate Role
    const role = await authRepository.findRoleByName(input.role);
    if (!role) {
      throw new AppError(
        `Role '${input.role}' not found. Please run database seeder.`,
        500
      );
    }

    // 4. Hash Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(input.password, saltRounds);

    // 5. Create Data via Repository
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

    // 6. Return DTO
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: input.role,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * Handle Login Logic
   */
  async login(input: LoginInput) {
    // 1. Find User
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // 2. Verify Password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // 3. Generate JWT
    const primaryRole =
      user.roles.length > 0 ? user.roles[0].role.name : "UNKNOWN";

    const token = jwt.sign(
      { id: user.id, email: user.email, role: primaryRole },
      env.JWT_SECRET,
      { expiresIn: "1d" }
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

  /**
   * Get Current User Profile
   * Uses Repository to fetch data
   */
  async getMe(userId: string) {
    const user = await authRepository.findUserByIdWithProfiles(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Exclude sensitive data (password)
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default new AuthService();
