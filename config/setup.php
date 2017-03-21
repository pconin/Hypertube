<?php
	$DB_DSN = 'mysql:host=127.0.0.1;port=3307;';
	$DB_USER = 'root';
	$DB_PASSWORD = 'rootroot'; // no password on cloud9

	try
	{
		$db = new PDO($DB_DSN, $DB_USER, $DB_PASSWORD);
		$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	}
	catch (Exception $e)
	{
		echo "Echec " . $e->getMessage();
		die ();
	}
	$drop = "DROP DATABASE IF EXISTS hypertube;";
	$create = "CREATE DATABASE hypertube;";
	$use = "USE hypertube;";
	try
	{
		$db->exec($drop);
		$db->exec($create);
		$db->exec($use);
	}
	catch (PDOException $e)
	{
		echo "error", $e->getMessage().'<br/>';
	}
	echo "DB successfully created";
	
	$groupby = "SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));";

	$createcoms = "CREATE TABLE IF NOT EXISTS `coms` (
				  `com_id` int(10) NOT NULL AUTO_INCREMENT,
				  `user_id` int(10) NOT NULL,
				  `contenu` varchar(120) NOT NULL,
				  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
				  `source` enum('yts','piratebay') NOT NULL,
				  `movie_id` int(10) NOT NULL,
				  PRIMARY KEY (`com_id`)
				) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;";
	
	$createhistory = "CREATE TABLE IF NOT EXISTS `history` (
		  `id_user` int(11) NOT NULL,
		  `id_movie` int(11) NOT NULL,
		  `hebergeur` text NOT NULL,
		  `timestamp` datetime NOT NULL,
		  `name` text NOT NULL,
		  `image` text,
		  `season` text
		) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
		
	$createmovies = "CREATE TABLE IF NOT EXISTS `movies` (
		  `movie_unique_id` int(10) NOT NULL AUTO_INCREMENT,
		  `source` enum('pb','yts') NOT NULL,
		  `movie_id` int(10) NOT NULL,
		  `path` text NOT NULL,
		  `timestamp` int(10) unsigned NOT NULL,
		  `done` enum('true','false') NOT NULL DEFAULT 'false',
		  `streamable` enum('true','false') NOT NULL DEFAULT 'false',
		  PRIMARY KEY (`movie_unique_id`)
		) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;";
		
	$createusers = "CREATE TABLE IF NOT EXISTS `users` (
		  `id` int(11) NOT NULL AUTO_INCREMENT,
		  `login` text NOT NULL,
		  `mail` text,
		  `pass` text,
		  `ip` text,
		  `photo` text,
		  `provenance` text,
		  `refreshToken` text,
		  `accessToken` text,
		  `firstname` text,
		  `lastname` text,
		  `lang` text,
		  PRIMARY KEY (`id`)
		) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;";
		
	
	try
	{
		$db->exec($groupby);
		$db->exec($createcoms);
		$db->exec($createhistory);
		$db->exec($createmovies);
		$db->exec($createusers);
	}
	catch (PDOException $e)
	{
		echo "error", $e->getMessage().'<br/>';
	}
?>