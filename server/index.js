import db from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

db();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});