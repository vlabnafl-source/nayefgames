#!/bin/bash
# Bundles src/ into a single offline HTML (../NEON_CITY_2030.html + ../index.html)
cd "$(dirname "$0")"
mkdir -p out
node_modules/.bin/esbuild src/main.js --bundle --format=iife --minify --legal-comments=none --outfile=out/game.js --log-level=warning || exit 1
python3 - <<'PY'
js=open('out/game.js').read().replace('</script','<\\/script')
head='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>NEON CITY 2030 — REAL CITY 2.0 Luxury Life</title></head><body>\n'
html=head+'<script>'+js+'</script></body></html>'
for n in ('../NEON_CITY_2030.html','../index.html'):
    open(n,'w').write(html)
print('BUILT',len(html))
PY
