'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/email';
import { hash } from '../encrypt';
import { randomBytes } from 'crypto';

const generateToken = () => randomBytes(32).toString('hex');

const getVerificationEmailLink = (token: string) =>
  `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`;

const getPasswordResetLink = (token: string) =>
  `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`;

export async function sendVerificationEmailToken(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const verificationLink = getVerificationEmailLink(token);

    await sendVerificationEmail({
      email,
      verificationLink,
    }).catch((error) => {
      console.error('Failed to send verification email:', error);
    });

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function verifyEmail(token: string) {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, message: 'Invalid or expired token' };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return { success: false, message: 'Token has expired' };
    }

    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const resetLink = getPasswordResetLink(token);

    await sendPasswordResetEmail({
      email,
      resetLink,
    }).catch((error) => {
      console.error('Failed to send password reset email:', error);
    });

    return {
      success: true,
      message: 'Password reset email sent successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken) {
      return { success: false, message: 'Invalid or expired token' };
    }

    if (passwordResetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      });
      return { success: false, message: 'Token has expired' };
    }

    const hashedPassword = await hash(newPassword);

    await prisma.user.update({
      where: { email: passwordResetToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id },
    });

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
