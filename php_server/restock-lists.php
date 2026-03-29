<?php
// php_server/restock-lists.php

require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            handleGetRestockList($conn);
        } else {
            handleGetRestockLists($conn);
        }
        break;
    case 'POST':
        handlePostRestockList($conn);
        break;
    case 'DELETE':
        handleDeleteRestockList($conn);
        break;
    default:
        send_json(405, ['error' => 'Method not allowed']);
        break;
}

function handleGetRestockLists($conn) {
    try {
        $sql = "
            SELECT 
                rl.id, 
                rl.createdAt,
                (SELECT COUNT(*) FROM restock_list_items WHERE restock_list_id = rl.id) as itemCount
            FROM restock_lists rl
            ORDER BY rl.createdAt DESC
        ";
        $result = $conn->query($sql);
        $lists = $result->fetch_all(MYSQLI_ASSOC);
        send_json(200, $lists);
    } catch (Exception $e) {
        send_json(500, ['message' => 'Failed to retrieve restock lists.', 'error' => $e->getMessage()]);
    }
}

function handleGetRestockList($conn) {
    $id = $_GET['id'];
    try {
        $list_stmt = $conn->prepare('SELECT * FROM restock_lists WHERE id = ?');
        $list_stmt->bind_param('s', $id);
        $list_stmt->execute();
        $list_result = $list_stmt->get_result();
        $list = $list_result->fetch_assoc();

        if ($list) {
            $items_stmt = $conn->prepare('SELECT item_name, urgency, notes FROM restock_list_items WHERE restock_list_id = ?');
            $items_stmt->bind_param('s', $id);
            $items_stmt->execute();
            $items_result = $items_stmt->get_result();
            $items = $items_result->fetch_all(MYSQLI_ASSOC);
            $list['items'] = $items;
            send_json(200, $list);
        } else {
            send_json(404, ['message' => 'Restock list not found.']);
        }
    } catch (Exception $e) {
        send_json(500, ['message' => 'Failed to retrieve restock list details.', 'error' => $e->getMessage()]);
    }
}

function handlePostRestockList($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $items = $data['items'];

    if (!is_array($items) || empty($items)) {
        send_json(400, ['message' => 'No items selected for restock list.']);
        return;
    }

    $listId = uniqid();
    $createdAt = date('Y-m-d H:i:s');

    $conn->begin_transaction();
    try {
        $list_stmt = $conn->prepare('INSERT INTO restock_lists (id, createdAt) VALUES (?, ?)');
        $list_stmt->bind_param('ss', $listId, $createdAt);
        $list_stmt->execute();

        $item_stmt = $conn->prepare('INSERT INTO restock_list_items (restock_list_id, inventory_item_id, item_name, urgency, notes) VALUES (?, ?, ?, ?, ?)');
        $update_inv_stmt = $conn->prepare('UPDATE inventory SET lastOrderedAt = ?, restockCount = restockCount + 1 WHERE id = ?');
        
        foreach ($items as $item) {
            // Fetch item name from inventory
            $inv_name_stmt = $conn->prepare('SELECT name FROM inventory WHERE id = ?');
            $inv_name_stmt->bind_param('s', $item['id']);
            $inv_name_stmt->execute();
            $inv_name_result = $inv_name_stmt->get_result();
            $inv_item = $inv_name_result->fetch_assoc();
            
            if ($inv_item) {
                $item_name = $inv_item['name'];
                $item_id = $item['id'];
                $urgency = $item['urgency'];
                $notes = $item['notes'];
                
                $item_stmt->bind_param('sssss', $listId, $item_id, $item_name, $urgency, $notes);
                $item_stmt->execute();
                
                $update_inv_stmt->bind_param('ss', $createdAt, $item_id);
                $update_inv_stmt->execute();
            }
        }

        $conn->commit();
        send_json(201, ['id' => $listId, 'createdAt' => $createdAt, 'itemCount' => count($items)]);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ['message' => 'Failed to create restock list.', 'error' => $e->getMessage()]);
    }
}

function handleDeleteRestockList($conn) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        send_json(400, ['message' => 'Restock list ID is required']);
        return;
    }

    $conn->begin_transaction();
    try {
        $items_stmt = $conn->prepare('DELETE FROM restock_list_items WHERE restock_list_id = ?');
        $items_stmt->bind_param('s', $id);
        $items_stmt->execute();

        $list_stmt = $conn->prepare('DELETE FROM restock_lists WHERE id = ?');
        $list_stmt->bind_param('s', $id);
        $list_stmt->execute();

        $conn->commit();
        send_json(200, ['message' => 'Restock list deleted successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ['message' => 'Failed to delete restock list.', 'error' => $e->getMessage()]);
    }
}

$conn->close();
?>
