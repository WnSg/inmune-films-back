import { AuthServices } from '../auth';
import jwt from 'jsonwebtoken';
import { secret } from '../../config';
import { HttpError } from '../../types/http.error';
import bcrypt from 'bcrypt';

//const secret = process.env.JWT_SECRET || 'mySecretKey123';
//console.log('JWT_SECRET:', process.env.JWT_SECRET);

describe('AuthServices', () => {
  describe('createJWT', () => {
    it('should create a valid JWT', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = AuthServices.createJWT(payload);
      
      // Verifica que el token sea válido
      const decoded = jwt.verify(token, secret);
      expect(decoded).toMatchObject(payload);
    });
  });

  describe('verifyJWTGettingPayload', () => {
    it('should verify a valid JWT and return the payload', () => {
      const payload = { id: 1, username: 'testuser' };
      const token = jwt.sign(payload, secret);
      const result = AuthServices.verifyJWTGettingPayload(token);

      expect(result).toMatchObject(payload);
    });

    it('should throw an error for an invalid token', () => {
      const invalidToken = 'invalid.token';
      
      // Verifica que lance un HttpError
      expect(() => AuthServices.verifyJWTGettingPayload(invalidToken))
        .toThrow(HttpError);
    });
  });
});

describe('AuthServices Hashing', () => {
  describe('hash', () => {
    it('should hash a value', async () => {
      const value = 'password123';
      const hashedValue = await AuthServices.hash(value);

      expect(hashedValue).not.toBe(value); // El valor encriptado no debe ser igual al original
    });
  });

  describe('compare', () => {
    it('should return true if the hash matches the value', async () => {
      const value = 'password123';
      const hashedValue = await AuthServices.hash(value);
      const isMatch = await AuthServices.compare(value, hashedValue);

      expect(isMatch).toBe(true);
    });

    it('should return false if the hash does not match the value', async () => {
      const value = 'password123';
      const hashedValue = await AuthServices.hash('differentPassword');
      const isMatch = await AuthServices.compare(value, hashedValue);

      expect(isMatch).toBe(false);
    });
  });
});

