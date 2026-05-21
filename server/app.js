
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send({message: "API is running..."});
});

// Auth routes
app.use('/api/auth', authRoutes);

export default app;
