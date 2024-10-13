import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { user, passwd, db, cluster } from '../config.js'; //  configuraciones para otros entornos

let mongoServer;

const isTestEnvironment = process.env.NODE_ENV === 'test';

export const dbConnect = async () => {
    if (isTestEnvironment) {
        // En un entorno de pruebas, usamos MongoMemoryServer
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        return;
    }

    // Conexión estándar en otros entornos (producción, desarrollo)
    const uri = `mongodb+srv://${user}:${passwd}@${cluster}/${db}?retryWrites=true&w=majority`;
    return mongoose.connect(uri);
};

export const dbDisconnect = async () => {
    if (isTestEnvironment) {
        await mongoose.disconnect();
        await mongoServer.stop(); // Detenemos el servidor en memoria
    } else {
        await mongoose.disconnect();
    }
};
