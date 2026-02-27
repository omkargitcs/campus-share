const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const resourceRoutes = require('./routes/resourceRoutes'); 
const authRoutes = require('./routes/authRoutes'); 

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors()); 
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);


app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "CampusShare API IS ALIVE" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`SERVER IS RUNNING ON http://localhost:${PORT}`);
});