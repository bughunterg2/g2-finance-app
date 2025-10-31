# Firestore Security Rules untuk Admin Users Management

## Rules yang Diperlukan

Copy-paste rules berikut ke Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      // Allow read: user can read their own document, admin can read all
      allow read: if request.auth != null && (
        request.auth.uid == userId || 
        isAdmin()
      );
      
      // Allow create: user can create their own document during registration, admin can create any
      allow create: if request.auth != null && (
        (request.auth.uid == userId && 
         request.resource.data.uid == userId &&
         request.resource.data.email == request.auth.token.email) ||
        isAdmin()
      );
      
      // Allow update: user can update their own document (except role), admin can update any
      allow update: if request.auth != null && (
        (request.auth.uid == userId && 
         (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']))) ||
        isAdmin()
      );
      
      // Allow delete: only admin can delete
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Add other collections rules here (categories, reimbursements, etc.)
  }
}
```

## Rules Alternatif (Lebih Sederhana untuk Development)

Jika ingin rules yang lebih sederhana untuk testing (HANYA UNTUK DEVELOPMENT):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow authenticated users (including admin) to read all users
      allow read: if request.auth != null;
      
      // Allow authenticated users to create documents
      allow create: if request.auth != null;
      
      // Allow authenticated users to update documents
      allow update: if request.auth != null;
      
      // Allow authenticated users to delete documents
      allow delete: if request.auth != null;
    }
  }
}
```

**PERINGATAN**: Rules alternatif ini TIDAK AMAN untuk production karena semua authenticated users bisa membaca/mengubah semua data. Gunakan hanya untuk testing!

## Cara Mengupdate Firestore Rules

1. Buka Firebase Console: https://console.firebase.google.com/
2. Pilih project Anda (`g2-finance-app`)
3. Pergi ke **Firestore Database** → **Rules** tab
4. Copy-paste rules di atas (gunakan rules pertama untuk production, atau rules alternatif untuk development)
5. Klik **Publish**
6. Tunggu beberapa detik hingga rules terupdate

## Verifikasi Rules

Setelah update rules, coba:
1. Login sebagai admin di aplikasi
2. Buka halaman `/admin/users`
3. Data users seharusnya muncul

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Pastikan rules sudah di-publish
- Pastikan user yang login memiliki role `admin` di Firestore
- Cek di Firebase Console → Firestore Database → Data, pastikan user document memiliki field `role: 'admin'`

### Error: "Permission denied"
- Pastikan user sudah authenticated (sudah login)
- Pastikan rules sudah benar (copy-paste dengan hati-hati)
- Cek console browser untuk error details

## Testing

Setelah update rules:
1. Login sebagai admin
2. Buka halaman `/admin/users`
3. Refresh page atau klik button "Refresh"
4. Users dari Firestore seharusnya muncul




