
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';

dotenv.config({ quiet: true });

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send({message: "API is running..."});
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

export default app;
