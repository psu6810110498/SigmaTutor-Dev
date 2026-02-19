import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@sigma/db';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ✅ ตรวจสอบ JWT_SECRET เพื่อความปลอดภัยของระบบ
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not defined in environment variables.');
}

// ✅ ตัด profileImage ออกจาก Token เพื่อป้องกัน Token อ้วน (Database พัง)
export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  private async sendResetEmail(email: string, link: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Sigma Tutor" <noreply@sigmatutor.com>',
      to: email,
      subject: 'รีเซ็ตรหัสผ่านของคุณ - Sigma Tutor',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af; margin-bottom: 24px;">สวัสดีครับ/ค่ะ</h2>
            <p style="color: #4b5563; line-height: 1.6;">เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี Sigma Tutor ของคุณ หากคุณเป็นคนส่งคำขอนี้ โปรดคลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${link}" style="background-color: #0052CC; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">ตั้งรหัสผ่านใหม่</a>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">* ลิงก์นี้มีอายุการใช้งาน 1 ชั่วโมง หากคุณไม่ได้เป็นคนส่งคำขอนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">© 2026 Sigma Tutor Team</p>
          </div>
        </div>
      `,
    });
  }

  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) throw new Error('User with this email already exists');
    const hashedPassword = await bcrypt.hash(input.password, 12);
    return await prisma.user.create({
      data: { email: input.email, password: hashedPassword, name: input.name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    
    // ✅ แก้ไข: เพิ่ม !user.password เพื่อดักกรณี Google User ที่ไม่มีรหัสผ่าน
    // และเพื่อให้ TypeScript มั่นใจว่าบรรทัดถัดไป user.password จะไม่เป็น null ครับ
    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }
    
    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    // ✅ สร้าง Token โดยไม่เอา profileImage เข้าไป (ตามที่เรา Merge มา)
    const tokens = await this.generateTokens(user.id, user.email, user.name || '', user.role);
    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        profileImage: user.profileImage 
      }, 
      ...tokens 
    };
  }

  // ✅ ฟังก์ชันนี้จะหายแดงเมื่อคุณแก้ user.prisma และสั่ง npx prisma generate ครับ
  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, email: true, name: true, role: true, profileImage: true,
        phone: true, address: true, school: true, educationLevel: true, province: true, birthday: true
      }
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('ไม่พบผู้ใช้งานที่ใช้อีเมลนี้ในระบบ');

    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    try {
      await this.sendResetEmail(email, resetLink);
      return { success: true, message: 'ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว' };
    } catch (error: any) {
      throw new Error('ไม่สามารถส่งอีเมลได้ในขณะนี้ กรุณาลองใหม่ภายหลัง');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);

      // ✅ รวมเงื่อนไขความปลอดภัยให้ครบถ้วน
      if (newPassword.length < 8 || !hasUpperCase || !hasNumber) {
        throw new Error('รหัสผ่านไม่เป็นไปตามมาตรฐานความปลอดภัย');
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
      if (decoded.type !== 'reset') throw new Error('ประเภทของรหัสยืนยันไม่ถูกต้อง');

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashedPassword } });

      return { success: true, message: 'เปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว' };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') throw new Error('ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว');
      throw new Error(error.message || 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง');
    }
  }

  async validateGoogleUser(profile: any) {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const profileImage = profile.photos?.[0]?.value;

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          // ✅ บันทึกรูปโปรไฟล์ลง DB แต่ไม่เอาไปแบกไว้ใน Token
          data: { email, name, password: '', role: 'USER', profileImage },
        });
      }

      return await this.generateTokens(user.id, user.email, user.name || '', user.role);
    } catch (error: any) {
      console.error("🔥 Google Auth Error:", error);
      throw new Error(`ระบบขัดข้อง: ${error.message || 'ไม่ทราบสาเหตุ'}`);
    }
  }

  async refreshToken(refreshToken: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      throw new Error('Invalid or expired refresh token');
    }
    await prisma.session.delete({ where: { id: session.id } });
    return await this.generateTokens(session.user.id, session.user.email, session.user.name || '', session.user.role);
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  // ✅ ตัดการรับค่า profileImage ออกจาก Token Payload อย่างถาวร
  private async generateTokens(userId: string, email: string, name: string, role: string) {
    const payload: TokenPayload = { userId, email, name, role }; 
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
    const expiresIn = this.parseExpiration(JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresIn);
    await prisma.session.create({ data: { userId, refreshToken, expiresAt } });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload { 
    return jwt.verify(token, JWT_SECRET) as TokenPayload; 
  }

  private parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}

export const authService = new AuthService();