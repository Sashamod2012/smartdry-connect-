# Auth Testing Playbook — SmartDry Connect

Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`; unique index on users.email; index on login_attempts.identifier.

Step 2: API Testing
```
curl -c cookies.txt -X POST <API>/api/auth/login -H "Content-Type: application/json" -d '{"email":"folasade.amodu@gmail.com","password":"SmartDry@2026"}'
curl -b cookies.txt <API>/api/auth/me
curl -b cookies.txt -X POST <API>/api/auth/logout
```
Login returns the user object and sets the access_token httpOnly cookie. /me returns the same user. Wrong password → 401. 5 wrong attempts → 429 lockout.

Step 3: Frontend Flow
- Visit / → redirected to /login
- Submit wrong password → error shown in login-error
- Login with admin creds → lands on dashboard, sidebar shows user name/email
- logout-button → returns to /login
- /trace/SDC-2026-083 accessible WITHOUT login (public QR passport)
- POST /api/batches without cookie → 401
