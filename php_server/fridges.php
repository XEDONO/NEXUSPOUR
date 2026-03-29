<?php
// php_server/fridges.php

require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetFridges($conn);
        break;
    case 'POST':
        handlePostFridge($conn);
        break;
    case 'DELETE':
        handleDeleteFridge($conn);
        break;
    default:
        send_json(405, ['error' => 'Method not allowed']);
        break;
}

function handleGetFridges($conn) {
    try {
        $result = $conn->query('SELECT * FROM fridges');
        $fridges = $result->fetch_all(MYSQLI_ASSOC);
        send_json(200, $fridges);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handlePostFridge($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'];
    $location = $data['location'];
    $expectedMin = $data['expectedMin'];
    $expectedMax = $data['expectedMax'];

    try {
        $stmt = $conn->prepare('INSERT INTO fridges (id, location, expectedMin, expectedMax) VALUES (?, ?, ?, ?)');
        $stmt->bind_param('ssii', $id, $location, $expectedMin, $expectedMax);
        $stmt->execute();
        send_json(201, ['id' => $id]);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handleDeleteFridge($conn) {
    // The ID is expected to be in the query string, e.g., /api/fridges.php?id=...
    $id = $_GET['id'] ?? null;

    if (!$id) {
        send_json(400, ['message' => 'Fridge ID is required']);
        return;
    }

    try {
        $stmt = $conn->prepare('DELETE FROM fridges WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            send_json(200, ['message' => 'Fridge deleted']);
        } else {
            send_json(404, ['message' => 'Fridge not found']);
        }
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

$conn->close();
?>
