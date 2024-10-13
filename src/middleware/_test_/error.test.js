import { handleError } from '../error';
import { HttpError } from '../../types/http.error';
import mongoose, { mongo } from 'mongoose';

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it('should handle HttpError correctly', () => {
    const error = new HttpError(401, 'Unauthorized', 'Invalid token');

    handleError(error, req, res, next);

    // Verifica que el estado de la respuesta sea 401
    expect(res.status).toHaveBeenCalledWith(401);

    // Verifica que el mensaje de estado sea "Invalid token"
    expect(res.statusMessage).toBe('Invalid token');

    // Verifica que la respuesta enviada contenga el estado
    expect(res.send).toHaveBeenCalledWith({
      status: 401,
    });
  });

  it('should handle Mongoose ValidationError correctly', () => {
    const error = new mongoose.Error.ValidationError();

    handleError(error, req, res, next);

    // Verifica que el estado de la respuesta sea 400
    expect(res.status).toHaveBeenCalledWith(400);

    // Verifica que el mensaje de estado sea "Bad Request"
    expect(res.statusMessage).toBe('Bad Request');

    // Verifica que la respuesta enviada contenga el estado
    expect(res.send).toHaveBeenCalledWith({
      status: '400 Bad Request',
    });
  });

  it('should handle MongoServerError correctly', () => {
    const error = new mongo.MongoServerError({ message: 'Duplicate key error' });

    handleError(error, req, res, next);

    // Verifica que el estado de la respuesta sea 406
    expect(res.status).toHaveBeenCalledWith(406);

    // Verifica que el mensaje de estado sea "Not accepted"
    expect(res.statusMessage).toBe('Not accepted');

    // Verifica que la respuesta enviada contenga el estado
    expect(res.send).toHaveBeenCalledWith({
      status: '406 Not accepted',
    });
  });

  it('should handle generic errors with a 500 status', () => {
    const error = new Error('Something went wrong');

    handleError(error, req, res, next);

    // Verifica que el estado de la respuesta sea 500
    expect(res.status).toHaveBeenCalledWith(500);

    // Verifica que la respuesta enviada contenga el mensaje de error
    expect(res.send).toHaveBeenCalledWith({
      error: 'Something went wrong',
    });
  });
});
