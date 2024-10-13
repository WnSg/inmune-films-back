import { FilmController } from '../film.controller';
import { jest } from '@jest/globals';

describe('FilmController', () => {
  let req, res, next, filmRepo, userRepo, filmController;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      get: jest.fn().mockReturnValue('localhost:3000'),
      protocol: 'http',
      baseUrl: '/api/films',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();

    filmRepo = {
      create: jest.fn(),
      queryById: jest.fn(),
      query: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    userRepo = {
      queryById: jest.fn(),
      update: jest.fn(),
    };

    filmController = new FilmController(filmRepo, userRepo);
  });

  describe('post', () => {
    it('should create a new film and add it to the user\'s films', async () => {
      req.body.tokenPayload = { id: 1 };
      req.body.title = 'Test Film';
      const user = { id: 1, films: [] };
      const newFilm = { id: 1, title: 'Test Film' };

      userRepo.queryById.mockResolvedValue(user);
      filmRepo.create.mockResolvedValue(newFilm);

      await filmController.post(req, res, next);

      expect(filmRepo.create).toHaveBeenCalledWith({ title: 'Test Film', owner: 1 });
      expect(user.films).toContain(newFilm);
      expect(userRepo.update).toHaveBeenCalledWith(1, user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(newFilm);
    });
  });

  describe('getAll', () => {
    it('should return a paginated list of films', async () => {
      req.query.page = 1;
      req.query.genre = 'Action';
      const films = [{ id: 1, title: 'Film 1' }, { id: 2, title: 'Film 2' }];
      filmRepo.query.mockResolvedValue(films);
      filmRepo.count.mockResolvedValue(10);

      await filmController.getAll(req, res, next);

      expect(filmRepo.query).toHaveBeenCalledWith(1, 6, 'Action');
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        items: films,
        count: 10,
        next: 'http://localhost:3000/api/films?genre=Action&page=2',
        previous: null,
      }));
    });
  });

  describe('deleteById', () => {
    it('should delete a film by ID and update the user\'s film list', async () => {
      req.body.tokenPayload = { id: 1 };
      req.params.id = 1;
      const user = { id: 1, films: [{ id: 1 }, { id: 2 }] };

      userRepo.queryById.mockResolvedValue(user);
      filmRepo.delete.mockResolvedValue();

      await filmController.deleteById(req, res, next);

      expect(filmRepo.delete).toHaveBeenCalledWith(1);
      expect(user.films).not.toContainEqual({ id: 1 });
      expect(userRepo.update).toHaveBeenCalledWith(1, user);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should throw an error if token payload is missing', async () => {
      req.body.tokenPayload = null;

      await filmController.deleteById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('addComment', () => {
    it('should add a comment to the film', async () => {
      req.body.tokenPayload = { id: 1 };
      req.body.comment = 'Great film!';
      req.params.id = 1;
      const film = { id: 1, comments: [] };
      const user = { id: 1, name: 'Test User' };

      filmRepo.queryById.mockResolvedValue(film);
      userRepo.queryById.mockResolvedValue(user);
      filmRepo.update.mockResolvedValue(film);

      await filmController.addComment(req, res, next);

      expect(film.comments).toContainEqual({
        comment: 'Great film!',
        owner: user,
      });
      expect(filmRepo.update).toHaveBeenCalledWith(1, film);
      expect(res.send).toHaveBeenCalledWith(film);
    });
  });
});
