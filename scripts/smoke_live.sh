#!/usr/bin/env bash
set -euo pipefail

SB="${SUPABASE_PAT:?Set SUPABASE_PAT (Supabase personal access token) before running this script}"
REF='lhsrfbhwgemxntkgfkgs'
SITE='https://cairn-beta-six.vercel.app'
PASS="SmokePass123!"
EMAIL="smoke+$(node -e "process.stdout.write(require('crypto').randomUUID().slice(0,8))")@cairn.test"
JAR=/tmp/cj_cairn.txt; rm -f "$JAR"

# 1. admin-create CONFIRMED user (Supabase Mgmt API, curl)
BODY=$(node -e "process.stdout.write(JSON.stringify({email:process.argv[1],password:process.argv[2],confirm:true,auto_confirm:true}))" "$EMAIL" "$PASS")
U=$(curl -s -X POST "https://api.supabase.com/v1/projects/$REF/users" -H "Authorization: Bearer $SB" -H "Content-Type: application/json" -d "$BODY")
UUID_=$(echo "$U" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(j.id||'')})")
echo "admin user id: ${UUID_:-NONE}  ($EMAIL)"
[ -z "$UUID_" ] && { echo "user create failed: $U"; exit 1; }

# 2. login via the live app (captures Supabase session cookie)
LBODY=$(node -e "process.stdout.write(JSON.stringify({email:process.argv[1],password:process.argv[2]}))" "$EMAIL" "$PASS")
echo "--- login ---"
curl -s -c "$JAR" -X POST "$SITE/api/auth/login" -H "Content-Type: application/json" -d "$LBODY" -w "HTTP %{http_code}\n" | head -c 220; echo

# 3. /api/me (session check)
echo "--- me ---"
curl -s -b "$JAR" "$SITE/api/me" -w "HTTP %{http_code}\n" | head -c 220; echo

# 4. create a course (exercises OpenRouter AI + Supabase write)
CBODY=$(node -e "process.stdout.write(JSON.stringify({sourceType:'topic',sourceText:'the krebs cycle and cellular respiration',title:'SmokeTest'}))")
echo "--- create course ---"
curl -s -b "$JAR" -X POST "$SITE/api/courses" -H "Content-Type: application/json" -d "$CBODY" -w "HTTP %{http_code}\n" | head -c 320; echo

# 5. cleanup: delete test user (cascades to profile + course)
echo "--- cleanup ---"
curl -s -o /dev/null -w "delete user HTTP %{http_code}\n" -X DELETE "https://api.supabase.com/v1/projects/$REF/users/$UUID_" -H "Authorization: Bearer $SB"
echo "=== smoke test complete ==="
