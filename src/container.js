
import { config } from './config/env.js';
import { AuthController } from './controllers/auth.controller.js';
import { AvatarController } from './controllers/avatar.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { createImageUpload } from './middleware/uploade.js';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository.js';
import { UsersRepository } from './repositories/users.repository.js';
import { AuthService } from './services/auth.service.js';
import { AvatarService } from './services/avatar.service.js';
import { GithubOAuthClient } from './services/github-oauth.client.js';
import { ImageService } from './services/image.service.js';
import { TokenService } from './services/token.service.js';
import { UsersService } from './services/users.service.js';
import { LocalDiskStorage } from './storage/local-disk.storage.js';
import { S3Storage } from './storage/s3.storage.js';

// Select local disk or S3 storage based on configuration.
function createStorage(uploads) {
  if (uploads.driver === 's3') {
    return new S3Storage(config.s3);
  }

  return new LocalDiskStorage({
    dir: uploads.localDir,
    publicBaseUrl: uploads.publicBaseUrl,
  });
}

// Composition root: creates and connects the application dependencies.
export function createContainer(overrides = {}) {
  const usersRepository =
    overrides.usersRepository ?? new UsersRepository();

  const refreshTokensRepository =
    overrides.refreshTokensRepository ?? new RefreshTokensRepository();

  const usersService =
    overrides.usersService ??
    new UsersService(usersRepository, {
      hash: overrides.hashPassword,
      verify: overrides.verifyPassword,
    });

  const tokenService = new TokenService(refreshTokensRepository, {
    ...config.auth,
    ...overrides.auth,
  });

  const authService = new AuthService(usersService, tokenService);

  const githubClient = new GithubOAuthClient(
    { ...config.github, ...overrides.github },
    { fetch: overrides.fetch },
  );

  // ── Assignment 2.4: Avatar and image upload ──
  const uploads = { ...config.uploads, ...overrides.uploads };

  const storage =
    overrides.storage ?? createStorage(uploads);

  const imageService = new ImageService();

  const avatarService = new AvatarService(
    usersService,
    imageService,
    storage,
    { maxBytes: uploads.maxBytes },
  );

  const avatarController = new AvatarController(avatarService);

  const avatarUpload = createImageUpload({
    fieldName: 'avatar',
    maxBytes: uploads.maxBytes,
  });

  return {
    usersRepository,
    refreshTokensRepository,
    usersService,
    tokenService,
    authService,
    githubClient,
    authenticate: createAuthenticate(tokenService),
    usersController: new UsersController(usersService),
    authController: new AuthController(
      authService,
      usersService,
      githubClient,
    ),

    // Assignment 2.4 dependencies
    storage,
    uploads,
    avatarService,
    avatarController,
    avatarUpload,
  };
}
