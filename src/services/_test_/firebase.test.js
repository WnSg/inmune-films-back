import { FireBase } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFile } from 'fs/promises';

// Simulamos las funciones de Firebase y el sistema de archivos
jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(() => ({})), // Mockeamos que getStorage devuelva un objeto vacío
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
  }));
jest.mock('fs/promises');

describe('FireBase Service', () => {
  let firebaseService;

  beforeEach(() => {
    firebaseService = new FireBase();
    jest.clearAllMocks(); // Limpiamos los mocks antes de cada prueba
  });

  it('should initialize Firebase app and storage', () => {
    expect(firebaseService.app).toBeDefined();
    expect(firebaseService.storage).toBeDefined();
  });

  it('should upload a file and return the download URL', async () => {
    // Simula el comportamiento de readFile
    const fileName = 'testfile.jpg';
    const fileBuffer = Buffer.from('file content');
    readFile.mockResolvedValue(fileBuffer); // Simulamos la lectura del archivo

    // Simula las funciones de Firebase Storage
    const mockRef = { fullPath: `public/uploads/${fileName}` };
    const mockURL = 'https://fake-download-url.com';
    ref.mockReturnValue(mockRef);
    uploadBytes.mockResolvedValue(true);  // Simulamos el resultado exitoso de la subida
    getDownloadURL.mockResolvedValue(mockURL);  // Simulamos la URL devuelta por Firebase

    // Ejecutamos el método uploadFile
    const result = await firebaseService.uploadFile(fileName);

    // Aserciones
    expect(ref).toHaveBeenCalledWith(firebaseService.storage, `public/uploads/${fileName}`);
    expect(uploadBytes).toHaveBeenCalledWith(mockRef, fileBuffer);
    expect(result).toBe(mockURL);
  });

  it('should throw an error if file reading fails', async () => {
    // Simulamos un error al leer el archivo
    readFile.mockRejectedValue(new Error('File not found'));

    const fileName = 'nonexistentfile.jpg';

    await expect(firebaseService.uploadFile(fileName)).rejects.toThrow('File not found');

    // Aserciones adicionales para garantizar que no se llamaron funciones de Firebase
    expect(ref).not.toHaveBeenCalled();
    expect(uploadBytes).not.toHaveBeenCalled();
  });
});
