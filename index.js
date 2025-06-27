import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';

// --- Konfigurasi dan Inisialisasi ---
const app = express();
const PORT = 3001;
const JWT_SECRET = 'RAHASIA_NEGARA_JANGAN_DISEBAR';

app.use(cors());
app.use(bodyParser.json());


// --- (SIMULASI) Database ---
let users = [
    { id: 1, email: 'admin@bioskop.com', password: 'password123', role: 'admin' },
    { id: 2, email: 'ayu@gmail.com', password: 'password456', role: 'customer' }
];

let movies = [
    { id: 1, title: 'Petualangan Sherina 2', duration: 120, synopsis: 'Sherina dan Sadam, teman masa kecil yang lama terpisah, kembali bertemu di Kalimantan untuk pelepasliaran orangutan. Namun, reuni mereka terganggu ketika anak orangutan bernama Sayu diculik. Mereka harus bekerja sama untuk menyelamatkannya.', poster_url: 'https://placehold.co/400x600/222/fff?text=Sherina+2' },
    { id: 2, title: 'Agak Laen', duration: 110, synopsis: 'Empat sekawan yang mengelola rumah hantu di pasar malam menghadapi kebangkrutan. Untuk menyelamatkan bisnis mereka, mereka merenovasi rumah hantu menjadi lebih seram, namun sebuah insiden tak terduga justru membuat rumah hantu mereka menjadi benar-benar angker.', poster_url: 'https://placehold.co/400x600/222/fff?text=Agak+Laen' }
];

let schedules = [
    { id: 1, movie_id: 1, show_time: '2025-06-28T19:00:00Z', price: 50000 },
    { id: 2, movie_id: 2, show_time: '2025-06-28T21:00:00Z', price: 50000 },
    { id: 3, movie_id: 2, show_time: '2025-06-28T20:00:00Z', price: 55000 }
];


// --- Middleware untuk Otentikasi & Otorisasi ---
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token tidak valid.' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya untuk admin.' });
        }
        req.user = user; 
        next(); 
    });
};


// --- Rute API (Endpoints) ---

// == RUTE FILM ==
app.get('/api/movies', (req, res) => {
    res.json(movies);
});

app.get('/api/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const movie = movies.find(m => m.id === id);
    if (movie) {
        const movieSchedules = schedules.filter(s => s.movie_id === id);
        res.json({ ...movie, schedules: movieSchedules });
    } else {
        res.status(404).json({ message: 'Film tidak ditemukan' });
    }
});

// [ADMIN] Rute untuk menambah film baru
app.post('/api/movies', verifyAdmin, (req, res) => {
    const { title, duration, synopsis, poster_url } = req.body;
    if (!title || !duration) {
        return res.status(400).json({ message: 'Judul dan durasi harus diisi.' });
    }
    const newMovie = {
        id: movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1,
        title,
        duration: parseInt(duration),
        synopsis: synopsis || '',
        poster_url: poster_url || ''
    };
    movies.push(newMovie);
    res.status(201).json({ message: 'Film baru berhasil ditambahkan', data: newMovie });
});

// [ADMIN] Rute untuk mengedit film
app.put('/api/movies/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const movieIndex = movies.findIndex(m => m.id === id);
    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Film tidak ditemukan.' });
    }
    const { title, duration, synopsis, poster_url } = req.body;
    const updatedMovie = { ...movies[movieIndex], title, duration: parseInt(duration), synopsis, poster_url };
    movies[movieIndex] = updatedMovie;
    res.json({ message: 'Data film berhasil diperbarui', data: updatedMovie });
});


// == RUTE JADWAL ==
app.get('/api/schedules', (req, res) => {
    res.json(schedules);
});

app.post('/api/schedules', verifyAdmin, (req, res) => {
    const { movie_id, show_time, price } = req.body;
    if (!movie_id || !show_time || !price) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }
    const newSchedule = {
        id: schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1,
        movie_id: parseInt(movie_id),
        show_time,
        price: parseInt(price)
    };
    schedules.push(newSchedule);
    res.status(201).json({ message: `Jadwal baru berhasil ditambahkan`, data: newSchedule });
});

// == RUTE AUTH ==
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Email atau password salah.' });
    }
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login berhasil!', accessToken: accessToken, user: { id: user.id, email: user.email, role: user.role } });
});


// --- Menjalankan Server ---
app.listen(PORT, () => {
    console.log(`Server bioskop (dengan CORS) berhasil berjalan di http://localhost:${PORT}`);
});
