curl -s http://localhost:4321/api/chat 2>&1
Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method GET | ConvertTo-Json