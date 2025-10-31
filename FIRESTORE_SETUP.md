# Firestore Security Rules Setup

## Masalah yang Diperbaiki

Kode autentikasi telah diperbaiki untuk:
1. **Auto-detect admin email** - Email `admin@example.com` akan otomatis mendapatkan role `admin`
2. **Better error handling** - Pesan error yang lebih spesifik untuk debugging
3. **Auto-create user document** - Jika user ada di Firebase Auth tapi tidak ada di Firestore, dokumen akan dibuat otomatis

## Firestore Security Rules yang Diperlukan

Agar aplikasi bekerja dengan baik, pastikan Firestore Security Rules mengizinkan:

### Rules untuk Collection `users`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow read: user can read their own document, admin can read all
      allow read: if request.auth != null && (
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // Allow create: authenticated users can create their own document
      allow create: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.uid == userId &&
        request.resource.data.email == request.auth.token.email;
      
      // Allow update: user can update their own document, admin can update any
      allow update: if request.auth != null && (
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // Allow delete: only admin can delete
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Add other collections rules here (categories, reimbursements, etc.)
  }
}
```

### Rules Minimal untuk Testing (Tidak Direkomendasikan untuk Production)

Jika masih testing dan ingin cepat, bisa gunakan rules sementara ini (HANYA UNTUK DEVELOPMENT):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow authenticated users to read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow authenticated users to create their own document
      allow create: if request.auth != null;
    }
  }
}
```

## Cara Mengupdate Firestore Rules

1. Buka Firebase Console: https://console.firebase.google.com/
2. Pilih project Anda (`g2-finance-app`)
3. Pergi ke **Firestore Database** → **Rules**
4. Copy-paste rules di atas
5. Klik **Publish**

## Troubleshooting

### Error: "Tidak memiliki izin untuk membuat data pengguna"
- Pastikan Firestore rules sudah diupdate seperti di atas
- Pastikan user sudah authenticated (sudah login di Firebase Auth)

### Error: "Gagal memuat data pengguna"
- Periksa console browser untuk error detail
- Pastikan Firestore rules mengizinkan create document
- Pastikan Firebase project ID benar di `client/src/firebase/config.ts`

## Testing

Setelah update rules, coba login lagi dengan:
- Email: `admin@example.com`
- Password: `123456`

Kode akan otomatis:
1. Membuat dokumen user di Firestore jika belum ada
2. Set role menjadi `admin` untuk email `admin@example.com`
3. Menampilkan error yang lebih informatif jika ada masalah


