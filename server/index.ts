import path from 'node:path';
import express from 'express';
import { createApp } from './app.ts';
import { config } from './config.ts';
import { openDb } from './db.ts';
import { seedProducts } from './seed.ts';

const db = openDb();
seedProducts(db);
const app = createApp(db);

// In production the built web app is served by the same process.
const dist = path.resolve('dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => (req.path.startsWith('/api') ? next() : res.sendFile(path.join(dist, 'index.html'), (e) => e && next())));

app.listen(config.port, () => console.log(`Online Builder API on http://localhost:${config.port}`));
