<?php
// php_server/allergens.php

require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetAllergens($conn);
        break;
    case 'POST':
        handlePostAllergen($conn);
        break;
    case 'DELETE':
        handleDeleteAllergen($conn);
        break;
    default:
        send_json(405, ['error' => 'Method not allowed']);
        break;
}

function handleGetAllergens($conn) {
    try {
        $result = $conn->query('SELECT * FROM allergens');
        $allergens = $result->fetch_all(MYSQLI_ASSOC);
        send_json(200, $allergens);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handlePostAllergen($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $dish = $data['dish'];
    $allergens = $data['allergens'];

    try {
        $stmt = $conn->prepare('INSERT INTO allergens (dish, allergens) VALUES (?, ?)');
        $stmt->bind_param('ss', $dish, $allergens);
        $stmt->execute();
        $id = $stmt->insert_id;
        send_json(201, ['id' => $id, 'dish' => $dish, 'allergens' => $allergens]);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handleDeleteAllergen($conn) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        send_json(400, ['message' => 'Allergen ID is required']);
        return;
    }

    try {
        $stmt = $conn->prepare('DELETE FROM allergens WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            send_json(200, ['message' => 'Allergen deleted']);
        } else {
            send_json(404, ['message' => 'Allergen not found']);
        }
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

$conn->close();
?>
