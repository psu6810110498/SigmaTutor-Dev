import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import { authService } from '../services/auth.service.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // เรียกใช้ฟังก์ชันที่เราเพิ่งเขียนใน auth.service.ts
        const tokens = await authService.validateGoogleUser(profile);
        return done(null, tokens);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

// Boilerplate สำหรับ Passport (ต้องมีเพื่อให้ระบบทำงานได้)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));