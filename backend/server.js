require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..')));
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL
      );
    `);
    client.release();
    console.log('Connected to the PostgreSQL database and ensured users table exists.');
  } catch (err) {
    console.error('Database connection error:', err.stack);
  }
})();

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre gerekli.' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT username FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      client.release();
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kayıtlı!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query('INSERT INTO users(username, password) VALUES($1, $2)', [username, hashedPassword]);
    client.release();
    res.status(200).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre gerekli.' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    client.release();

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return res.status(200).json({ message: 'Giriş başarılı!' });
      } else {
        return res.status(400).json({ message: 'Kullanıcı adı veya şifre hatalı!' });
      }
    } else {
      return res.status(400).json({ message: 'Kullanıcı adı veya şifre hatalı!' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.put('/users/:username', async (req, res) => {
  const { username } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Yeni şifre gerekli.' });
  }

  try {
    const client = await pool.connect();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await client.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, username]);
    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json({ message: 'Şifre başarıyla güncellendi!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.delete('/users/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const client = await pool.connect();
    const result = await client.query('DELETE FROM users WHERE username = $1', [username]);
    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json({ message: 'Hesap başarıyla silindi!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.listen(port, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${port}`);
});
