const express = require('express');
const cors = require('cors');
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health-check', (req, res) => {
  res.send('Server is alive and running on MySQL!');
});

app.get('/', (req, res) => {
  res.send('NexusPour API is running!');
});

// Fridge Routes
app.get('/api/fridges', async (req, res) => {
    try {
        const [fridges] = await db.query('SELECT * FROM fridges');
        res.json(fridges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/fridges', async (req, res) => {
    try {
        const { id, location, expectedMin, expectedMax } = req.body;
        await db.execute('INSERT INTO fridges (id, location, expectedMin, expectedMax) VALUES (?, ?, ?, ?)', [id, location, expectedMin, expectedMax]);
        res.status(201).json({ id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/fridges/:id', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM fridges WHERE id = ?', [req.params.id]);
        if (result.affectedRows) {
            res.status(200).json({ message: 'Fridge deleted' });
        } else {
            res.status(404).json({ message: 'Fridge not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// TempLog Routes
app.get('/api/logs', async (req, res) => {
    try {
        const [logs] = await db.query('SELECT * FROM temp_logs');
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const { date, fridge_id, reading, pass } = req.body;
        const [result] = await db.execute('INSERT INTO temp_logs (date, fridge_id, reading, pass) VALUES (?, ?, ?, ?)', [date, fridge_id, reading, pass ? 1 : 0]);
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/logs', async (req, res) => {
    try {
        const { date, fridge_id, reading, pass } = req.body;
        const [existing] = await db.query('SELECT * FROM temp_logs WHERE date = ? AND fridge_id = ?', [date, fridge_id]);

        if (existing.length > 0) {
            await db.execute('UPDATE temp_logs SET reading = ?, pass = ? WHERE id = ?', [reading, pass ? 1 : 0, existing[0].id]);
        } else {
            await db.execute('INSERT INTO temp_logs (date, fridge_id, reading, pass) VALUES (?, ?, ?, ?)', [date, fridge_id, reading, pass ? 1 : 0]);
        }
        res.status(200).json({ message: 'Log updated or created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/logs/day/:date', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM temp_logs WHERE date = ?', [req.params.date]);
        res.status(200).json({ message: `Deleted ${result.affectedRows} logs for ${req.params.date}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Checklist Routes
app.get('/api/checklists', async (req, res) => {
    try {
        const [checklists] = await db.query('SELECT * FROM checklists');
        const formatted = checklists.map(task => ({
            ...task,
            completions: JSON.parse(task.completions || '{}')
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/checklists', async (req, res) => {
    try {
        const { id, frequency, section, text, type } = req.body;
        await db.execute('INSERT INTO checklists (id, frequency, section, text, type, completions) VALUES (?, ?, ?, ?, ?, ?)',
            [id, frequency, section, text, type || 'general', '{}']);
        res.status(201).json({ id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/checklists/purge', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM checklists');
        res.status(200).json({ message: `Purged ${result.affectedRows} checklist tasks` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/checklists/:id', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM checklists WHERE id = ?', [req.params.id]);
        if (result.affectedRows) {
            res.status(200).json({ message: 'Checklist deleted' });
        } else {
            res.status(404).json({ message: 'Checklist not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/checklists/:id/completion', async (req, res) => {
    try {
        const { dateKey, status } = req.body;
        const [tasks] = await db.query('SELECT * FROM checklists WHERE id = ?', [req.params.id]);

        if (tasks.length > 0) {
            const task = tasks[0];
            const completions = JSON.parse(task.completions || '{}');
            completions[dateKey] = status;
            await db.execute('UPDATE checklists SET completions = ? WHERE id = ?', [JSON.stringify(completions), req.params.id]);
            res.status(200).json({ message: 'Completion updated' });
        } else {
            res.status(404).json({ message: 'Checklist not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Inventory Routes
app.get('/api/inventory', async (req, res) => {
    try {
        const [inventory] = await db.query('SELECT * FROM inventory ORDER BY location, name');
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve inventory.', error: error.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        const { name, qty, unit, location, category, par } = req.body;
        const id = uuidv4();
        const lastUpdated = new Date().toISOString();
        
        await db.execute(
            'INSERT INTO inventory (id, name, qty, unit, location, category, par, lastUpdated, restockCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [id, name, qty, unit, location, category, par, lastUpdated]
        );

        const [items] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
        res.status(201).json(items[0]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add inventory item.', error: error.message });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { name, qty, unit, location, category, par } = req.body;
        const lastUpdated = new Date().toISOString();
        
        const [result] = await db.execute(`
            UPDATE inventory
            SET name = COALESCE(?, name),
                qty = COALESCE(?, qty),
                unit = COALESCE(?, unit),
                location = COALESCE(?, location),
                category = COALESCE(?, category),
                par = COALESCE(?, par),
                lastUpdated = ?
            WHERE id = ?
        `, [name, qty, unit, location, category, par, lastUpdated, req.params.id]);
        
        if (result.affectedRows) {
            const [items] = await db.query('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
            res.status(200).json(items[0]);
        } else {
            res.status(404).json({ message: 'Inventory item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to update inventory item.', error: error.message });
    }
});

app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM inventory WHERE id = ?', [req.params.id]);
        if (result.affectedRows) {
            res.status(200).json({ message: 'Inventory item deleted' });
        } else {
            res.status(404).json({ message: 'Inventory item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete inventory item.', error: error.message });
    }
});

app.post('/api/inventory/bulk', async (req, res) => {
    try {
        const items = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Invalid request body, expected an array of items.' });
        }

        const newItemsResult = [];
        for (const anItem of items) {
            const id = uuidv4();
            const lastUpdated = new Date().toISOString();
            await db.execute(
                'INSERT INTO inventory (id, name, qty, unit, location, category, par, lastUpdated, restockCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
                [id, anItem.name, anItem.qty || 0, anItem.unit || 'Units', anItem.location || 'Unassigned', anItem.category || 'General', anItem.par || 0, lastUpdated]
            );
            newItemsResult.push({ id, ...anItem, lastUpdated });
        }
        res.status(201).json(newItemsResult);
    } catch (error) {
        res.status(500).json({ message: 'Failed to bulk add inventory items.', error: error.message });
    }
});

// Restock List Routes
app.post('/api/restock-lists', async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items selected for restock list.' });
        }

        const listId = uuidv4();
        const createdAt = new Date().toISOString();
        
        await db.execute('INSERT INTO restock_lists (id, createdAt) VALUES (?, ?)', [listId, createdAt]);

        for (const item of items) {
            const [invItems] = await db.query('SELECT name FROM inventory WHERE id = ?', [item.id]);
            if (invItems.length > 0) {
                await db.execute('INSERT INTO restock_list_items (restock_list_id, inventory_item_id, item_name, urgency, notes) VALUES (?, ?, ?, ?, ?)',
                    [listId, item.id, invItems[0].name, item.urgency, item.notes]);
                await db.execute('UPDATE inventory SET lastOrderedAt = ?, restockCount = restockCount + 1 WHERE id = ?', [createdAt, item.id]);
            }
        }

        res.status(201).json({ id: listId, createdAt, itemCount: items.length });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create restock list.', error: error.message });
    }
});

app.get('/api/restock-lists', async (req, res) => {
    try {
        const [lists] = await db.query(`
            SELECT 
                rl.id, 
                rl.createdAt,
                (SELECT COUNT(*) FROM restock_list_items WHERE restock_list_id = rl.id) as itemCount
            FROM restock_lists rl
            ORDER BY rl.createdAt DESC
        `);
        res.json(lists);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve restock lists.', error: error.message });
    }
});

app.get('/api/restock-lists/:id', async (req, res) => {
    try {
        const [items] = await db.query('SELECT item_name, urgency, notes FROM restock_list_items WHERE restock_list_id = ?', [req.params.id]);
        const [lists] = await db.query('SELECT * FROM restock_lists WHERE id = ?', [req.params.id]);

        if (lists.length > 0) {
            res.json({ ...lists[0], items });
        } else {
            res.status(404).json({ message: 'Restock list not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve restock list details.', error: error.message });
    }
});

app.delete('/api/restock-lists/:id', async (req, res) => {
    try {
        const listId = req.params.id;
        await db.execute('DELETE FROM restock_list_items WHERE restock_list_id = ?', [listId]);
        await db.execute('DELETE FROM restock_lists WHERE id = ?', [listId]);
        res.status(200).json({ message: 'Restock list deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete restock list.', error: error.message });
    }
});

// Allergen Routes
app.get('/api/allergens', async (req, res) => {
    try {
        const [allergens] = await db.query('SELECT * FROM allergens');
        res.json(allergens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/allergens', async (req, res) => {
    try {
        const { dish, allergens } = req.body;
        const [result] = await db.execute('INSERT INTO allergens (dish, allergens) VALUES (?, ?)', [dish, allergens]);
        res.status(201).json({ id: result.insertId, dish, allergens });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/allergens/:id', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM allergens WHERE id = ?', [req.params.id]);
        if (result.affectedRows) {
            res.status(200).json({ message: 'Allergen deleted' });
        } else {
            res.status(404).json({ message: 'Allergen not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
