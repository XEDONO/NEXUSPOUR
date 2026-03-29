-- NEXUSPOUR Database Schema
-- This script will create the necessary tables for the application to run.
-- You can import this file into your phpMyAdmin to set up the database structure.

CREATE TABLE `fridges` (
  `id` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `expectedMin` int(11) NOT NULL,
  `expectedMax` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `temp_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `fridge_id` varchar(255) NOT NULL,
  `reading` decimal(5,2) NOT NULL,
  `pass` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date_fridge` (`date`,`fridge_id`),
  KEY `fridge_id` (`fridge_id`),
  CONSTRAINT `temp_logs_ibfk_1` FOREIGN KEY (`fridge_id`) REFERENCES `fridges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `checklists` (
  `id` varchar(255) NOT NULL,
  `frequency` varchar(50) NOT NULL,
  `section` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'general',
  `completions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `inventory` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `par` int(11) DEFAULT 0,
  `lastUpdated` datetime NOT NULL,
  `lastOrderedAt` datetime DEFAULT NULL,
  `restockCount` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `restock_lists` (
  `id` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `restock_list_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `restock_list_id` varchar(255) NOT NULL,
  `inventory_item_id` varchar(255) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `urgency` varchar(50) NOT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `restock_list_id` (`restock_list_id`),
  KEY `inventory_item_id` (`inventory_item_id`),
  CONSTRAINT `restock_list_items_ibfk_1` FOREIGN KEY (`restock_list_id`) REFERENCES `restock_lists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `restock_list_items_ibfk_2` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `allergens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dish` varchar(255) NOT NULL,
  `allergens` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
