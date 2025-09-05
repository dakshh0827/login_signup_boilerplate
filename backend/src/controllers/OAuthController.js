// server/src/controllers/oauthController.js
import { PrismaClient } from '@prisma/client';
import TokenService from '../services/tokenService.js';

const prisma = new PrismaClient();

class OAuthController {
  static async googleCallback(req, res) {
    try {
      const { user } = req;

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }

      const { accessToken, refreshToken } = TokenService.generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      const redirectUrl = 
        `${process.env.CLIENT_URL}/login?` +
        `access_token=${accessToken}&` +
        `refresh_token=${refreshToken}&` +
        `user=${encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isVerified: user.isVerified,
        }))}`;

      // Add debug log to verify the redirect URL
      console.log('🔄 OAuth redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }

  static async githubCallback(req, res) {
    try {
      const { user } = req;

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }

      const { accessToken, refreshToken } = TokenService.generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      const redirectUrl = 
        `${process.env.CLIENT_URL}/login?` +
        `access_token=${accessToken}&` +
        `refresh_token=${refreshToken}&` +
        `user=${encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isVerified: user.isVerified,
        }))}`;

      // Add debug log to verify the redirect URL
      console.log('🔄 OAuth redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }

  static async unlinkOAuth(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user.password && user.provider === provider) {
        return res.status(400).json({
          success: false,
          message: 'Cannot unlink the only authentication method. Please set a password first.',
        });
      }

      const updateData = {
        providerId: null,
        refreshToken: null,
      };

      if (user.provider === provider) {
        updateData.provider = 'credentials';
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      res.json({
        success: true,
        message: `${provider} account unlinked successfully`,
      });
    } catch (error) {
      console.error('Unlink OAuth error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default OAuthController;
