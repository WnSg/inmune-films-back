import { AuthInterceptor } from '../auth.interceptor';
import { AuthServices } from '../../services/auth';
import { HttpError } from '../../types/http.error';

// Mockeamos AuthServices y filmRepo
jest.mock('../../services/auth');
const mockFilmRepo = {
  queryById: jest.fn(),
};

describe('AuthInterceptor Middleware', () => {
  let req, res, next, authInterceptor;

  // Configuramos variables comunes para todas las pruebas
  beforeEach(() => {    
    req = {
      get: jest.fn(), 
      body: {}, 
      params: {} 
    };
    res = {}; 
    next = jest.fn(); // Simula el middleware `next()`
    
    // Creamos una instancia del interceptor
    authInterceptor = new AuthInterceptor(mockFilmRepo);

    // Limpiamos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  // Pruebas para el método `logged`
  describe('logged', () => {
    it('should throw an error if Authorization header is missing', () => {     
      req.get.mockReturnValue(null);     
      authInterceptor.logged(req, res, next);      
      expect(next).toHaveBeenCalledWith(new HttpError(401, 'Not Authorized', 'Not Authorization header'));
    });

    it('should throw an error if Authorization header does not start with Bearer', () => {
      // Simulamos una cabecera Authorization que no tiene el prefijo "Bearer"
      req.get.mockReturnValue('Basic token');     
      authInterceptor.logged(req, res, next);     
      expect(next).toHaveBeenCalledWith(new HttpError(401, 'Not Authorized', 'Not Bearer in Authorization header'));
    });

    it('should throw an error if JWT is invalid', () => {
      // Simulamos una cabecera Authorization con un token inválido
      req.get.mockReturnValue('Bearer invalidtoken');      
      AuthServices.verifyJWTGettingPayload.mockImplementation(() => {
        throw new HttpError(498, 'Invalid Token', 'Invalid token');
      });

      // Llamamos al método `logged`
      authInterceptor.logged(req, res, next);      
      expect(next).toHaveBeenCalledWith(new HttpError(498, 'Invalid Token', 'Invalid token'));
    });

    it('should pass and store token payload in req.body.tokenPayload if JWT is valid', () => {
      // Simulamos una cabecera Authorization con un token válido
      const mockPayload = { id: 1, username: 'testuser' }; 
      req.get.mockReturnValue('Bearer validtoken');      
      AuthServices.verifyJWTGettingPayload.mockReturnValue(mockPayload);      
      authInterceptor.logged(req, res, next);      
      expect(req.body.tokenPayload).toEqual(mockPayload);      
      expect(next).toHaveBeenCalled();
    });
  });

  // Pruebas para el método `authorizedForFilms`
  describe('authorizedForFilms', () => {
    it('should throw an error if tokenPayload is missing in req.body', () => {      
      authInterceptor.authorizedForFilms(req, res, next);      
      expect(next).toHaveBeenCalledWith(new HttpError(498, 'Token not found', 'Token not found in Authorized interceptor'));
    });

    it('should throw an error if user is not the owner of the film', async () => {
      // Simulamos que el token contiene un `userID` (el usuario autenticado)
      req.body.tokenPayload = { id: 1 }; // El usuario tiene ID 1      
      req.params.id = 2; // ID de la película 2
      // Simulamos que `queryById` devuelve una película con un dueño diferente
      const mockFilm = { owner: { id: 2 } }; // El dueño de la película es el usuario 2
      mockFilmRepo.queryById.mockResolvedValue(mockFilm);

      // Llamamos al método `authorizedForFilms`
      await authInterceptor.authorizedForFilms(req, res, next);
      // Verificamos que se haya llamado a `next()` con un error de no autorizado
      expect(next).toHaveBeenCalledWith(new HttpError(401, 'Not authorized', 'Not authorized'));
    });

    it('should pass if user is the owner of the film', async () => {     
      req.body.tokenPayload = { id: 1 }; // El usuario tiene ID 1
      // Simulamos el ID de la película en los parámetros de la URL
      req.params.id = 2; // ID de la película 2
      // Simulamos que `queryById` devuelve una película cuyo dueño es el usuario autenticado
      const mockFilm = { owner: { id: 1 } }; // El dueño de la película es el usuario 1 (autenticado)
      mockFilmRepo.queryById.mockResolvedValue(mockFilm);

      // Llamamos al método `authorizedForFilms`
      await authInterceptor.authorizedForFilms(req, res, next);

      // Verificamos que `next()` fue llamado sin errores
      expect(next).toHaveBeenCalled();
    });
  });
});
