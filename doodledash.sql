-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 03, 2026 at 06:37 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `doodledash`
--

-- --------------------------------------------------------

--
-- Table structure for table `drawings`
--

DROP TABLE IF EXISTS `drawings`;
CREATE TABLE IF NOT EXISTS `drawings` (
  `drawing_id` int NOT NULL AUTO_INCREMENT,
  `game_id` int NOT NULL,
  `player_id` int NOT NULL,
  `word_id` int NOT NULL,
  `drawing_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`drawing_id`),
  KEY `game_id` (`game_id`),
  KEY `player_id` (`player_id`),
  KEY `word_id` (`word_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
CREATE TABLE IF NOT EXISTS `games` (
  `game_id` int NOT NULL AUTO_INCREMENT,
  `room_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('waiting','playing','finished') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'waiting',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_id`),
  UNIQUE KEY `room_code` (`room_code`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `games`
--

INSERT INTO `games` (`game_id`, `room_code`, `status`, `created_at`) VALUES
(1, 'DB66E95975', 'finished', '2026-11-02 12:51:09'),
(2, '2753F6F338', 'finished', '2026-11-02 13:00:20'),
(3, '89DA6CA2DE', 'finished', '2026-11-03 05:18:36'),
(4, '1701D3B37D', 'finished', '2026-11-03 05:49:32');

-- --------------------------------------------------------

--
-- Table structure for table `game_players`
--

DROP TABLE IF EXISTS `game_players`;
CREATE TABLE IF NOT EXISTS `game_players` (
  `game_player_id` int NOT NULL AUTO_INCREMENT,
  `game_id` int NOT NULL,
  `player_id` int NOT NULL,
  `total_score` int NOT NULL DEFAULT '0',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_player_id`),
  UNIQUE KEY `game_id` (`game_id`,`player_id`),
  KEY `player_id` (`player_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `game_players`
--

INSERT INTO `game_players` (`game_player_id`, `game_id`, `player_id`, `total_score`, `joined_at`) VALUES
(1, 1, 1, 9, '2026-11-02 12:51:11'),
(2, 2, 2, 0, '2026-11-02 13:00:20'),
(3, 3, 3, 5, '2026-11-03 05:18:36'),
(4, 4, 2, 1, '2026-11-03 05:49:33');

-- --------------------------------------------------------

--
-- Table structure for table `guesses`
--

DROP TABLE IF EXISTS `guesses`;
CREATE TABLE IF NOT EXISTS `guesses` (
  `guess_id` int NOT NULL AUTO_INCREMENT,
  `game_id` int NOT NULL,
  `player_id` int NOT NULL,
  `drawing_id` int NOT NULL,
  `guess_text` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `points_earned` int NOT NULL DEFAULT '0',
  `guessed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`guess_id`),
  KEY `game_id` (`game_id`),
  KEY `player_id` (`player_id`),
  KEY `drawing_id` (`drawing_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
CREATE TABLE IF NOT EXISTS `players` (
  `player_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`player_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `players`
--

INSERT INTO `players` (`player_id`, `username`, `created_at`) VALUES
(1, 'Rhy', '2026-11-02 12:51:08'),
(2, 'R', '2026-11-02 13:00:20'),
(3, 'ICE', '2026-11-03 05:18:36');

-- --------------------------------------------------------

--
-- Table structure for table `words`
--

DROP TABLE IF EXISTS `words`;
CREATE TABLE IF NOT EXISTS `words` (
  `word_id` int NOT NULL AUTO_INCREMENT,
  `word` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`word_id`),
  UNIQUE KEY `word` (`word`)
) ENGINE=MyISAM AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `words`
--

INSERT INTO `words` (`word_id`, `word`, `is_active`) VALUES
(1, 'Umbrella', 1),
(2, 'Penguin', 1),
(3, 'Pizza', 1),
(4, 'Backpack', 1),
(5, 'Volcano', 1),
(6, 'Guitar', 1),
(7, 'Butterfly', 1),
(8, 'Toothbrush', 1),
(9, 'Castle', 1),
(10, 'Watermelon', 1),
(11, 'Bicycle', 1),
(12, 'Octopus', 1),
(13, 'Laptop', 1),
(14, 'Rainbow', 1),
(15, 'Cactus', 1),
(16, 'Airplane', 1),
(17, 'Popcorn', 1),
(18, 'Turtle', 1),
(19, 'Mirror', 1),
(20, 'Dinosaur', 1),
(21, 'Slippers', 1),
(22, 'Snowman', 1),
(23, 'Camera', 1),
(24, 'Elephant', 1),
(25, 'Pineapple', 1),
(26, 'Clock', 1),
(27, 'Rocket', 1),
(28, 'Crown', 1),
(29, 'Jellyfish', 1),
(30, 'Sunglasses', 1),
(31, 'Donut', 1),
(32, 'Lighthouse', 1),
(33, 'Crab', 1),
(34, 'Headphones', 1),
(35, 'Mushroom', 1),
(36, 'Helicopter', 1),
(37, 'Pillow', 1),
(38, 'Peacock', 1),
(39, 'Key', 1),
(40, 'Telescope', 1),
(41, 'Ice cream', 1),
(42, 'Robot', 1),
(43, 'Feather', 1),
(44, 'Train', 1),
(45, 'Kite', 1),
(46, 'Candle', 1),
(47, 'Whale', 1),
(48, 'Suitcase', 1),
(49, 'Drum', 1),
(50, 'Treasure chest', 1);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
