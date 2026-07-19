#!/usr/bin/env bash
set -euo pipefail

SB="${SUPABASE_PAT:?Set SUPABASE_PAT (Supabase personal access token) before running this script}"
VT="${VERCEL_PAT:?Set VERCEL_PAT (Vercel personal access token) before running this script}"
REF='lhsrfbhwgemxntkgfkgs'
PID='prj_XboPoNqMwgn6WwReJ4rtS89L71AU'

# ---- 1. Supabase API keys (curl) ----
KEYS=$(curl -s "https://api.supabase.com/v1/projects/$REF/api-keys" -H "Authorization: Bearer $SB")
ANON=$(echo "$KEYS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d);console.log(a.find(k=>k.name==='anon').api_key)})")
SROLE=$(echo "$KEYS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d);console.log(a.find(k=>k.name==='service_role').api_key)})")
URL="https://$REF.supabase.co"
echo "SUPABASE_URL=$URL"
echo "ANON len=${#ANON}  SROLE len=${#SROLE}"

# ---- 2. Run schema.sql via /database/query (curl) ----
BODY=$(node -e "process.stdout.write(JSON.stringify({query: require('fs').readFileSync('supabase/schema.sql','utf8')}))")
SQLRES=$(curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $SB" -H "Content-Type: application/json" -d "$BODY")
echo "schema SQL: $(echo "$SQLRES" | head -c 160)"

# ---- 3. Vercel env PATCH (curl) ----
ENVLIST=$(curl -s "https://api.vercel.com/v10/projects/$PID/env" -H "Authorization: Bearer $VT")

patch() {
  local KEY="$1" VAL="$2"
  local ID
  ID=$(echo "$ENVLIST" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);const e=(j.envs||[]).find(x=>x.key==='$KEY');console.log(e ? e.id : '')})")
  if [ -z "$ID" ]; then echo "WARN no env $KEY"; return; fi
  local PBODY
  PBODY=$(node -e "process.stdout.write(JSON.stringify({value:process.argv[1],type:'encrypted',target:['production','preview','development']}))" "$VAL")
  local R
  R=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "https://api.vercel.com/v10/projects/$PID/env/$ID" \
    -H "Authorization: Bearer $VT" -H "Content-Type: application/json" -d "$PBODY")
  echo "patch $KEY -> HTTP $R"
}

patch "NEXT_PUBLIC_SUPABASE_URL" "$URL"
patch "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON"
patch "SUPABASE_SERVICE_ROLE_KEY" "$SROLE"
echo "=== DONE: Supabase wired, Vercel env updated. Redeploy to apply. ==="
