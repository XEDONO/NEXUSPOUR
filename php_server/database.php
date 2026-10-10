<?php
// --- CRITICAL CORS HEADERS ---
ob_start(); // Prevent any early output from breaking headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// database.php

// --- Connection Details ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "nexus_pour";

// --- Create Connection ---
$conn = new mysqli($servername, $username, $password, $dbname);

// --- Check Connection ---
if ($conn->connect_error) {
    // In case of a connection error, stop the script and show the error.
    // For production, you might want to log this error instead of displaying it.
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $conn->connect_error]);
    die();
}

// --- Set Character Set ---
// It's good practice to set the character set to utf8mb4 for full Unicode support.
$conn->set_charset("utf8mb4");

/**
 * A helper function to send JSON responses.
 *
 * @param int $statusCode The HTTP status code to send.
 * @param mixed $data The data to encode as JSON and send.
 */
function send_json($statusCode, $data) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
}

?>
