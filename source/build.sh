#!/bin/bash
cd /home/claude/neon
node_modules/.bin/esbuild src/main.js --bundle --format=iife --minify=false --outfile=out/game.js --log-level=warning && echo BUNDLED
