<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// database.php

// --- Connection Details ---
// Please update the following variables with your MySQL database credentials.
$servername = "31.11.39.177"; // Or your MySQL server IP/hostname provided by Aruba.it
$username = "Sql1923175"; // Your MySQL username
$password = "Hicham1980!"; // Your MySQL password
$dbname = "Sql1923175_1"; // The name of your database

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
