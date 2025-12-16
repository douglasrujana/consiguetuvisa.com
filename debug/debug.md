20:30:03 [200] / 6132ms
[DEBUG] 🚀 GraphQL POST handler invoked
[DEBUG] 📝 Parsing request body...
[DEBUG] ✅ Body parsed: {"query":"query($f: AlertFiltersInput, $l: Int) { \n            alertDomains { id name displayName i
[DEBUG] 📊 Query: query($f: AlertFiltersInput, $l: Int) {

[DEBUG] 📊 Variables: {"f":{"type":null,"priority":null,"domainName":null,"acknowledged":false},"l":100}
[DEBUG] 🔧 Building context...
[ContextFactory] GEMINI_API_KEY not set - RAG services disabled
[DEBUG] ✅ Context built
[DEBUG] ⚙️ Executing GraphQL query...
[DEBUG] ✅ GraphQL executed, result: {"errors":[{"message":"Unexpected token 'A', \"ADMIN,COMMUNITY\" is not valid JSON","locations":[{"l
20:30:03 [200] POST /api/graphql 20ms
[S