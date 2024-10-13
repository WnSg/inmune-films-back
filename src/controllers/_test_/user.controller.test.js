import { UserController } from '../user.controller.js';
import { AuthServices } from '../../services/auth.js';
import { HttpError } from '../../types/http.error.js';

jest.mock('../../services/auth.js');

describe('UserController', () => {
  let req, res, next, userRepo, userController;

  beforeEach(() => {
    req = {
      body: {
        user: 'testUser',
        password: 'testPassword',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    userRepo = {
      create: jest.fn(),
      search: jest.fn(),
    };
    userController = new UserController(userRepo);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should hash the password and call repo.create', async () => {
      AuthServices.hash.mockResolvedValue('hashedPassword');
      userRepo.create.mockResolvedValue({ id: 1, userName: 'testUser' });

      await userController.register(req, res, next);

      expect(AuthServices.hash).toHaveBeenCalledWith('testPassword');
      expect(userRepo.create).toHaveBeenCalledWith({
        user: 'testUser',
        password: 'hashedPassword',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ id: 1, userName: 'testUser' });
    });

    it('should handle errors and call next with error', async () => {
      const mockError = new Error('Register error');
      AuthServices.hash.mockRejectedValue(mockError);

      await userController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('login', () => {
    it('should throw an error if user or password is missing', async () => {
      req.body = { user: null, password: null };

      await userController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        new HttpError(400, 'Bad Request', 'Invalid user or password')
      );
    });

    it('should search for user by userName and then by email', async () => {
      userRepo.search
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 1, userName: 'testUser', password: 'hashedPassword' }]);

      AuthServices.compare.mockResolvedValue(true);
      AuthServices.createJWT.mockReturnValue('fakeToken');

      await userController.login(req, res, next);

      expect(userRepo.search).toHaveBeenCalledWith({
        key: 'userName',
        value: 'testUser',
      });
      expect(userRepo.search).toHaveBeenCalledWith({
        key: 'email',
        value: 'testUser',
      });

      expect(AuthServices.compare).toHaveBeenCalledWith('testPassword', 'hashedPassword');
      expect(AuthServices.createJWT).toHaveBeenCalledWith({
        id: 1,
        userName: 'testUser',
      });

      expect(res.send).toHaveBeenCalledWith({
        token: 'fakeToken',
        user: { id: 1, userName: 'testUser', password: 'hashedPassword' },
      });
    });

    it('should throw an error if password is incorrect', async () => {
      userRepo.search.mockResolvedValue([{ id: 1, userName: 'testUser', password: 'hashedPassword' }]);

      AuthServices.compare.mockResolvedValue(false);

      await userController.login(req, res, next);

      expect(AuthServices.compare).toHaveBeenCalledWith('testPassword', 'hashedPassword');
      expect(next).toHaveBeenCalledWith(
        new HttpError(400, 'Bad Request', 'Invalid user or password')
      );
    });

    it('should handle errors and call next with error', async () => {
      const mockError = new Error('Login error');
      userRepo.search.mockRejectedValue(mockError);

      await userController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
