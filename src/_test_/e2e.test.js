import { app } from '../app';
import { dbConnect, dbDisconnect } from '../db/db.connect';
import { UserModel } from '../models/user.model';
import { AuthServices } from '../services/auth'; 
import request from 'supertest';

let token; // Para almacenar el token de autenticación
jest.setTimeout(15000); // 15 segundos

beforeAll(async () => {
    // Conectamos la base de datos mockeada
    await dbConnect();

    // Creamos un usuario admin en la base de datos si no existe
    const existingAdmin = await UserModel.findOne({ userName: 'admin' });
    if (!existingAdmin) {
        console.log('Creando usuario admin...');
        await UserModel.create({
            userName: 'admin',
            password: await AuthServices.hash('adminPassword'), // Encripta la contraseña usando AuthServices
            email: 'admin@example.com',
        });
    } else {
        console.log('Usuario admin ya existe:', existingAdmin);
    }

    // Realiza la autenticación para obtener un token válido
    const response = await request(app)
        .post('/user/login') 
        .send({ user: 'admin', password: 'adminPassword' });

    console.log('Respuesta de login:', response.body); // Verificar si hay algún error
    token = response.body.token; // Guarda el token para futuras solicitudes
    console.log('Token generado:', token); // Verificar el token generado

    // Verifica que el token fue generado correctamente
    if (!token) {
        throw new Error('No se pudo obtener un token válido');
    }

});

afterAll(async () => {
    await dbDisconnect(); // Desconectamos la base de datos
});

describe('API REST Endpoints', () => {
    it('should create a new film', async () => {
        const response = await request(app)
            .post('/film') 
            .set('Authorization', `Bearer ${token}`) 
            .send({
                title: 'Inception',
                director: 'Christopher Nolan',
                year: 2010,
                genre: 'Sci-Fi',
            });

        console.log('Respuesta de creación de película:', response.body);

        expect(response.status).toBe(201); 
        expect(response.body.title).toBe('Inception'); 
    });

    it('should return a list of films', async () => {
        const response = await request(app)
            .get('/film') // Obtener la lista de películas
            .set('Authorization', `Bearer ${token}`); // Usar el token para autenticación

        console.log('Lista de películas:', response.body);

        expect(response.status).toBe(200); 
        expect(Array.isArray(response.body.items)).toBe(true); // Verifica que sea una lista de películas
    });

    it('should return a single film by ID', async () => {
        const newFilm = await request(app)
            .post('/film')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'The Matrix',
                director: 'Wachowskis',
                year: 1999,
                genre: 'Sci-Fi',
            });

        console.log('Película creada:', newFilm.body);

        const filmId = newFilm.body._id || newFilm.body.id; 
        const response = await request(app)
            .get(`/film/${filmId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.title).toBe('The Matrix');
    });

    it('should delete a film by ID', async () => {
        const newFilm = await request(app)
            .post('/film')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Interstellar',
                director: 'Christopher Nolan',
                year: 2014,
                genre: 'Sci-Fi',
            });

        console.log('Película a eliminar:', newFilm.body);

        const filmId = newFilm.body._id || newFilm.body.id;
        const deleteResponse = await request(app)
            .delete(`/film/${filmId}`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Respuesta de eliminación:', deleteResponse.body);

        expect(deleteResponse.status).toBe(204);
    });
});
