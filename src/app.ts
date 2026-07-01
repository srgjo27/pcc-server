import express, { type Application } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';

const app: Application = express();

app.use(cors());

app.use(express.json());

app.use('/api/auth', authRoutes);

export default app;