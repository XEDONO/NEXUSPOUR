<?php
// php_server/logs.php

require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetLogs($conn);
        break;
    case 'POST':
        handlePostLog($conn);
        break;
    case 'PUT':
        handlePutLog($conn);
        break;
    case 'DELETE':
        handleDeleteLog($conn);
        break;
    default:
        send_json(405, ['error' => 'Method not allowed']);
        break;
}

function handleGetLogs($conn) {
    try {
        $result = $conn->query('SELECT * FROM temp_logs');
        $logs = $result->fetch_all(MYSQLI_ASSOC);
        send_json(200, $logs);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handlePostLog($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $date = $data['date'];
    $fridge_id = $data['fridge_id'];
    $reading = $data['reading'];
    $pass = $data['pass'] ? 1 : 0;

    try {
        $stmt = $conn->prepare('INSERT INTO temp_logs (date, fridge_id, reading, pass) VALUES (?, ?, ?, ?)');
        $stmt->bind_param('ssdi', $date, $fridge_id, $reading, $pass);
        $stmt->execute();
        send_json(201, ['id' => $stmt->insert_id]);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handlePutLog($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $date = $data['date'];
    $fridge_id = $data['fridge_id'];
    $reading = $data['reading'];
    $pass = $data['pass'] ? 1 : 0;

    try {
        $stmt = $conn->prepare('SELECT id FROM temp_logs WHERE date = ? AND fridge_id = ?');
        $stmt->bind_param('ss', $date, $fridge_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $existing = $result->fetch_assoc();

        if ($existing) {
            $update_stmt = $conn->prepare('UPDATE temp_logs SET reading = ?, pass = ? WHERE id = ?');
            $update_stmt->bind_param('dii', $reading, $pass, $existing['id']);
            $update_stmt->execute();
        } else {
            $insert_stmt = $conn->prepare('INSERT INTO temp_logs (date, fridge_id, reading, pass) VALUES (?, ?, ?, ?)');
            $insert_stmt->bind_param('ssdi', $date, $fridge_id, $reading, $pass);
            $insert_stmt->execute();
        }
        send_json(200, ['message' => 'Log updated or created']);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handleDeleteLog($conn) {
    $date = $_GET['date'] ?? null;

    if (!$date) {
        send_json(400, ['message' => 'Date is required']);
        return;
    }

    try {
        $stmt = $conn->prepare('DELETE FROM temp_logs WHERE date = ?');
        $stmt->bind_param('s', $date);
        $stmt->execute();
        send_json(200, ['message' => "Deleted {$stmt->affected_rows} logs for {$date}"]);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

$conn->close();

?>
