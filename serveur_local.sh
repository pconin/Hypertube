#!/bin/sh
mkdir -p /goinfre/movie;
ln -s /goinfre/movie public/movies;
mkdir -p public/userimg;
mkdir public/torrents;
mkdir public/subtitles;
php -f ./config/setup.php;