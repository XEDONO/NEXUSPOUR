const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Fridge Routes
app.get('/api/fridges', (req, res) => {
    const getFridges = db.prepare('SELECT * FROM fridges');
    const fridges = getFridges.all();
    res.json(fridges);
});

app.post('/api/fridges', (req, res) => {
    const { id, location, expectedMin, expectedMax } = req.body;
    const addFridge = db.prepare('INSERT INTO fridges (id, location, expectedMin, expectedMax) VALUES (?, ?, ?, ?)');
    const result = addFridge.run(id, location, expectedMin, expectedMax);
    res.status(201).json({ id: result.lastInsertRowid });
});

app.delete('/api/fridges/:id', (req, res) => {
    const deleteFridge = db.prepare('DELETE FROM fridges WHERE id = ?');
    const result = deleteFridge.run(req.params.id);
    if (result.changes) {
        res.status(200).json({ message: 'Fridge deleted' });
    } else {
        res.status(404).json({ message: 'Fridge not found' });
    }
});

// TempLog Routes
app.get('/api/logs', (req, res) => {
    const getLogs = db.prepare('SELECT * FROM temp_logs');
    const logs = getLogs.all();
    res.json(logs);
});

app.post('/api/logs', (req, res) => {
    const { date, fridge_id, reading, pass } = req.body;
    const addLog = db.prepare('INSERT INTO temp_logs (date, fridge_id, reading, pass) VALUES (?, ?, ?, ?)');
    const result = addLog.run(date, fridge_id, reading, pass ? 1 : 0);
    res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/logs', (req, res) => {
    const { date, fridge_id, reading, pass } = req.body;
    
    const findLog = db.prepare('SELECT * FROM temp_logs WHERE date = ? AND fridge_id = ?');
    const existingLog = findLog.get(date, fridge_id);

    if (existingLog) {
        const updateLog = db.prepare('UPDATE temp_logs SET reading = ?, pass = ? WHERE id = ?');
        updateLog.run(reading, pass ? 1 : 0, existingLog.id);
    } else {
        const addLog = db.prepare('INSERT INTO temp_logs (date, fridge_id, reading, pass) VALUES (?, ?, ?, ?)');
        addLog.run(date, fridge_id, reading, pass ? 1 : 0);
    }
    res.status(200).json({ message: 'Log updated or created' });
});

app.delete('/api/logs/day/:date', (req, res) => {
    const deleteDayLogs = db.prepare('DELETE FROM temp_logs WHERE date = ?');
    const result = deleteDayLogs.run(req.params.date);
    res.status(200).json({ message: `Deleted ${result.changes} logs for ${req.params.date}` });
});

// Checklist Routes
app.get('/api/checklists', (req, res) => {
    const getChecklists = db.prepare('SELECT * FROM checklists');
    const checklists = getChecklists.all().map(task => ({
        ...task,
        completions: JSON.parse(task.completions || '{}')
    }));
    res.json(checklists);
});

app.post('/api/checklists', (req, res) => {
    const { id, frequency, section, text, type } = req.body;
    const addChecklist = db.prepare('INSERT INTO checklists (id, frequency, section, text, type, completions) VALUES (?, ?, ?, ?, ?, ?)');
    const result = addChecklist.run(id, frequency, section, text, type || 'general', '{}');
    res.status(201).json({ id: result.lastInsertRowid });
});

app.delete('/api/checklists/purge', (req, res) => {
    const purgeChecklists = db.prepare('DELETE FROM checklists');
    const result = purgeChecklists.run();
    res.status(200).json({ message: `Purged ${result.changes} checklist tasks` });
});

