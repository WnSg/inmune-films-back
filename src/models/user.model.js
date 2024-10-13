import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

// Verifica si el modelo ya existe, si no, créalo.
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
