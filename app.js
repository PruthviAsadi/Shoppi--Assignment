// Import dependencies
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Initialize Express app and database
const app = express();
const db = new sqlite3.Database('./crawler.db');

// Middleware
app.use(express.json());

// Setup database tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS product_urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_id INTEGER,
        url TEXT,
        FOREIGN KEY (domain_id) REFERENCES domains (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_id INTEGER,
        log_message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES domains (id)
    )`);
});

// Add domains to crawl
app.post('/domains', (req, res) => {
    const domains = req.body.domains;
    if (!Array.isArray(domains)) return res.status(400).send('Invalid input');

    const insertStmt = db.prepare(`INSERT INTO domains (domain) VALUES (?)`);
    domains.forEach(domain => insertStmt.run(domain));
    insertStmt.finalize();

    res.send('Domains added');
});

// Get crawling results
app.get('/results', (req, res) => {
    db.all(`SELECT * FROM product_urls`, [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.json(rows);
    });
});

// Crawl a domain
async function crawl(domain) {
    try {
        const html = await axios.get(`https://${domain}`);
        const $ = cheerio.load(html.data);

        const urls = [];
        $('a').each((i, el) => {
            const url = $(el).attr('href');
            if (url && url.match(/\/(product|item|p)\//)) {
                urls.push(new URL(url, `https://${domain}`).toString());
            }
        });

        return urls;
    } catch (error) {
        console.error(`Failed to crawl ${domain}: ${error.message}`);
        return [];
    }
}

// Crawl a domain with Puppeteer for dynamic content
async function crawlDynamic(domain) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });

    const urls = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(url => url.includes('/product/') || url.includes('/item/'))
    );

    await browser.close();
    return urls;
}

// Crawl all domains
app.get('/crawl', (req, res) => {
    db.all(`SELECT * FROM domains`, async (err, domains) => {
        if (err) return res.status(500).send(err.message);

        const results = [];
        for (const { id, domain } of domains) {
            try {
                const urls = await crawl(domain);
                results.push(...urls);

                const insertStmt = db.prepare(`INSERT INTO product_urls (domain_id, url) VALUES (?, ?)`);
                urls.forEach(url => insertStmt.run(id, url));
                insertStmt.finalize();
            } catch (error) {
                db.run(`INSERT INTO logs (domain_id, log_message) VALUES (?, ?)`, [id, error.message]);
            }
        }

        res.json({ message: 'Crawling completed', results });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
