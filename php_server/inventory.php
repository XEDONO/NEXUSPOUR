<?php
// php_server/inventory.php

require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];

$action = $_GET['action'] ?? '';
if ($method === 'POST' && $action === 'bulk') {
    handleBulkInventoryPost($conn);
    exit;
}

switch ($method) {
    case 'GET':
        handleGetInventory($conn);
        break;
    case 'POST':
        handlePostInventory($conn);
        break;
    case 'PUT':
        handlePutInventory($conn);
        break;
    case 'DELETE':
        handleDeleteInventory($conn);
        break;
    default:
        send_json(405, ['error' => 'Method not allowed']);
        break;
}

function handleGetInventory($conn) {
    try {
        $result = $conn->query('SELECT * FROM inventory ORDER BY location, name');
        $inventory = $result->fetch_all(MYSQLI_ASSOC);
        send_json(200, $inventory);
    } catch (Exception $e) {
        send_json(500, ['message' => 'Failed to retrieve inventory.', 'error' => $e->getMessage()]);
    }
}

function handlePostInventory($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = uniqid(); // Generate a unique ID
    $name = $data['name'];
    $qty = $data['qty'];
    $unit = $data['unit'];
    $location = $data['location'];
    $category = $data['category'];
    $par = $data['par'];
    $lastUpdated = date('Y-m-d H:i:s');

    try {
        $stmt = $conn->prepare('INSERT INTO inventory (id, name, qty, unit, location, category, par, lastUpdated, restockCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)');
        $stmt->bind_param('ssisssis', $id, $name, $qty, $unit, $location, $category, $par, $lastUpdated);
        $stmt->execute();
        
        $select_stmt = $conn->prepare('SELECT * FROM inventory WHERE id = ?');
        $select_stmt->bind_param('s', $id);
        $select_stmt->execute();
        $result = $select_stmt->get_result();
        $newItem = $result->fetch_assoc();

        send_json(201, $newItem);
    } catch (Exception $e) {
        send_json(500, ['message' => 'Failed to add inventory item.', 'error' => $e->getMessage()]);
    }
}

function handlePutInventory($conn) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        send_json(400, ['message' => 'Inventory ID is required']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $lastUpdated = date('Y-m-d H:i:s');

    // Build the query dynamically based on what's provided
    $fields = [];
    $params = [];
    $types = '';

    if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = $data['name']; $types .= 's'; }
    if (isset($data['qty'])) { $fields[] = 'qty = ?'; $params[] = $data['qty']; $types .= 'i'; }
    if (isset($data['unit'])) { $fields[] = 'unit = ?'; $params[] = $data['unit']; $types .= 's'; }
    if (isset($data['location'])) { $fields[] = 'location = ?'; $params[] = $data['location']; $types .= 's'; }
    if (isset($data['category'])) { $fields[] = 'category = ?'; $params[] = $data['category']; $types .= 's'; }
    if (isset($data['par'])) { $fields[] = 'par = ?'; $params[] = $data['par']; $types .= 'i'; }

    if (empty($fields)) {
        send_json(400, ['message' => 'No fields to update']);
        return;
    }
    
    $fields[] = 'lastUpdated = ?';
    $params[] = $lastUpdated;
    $types .= 's';

    $params[] = $id;
    $types .= 's';

    $sql = 'UPDATE inventory SET ' . implode(', ', $fields) . ' WHERE id = ?';

    try {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $select_stmt = $conn->prepare('SELECT * FROM inventory WHERE id = ?');
            $select_stmt->bind_param('s', $id);
            $select_stmt->execute();
            $result = $select_stmt->get_result();
            $updatedItem = $result->fetch_assoc();
            send_json(200, $updatedItem);
        } else {
            send_json(404, ['message' => 'Inventory item not found or no new data to update']);
        }
    } catch (Exception $e) {
        send_json(500, ['message' => 'Failed to update inventory item.', 'error' => $e->getMessage()]);
    }
}

function handleDeleteInventory($conn) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        send_json(400, ['message' => 'Inventory ID is required']);
        return;
    }

    try {
        $stmt = $conn->prepare('DELETE FROM inventory WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            send_json(200, ['message' => 'Inventory item deleted']);
        } else {
            send_json(404, ['message' => 'Inventory item not found']);
        }
    } catch (Exception $e) {
        send_json(500, ['message' => 'Failed to delete inventory item.', 'error' => $e->getMessage()]);
    }
}

function handleBulkInventoryPost($conn) {
    $items = json_decode(file_get_contents('php://input'), true);
    if (!is_array($items)) {
        send_json(400, ['message' => 'Invalid request body, expected an array of items.']);
        return;
    }

    $newItemsResult = [];
    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare('INSERT INTO inventory (id, name, qty, unit, location, category, par, lastUpdated, restockCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)');
        
        foreach ($items as $item) {
            $id = uniqid();
            $lastUpdated = date('Y-m-d H:i:s');
            $name = $item['name'];
            $qty = $item['qty'] ?? 0;
            $unit = $item['unit'] ?? 'Units';
            $location = $item['location'] ?? 'Unassigned';
            $category = $item['category'] ?? 'General';
            $par = $item['par'] ?? 0;

            $stmt->bind_param('ssisssis', $id, $name, $qty, $unit, $location, $category, $par, $lastUpdated);
            $stmt->execute();

            $newItemsResult[] = ['id' => $id] + $item;
        }

        $conn->commit();
        send_json(201, $newItemsResult);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ['message' => 'Failed to bulk add inventory items.', 'error' => $e->getMessage()]);
    }
}


$conn->close();
?>