app.delete('/api/checklists/clean-invalid', (req, res) => {
    try {
        const cleanChecklists = db.prepare('DELETE FROM checklists WHERE id IS NULL OR text IS NULL OR text = \'\'');
        const result = cleanChecklists.run();
        res.status(200).json({ message: `Removed ${result.changes} invalid checklist entries.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clean checklists.', error: error.message });
    }
});

app.delete('/api/checklists/:id', (req, res) => {
    const deleteChecklist = db.prepare('DELETE FROM checklists WHERE id = ?');
    const result = deleteChecklist.run(req.params.id);
    if (result.changes) {
        res.status(200).json({ message: 'Checklist deleted' });
    } else {
        res.status(404).json({ message: 'Checklist not found' });
    }
});

app.put('/api/checklists/:id/completion', (req, res) => {
    const { dateKey, status } = req.body;
    const getChecklist = db.prepare('SELECT * FROM checklists WHERE id = ?');
    const task = getChecklist.get(req.params.id);

    if (task) {
        const completions = JSON.parse(task.completions || '{}');
        completions[dateKey] = status;
        const updateChecklist = db.prepare('UPDATE checklists SET completions = ? WHERE id = ?');
        updateChecklist.run(JSON.stringify(completions), req.params.id);
        res.status(200).json({ message: 'Completion updated' });
    } else {
        res.status(404).json({ message: 'Checklist not found' });
    }
});

// Checklist Log Routes
app.get('/api/checklist-logs', (req, res) => {
    const getLogs = db.prepare('SELECT * FROM checklist_logs');
    const logs = getLogs.all();
    res.json(logs);
});

app.post('/api/checklist-logs', (req, res) => {
    const { date_range, type, total, completed, saved_at } = req.body;
    const addLog = db.prepare('INSERT INTO checklist_logs (date_range, type, total, completed, saved_at) VALUES (?, ?, ?, ?, ?)');
    const result = addLog.run(date_range, type, total, completed, saved_at);
    res.status(201).json({ id: result.lastInsertRowid });
});

// Inventory Routes
app.get('/api/inventory', (req, res) => {
    const getInventory = db.prepare('SELECT * FROM inventory');
    const inventory = getInventory.all();
    res.json(inventory);
});

app.post('/api/inventory', (req, res) => {
    const { item, stock } = req.body;
    const addInventory = db.prepare('INSERT INTO inventory (item, stock) VALUES (?, ?)');
    const result = addInventory.run(item, stock);
    res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/inventory/:id', (req, res) => {
    const { stock } = req.body;
    const updateInventory = db.prepare('UPDATE inventory SET stock = ? WHERE id = ?');
    const result = updateInventory.run(stock, req.params.id);
    if (result.changes) {
        res.status(200).json({ message: 'Inventory updated' });
    } else {
        res.status(404).json({ message: 'Inventory not found' });
    }
});

app.delete('/api/inventory/:id', (req, res) => {
    const deleteInventory = db.prepare('DELETE FROM inventory WHERE id = ?');
    const result = deleteInventory.run(req.params.id);
    if (result.changes) {
        res.status(200).json({ message: 'Inventory deleted' });
    } else {
        res.status(404).json({ message: 'Inventory not found' });
    }
});

// Inventory Log Routes
app.get('/api/inventory-logs', (req, res) => {
    const getLogs = db.prepare('SELECT * FROM inventory_logs');
    const logs = getLogs.all();
    res.json(logs);
});

app.post('/api/inventory-logs', (req, res) => {
    const { date, log_data } = req.body;
    const addLog = db.prepare('INSERT INTO inventory_logs (date, log_data) VALUES (?, ?)');
    const result = addLog.run(date, log_data);
    res.status(201).json({ id: result.lastInsertRowid });
});

// Allergen Routes
app.get('/api/allergens', (req, res) => {
    const getAllergens = db.prepare('SELECT * FROM allergens');
    const allergens = getAllergens.all();
    res.json(allergens);
});

app.post('/api/allergens', (req, res) => {
    const { dish, allergens } = req.body;
    const addAllergen = db.prepare('INSERT INTO allergens (dish, allergens) VALUES (?, ?)');
    const result = addAllergen.run(dish, allergens);
    res.status(201).json({ id: result.lastInsertRowid });
});

app.delete('/api/allergens/:id', (req, res) => {
    const deleteAllergen = db.prepare('DELETE FROM allergens WHERE id = ?');
    const result = deleteAllergen.run(req.params.id);
    if (result.changes) {
        res.status(200).json({ message: 'Allergen deleted' });
    } else {
        res.status(404).json({ message: 'Allergen not found' });
    }
});

// Section Routes
app.get('/api/sections', (req, res) => {
    const getSections = db.prepare('SELECT * FROM sections');
    const sections = getSections.all();
    res.json(sections.map(s => s.name));
});

app.post('/api/sections', (req, res) => {
    const { sections } = req.body;
    const deleteSections = db.prepare('DELETE FROM sections');
    deleteSections.run();
    const addSection = db.prepare('INSERT INTO sections (name) VALUES (?)');
    const insert = db.transaction((secs) => {
        for (const sec of secs) addSection.run(sec);
    });
    insert(sections);
    res.status(201).json({ message: 'Sections updated' });
});

// Archive Routes
app.get('/api/archives', (req, res) => {
    const getArchives = db.prepare('SELECT * FROM archives');
    const archives = getArchives.all();
    res.json(archives);
});

app.post('/api/archives', (req, res) => {
    const { name, data, date } = req.body;
    const addArchive = db.prepare('INSERT INTO archives (name, data, date) VALUES (?, ?, ?)');
    const result = addArchive.run(name, JSON.stringify(data), date);
    res.status(201).json({ id: result.lastInsertRowid });
});

app.delete('/api/archives/:id', (req, res) => {
    const deleteArchive = db.prepare('DELETE FROM archives WHERE id = ?');
    const result = deleteArchive.run(req.params.id);
    if (result.changes) {
        res.status(200).json({ message: 'Archive deleted' });
    } else {
        res.status(404).json({ message: 'Archive not found' });
    }
});

// Data-related routes
app.get('/api/export', (req, res) => {
    const tables = [
        'temp_logs', 'checklists', 'checklist_logs', 'inventory', 'inventory_logs',
        'sections', 'fridges', 'allergens'
    ];
    const data = {};
    for (const table of tables) {
        data[table] = db.prepare(`SELECT * FROM ${table}`).all();
    }
    res.json(data);
});

app.post('/api/import', (req, res) => {
    const data = req.body;
    const tables = Object.keys(data);
    db.transaction(() => {
        for (const table of tables) {
            db.prepare(`DELETE FROM ${table}`).run();
            const records = data[table];
            if (!records.length) continue;
            const columns = Object.keys(records[0]);
            const placeholders = columns.map(() => '?').join(', ');
            const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
            for (const record of records) {
                stmt.run(...Object.values(record));
            }
        }
    })();
    res.status(200).json({ message: 'Data imported successfully' });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
