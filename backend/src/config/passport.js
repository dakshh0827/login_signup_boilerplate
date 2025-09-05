// server/src/config/passport.js - FIXED VERSION
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define user select fields that exist in your schema
const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
  // Remove these if they don't exist in your schema:
  // role: true,
  // provider: true,
  // providerId: true,
};

// JWT Strategy for token authentication
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key-for-development-only',
      algorithms: ['HS256'],
    },
    async (payload, done) => {
      try {
        console.log('JWT Strategy - Looking for user:', payload.userId || payload.id);
        
        const user = await prisma.user.findUnique({
          where: { id: payload.userId || payload.id },
          select: userSelect,
        });

        if (user) {
          console.log('JWT Strategy - User found:', user.email);
          return done(null, user);
        } else {
          console.log('JWT Strategy - User not found');
          return done(null, false);
        }
      } catch (error) {
        console.error('JWT Strategy error:', error);
        return done(error, false);
      }
    }
  )
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? `${process.env.SERVER_URL}/auth/oauth/google/callback`
        : 'http://localhost:5001/auth/oauth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile received:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName
        });

        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Update existing user with Google info if not already linked
          // Only update fields that exist in your schema
          const updateData = {
            avatar: profile.photos?.[0]?.value || user.avatar,
            isVerified: true,
          };

          // Add these only if they exist in your schema:
          // updateData.provider = 'google';
          // updateData.providerId = profile.id;

          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        } else {
          // Create new user
          const names = profile.displayName?.split(' ') || ['', ''];
          const createData = {
            email,
            firstName: names[0] || profile.name?.givenName || '',
            lastName: names.slice(1).join(' ') || profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value,
            isVerified: true,
          };

          // Add these only if they exist in your schema:
          // createData.provider = 'google';
          // createData.providerId = profile.id;
          // createData.role = 'END_USER';

          user = await prisma.user.create({
            data: createData,
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? `${process.env.SERVER_URL}/auth/oauth/github/callback`
        : 'http://localhost:5001/auth/oauth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('GitHub OAuth profile received:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          username: profile.username
        });

        const email = profile.emails?.find(e => e.primary)?.value || profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in GitHub profile'), null);
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Update existing user with GitHub info if not already linked
          const updateData = {
            avatar: profile.photos?.[0]?.value || user.avatar,
            isVerified: true,
          };

          // Add these only if they exist in your schema:
          // updateData.provider = 'github';
          // updateData.providerId = profile.id;

          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        } else {
          // Create new user
          const displayName = profile.displayName || profile.username || '';
          const names = displayName.split(' ');
          
          const createData = {
            email,
            firstName: names[0] || profile.name?.givenName || profile.username || '',
            lastName: names.slice(1).join(' ') || profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value,
            isVerified: true,
          };

          // Add these only if they exist in your schema:
          // createData.provider = 'github';
          // createData.providerId = profile.id;
          // createData.role = 'END_USER';

          user = await prisma.user.create({
            data: createData,
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize/deserialize user (required by Passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

export default passport;
