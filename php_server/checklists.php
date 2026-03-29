<?php
// php_server/checklists.php

require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];

// Check for special delete actions
$action = $_GET['action'] ?? '';
if ($method === 'DELETE' && $action === 'purge') {
    handlePurgeChecklists($conn);
    exit;
}

switch ($method) {
    case 'GET':
        handleGetChecklists($conn);
        break;
    case 'POST':
        handlePostChecklist($conn);
        break;
    case 'DELETE':
        handleDeleteChecklist($conn);
        break;
    case 'PUT':
        handlePutCompletion($conn);
        break;
    default:
        send_json(405, ['error' => 'Method not allowed']);
        break;
}

function handleGetChecklists($conn) {
    try {
        $result = $conn->query('SELECT * FROM checklists');
        $checklists = [];
        while ($row = $result->fetch_assoc()) {
            $row['completions'] = json_decode($row['completions'] ?? '{}', true);
            $checklists[] = $row;
        }
        send_json(200, $checklists);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handlePostChecklist($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'];
    $frequency = $data['frequency'];
    $section = $data['section'];
    $text = $data['text'];
    $type = $data['type'] ?? 'general';

    try {
        $stmt = $conn->prepare('INSERT INTO checklists (id, frequency, section, text, type, completions) VALUES (?, ?, ?, ?, ?, ?)');
        $completions = '{}';
        $stmt->bind_param('ssssss', $id, $frequency, $section, $text, $type, $completions);
        $stmt->execute();
        send_json(201, ['id' => $id]);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handlePurgeChecklists($conn) {
    try {
        $result = $conn->query('DELETE FROM checklists');
        $affected_rows = $conn->affected_rows;
        send_json(200, ['message' => "Purged {$affected_rows} checklist tasks"]);
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handleDeleteChecklist($conn) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        send_json(400, ['message' => 'Checklist ID is required']);
        return;
    }

    try {
        $stmt = $conn->prepare('DELETE FROM checklists WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            send_json(200, ['message' => 'Checklist deleted']);
        } else {
            send_json(404, ['message' => 'Checklist not found']);
        }
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

function handlePutCompletion($conn) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        send_json(400, ['message' => 'Checklist ID is required']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $dateKey = $data['dateKey'];
    $status = $data['status'];

    try {
        $stmt = $conn->prepare('SELECT completions FROM checklists WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $task = $result->fetch_assoc();

        if ($task) {
            $completions = json_decode($task['completions'] ?? '{}', true);
            $completions[$dateKey] = $status;
            $newCompletions = json_encode($completions);

            $update_stmt = $conn->prepare('UPDATE checklists SET completions = ? WHERE id = ?');
            $update_stmt->bind_param('ss', $newCompletions, $id);
            $update_stmt->execute();
            send_json(200, ['message' => 'Completion updated']);
        } else {
            send_json(404, ['message' => 'Checklist not found']);
        }
    } catch (Exception $e) {
        send_json(500, ['message' => $e->getMessage()]);
    }
}

$conn->close();
?>
