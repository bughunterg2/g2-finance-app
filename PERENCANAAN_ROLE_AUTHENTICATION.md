# Perencanaan: Perbaikan Sistem Autentikasi Berbasis Role dari Firestore

## Masalah yang Ditemukan

### 1. **Role ditentukan berdasarkan email** (❌ Perlu diperbaiki)
   - Lokasi: `client/src/firebase/auth.ts` baris 31-34
   - Masalah: Logic fallback menentukan role admin berdasarkan email `admin@example.com` atau email yang mengandung `admin@`
   - Dampak: User bisa jadi admin hanya karena email-nya, bukan karena role yang terdaftar di Firestore

### 2. **Auto-create user dengan role dari email** (❌ Perlu diperbaiki)
   - Lokasi: `client/src/firebase/auth.ts` baris 23-50
   - Masalah: Jika user tidak ada di Firestore, sistem membuat user baru dengan role berdasarkan email
   - Dampak: User bisa dibuat otomatis dengan role yang salah

### 3. **Fallback role ke 'agent' tanpa validasi** (⚠️ Perlu diperbaiki)
   - Lokasi: `client/src/firebase/auth.ts` baris 97-98
   - Masalah: Jika role tidak ada di Firestore, default ke 'agent'
   - Dampak: Role bisa tidak jelas jika data tidak lengkap

## Solusi yang Akan Diterapkan

### Prinsip Dasar
1. **Role SELALU diambil dari Firestore** - Tidak ada fallback berdasarkan email atau nama
2. **User HARUS terdaftar di Firestore** - Jika tidak ada, login ditolak dengan error yang jelas
3. **Validasi role wajib** - Role harus ada dan valid ('admin' atau 'agent')
4. **Role tidak bisa diubah sembarangan** - Hanya admin yang bisa mengubah role user

### Perubahan yang Akan Dilakukan

#### 1. **File: `client/src/firebase/auth.ts`**

##### Perubahan pada `mapFirebaseUserToAppUser()`:
- ❌ **HAPUS**: Logic yang menentukan role berdasarkan email (baris 31-34)
- ❌ **HAPUS**: Auto-create user document jika tidak ada (baris 23-50)
- ✅ **TAMBAHKAN**: Validasi bahwa user document HARUS ada di Firestore
- ✅ **TAMBAHKAN**: Error yang jelas jika user tidak terdaftar di Firestore
- ✅ **TAMBAHKAN**: Validasi bahwa role harus ada dan valid ('admin' atau 'agent')
- ✅ **TAMBAHKAN**: Validasi bahwa role tidak boleh kosong atau undefined

##### Perubahan pada `loginWithEmail()`:
- ✅ **PASTIKAN**: Role selalu diambil dari Firestore
- ✅ **TAMBAHKAN**: Logging yang jelas untuk debugging role
- ✅ **TAMBAHKAN**: Error handling yang lebih spesifik untuk kasus role tidak valid

##### Perubahan pada `registerWithEmail()`:
- ✅ **VERIFIKASI**: Role yang didaftarkan valid ('admin' atau 'agent')
- ✅ **TAMBAHKAN**: Validasi bahwa hanya admin yang bisa register dengan role 'admin' (opsional untuk sekarang, bisa diimplementasikan nanti)
- ✅ **PASTIKAN**: Role disimpan dengan benar ke Firestore

##### Perubahan pada `getCurrentUser()`:
- ✅ **PASTIKAN**: Role selalu diambil dari Firestore
- ✅ **TAMBAHKAN**: Error handling jika user document tidak ada

#### 2. **File: `client/src/stores/authStore.ts`**

##### Perubahan pada `login()`:
- ✅ **PASTIKAN**: User yang dikembalikan memiliki role yang valid dari Firestore
- ✅ **TAMBAHKAN**: Validasi role sebelum menyimpan ke state

##### Perubahan pada `setUser()`:
- ✅ **TAMBAHKAN**: Validasi bahwa user memiliki role yang valid sebelum di-set

#### 3. **File: `client/src/components/AppRouter.tsx`**

##### Perubahan pada `ProtectedRoute`:
- ✅ **PASTIKAN**: Menggunakan role dari Firestore (sudah benar, hanya perlu memastikan)
- ✅ **TAMBAHKAN**: Error handling jika role tidak valid

##### Perubahan pada redirect logic:
- ✅ **PASTIKAN**: Redirect berdasarkan role dari Firestore (sudah benar, hanya perlu memastikan)

#### 4. **File: `client/src/pages/auth/LoginPage/index.tsx`**

##### Perubahan pada redirect setelah login:
- ✅ **PASTIKAN**: Menggunakan role dari Firestore (sudah benar, hanya perlu memastikan)

#### 5. **File: `client/src/main.tsx`**

##### Perubahan pada auth state listener:
- ✅ **PASTIKAN**: Role selalu diambil dari Firestore saat auth state berubah
- ✅ **TAMBAHKAN**: Error handling jika user document tidak ada di Firestore

## Alur Autentikasi Baru

### Flow Login:
1. User memasukkan email dan password
2. Firebase Auth memverifikasi credentials
3. Jika berhasil, ambil user document dari Firestore menggunakan UID
4. **VALIDASI**: User document harus ada di Firestore
5. **VALIDASI**: Role harus ada dan valid ('admin' atau 'agent')
6. **VALIDASI**: User harus aktif (isActive = true)
7. Update lastLoginAt di Firestore
8. Return user dengan role dari Firestore
9. Jika validasi gagal, logout user dan throw error yang jelas

### Flow Register:
1. User memasukkan data register termasuk role
2. **VALIDASI**: Role harus valid ('admin' atau 'agent')
3. Firebase Auth membuat user baru
4. Buat user document di Firestore dengan role yang dipilih
5. Return user dengan role dari Firestore

### Flow Auth State Change:
1. Firebase Auth state berubah (login/logout)
2. Jika login, ambil user document dari Firestore
3. **VALIDASI**: User document harus ada
4. **VALIDASI**: Role harus valid
5. Update state dengan user data dari Firestore

## Error Messages yang Akan Ditambahkan

1. **"User tidak terdaftar di sistem. Silakan hubungi administrator."**
   - Ketika user ada di Firebase Auth tapi tidak ada di Firestore

2. **"Role tidak valid. Silakan hubungi administrator."**
   - Ketika role tidak ada atau tidak valid

3. **"Data user tidak lengkap. Silakan hubungi administrator."**
   - Ketika user document ada tapi tidak memiliki field yang diperlukan

## Testing Checklist

### Test Case 1: Login dengan user yang terdaftar di Firestore
- [ ] User dengan role 'admin' di Firestore bisa login sebagai admin
- [ ] User dengan role 'agent' di Firestore bisa login sebagai agent
- [ ] Redirect ke halaman yang sesuai berdasarkan role

### Test Case 2: Login dengan user yang TIDAK terdaftar di Firestore
- [ ] User yang ada di Firebase Auth tapi tidak ada di Firestore tidak bisa login
- [ ] Error message yang jelas ditampilkan
- [ ] User di-logout otomatis

### Test Case 3: Login dengan role yang tidak valid
- [ ] User dengan role selain 'admin' atau 'agent' tidak bisa login
- [ ] Error message yang jelas ditampilkan

### Test Case 4: Login dengan user yang tidak aktif
- [ ] User dengan isActive = false tidak bisa login
- [ ] Error message yang jelas ditampilkan

### Test Case 5: Auth state change listener
- [ ] Saat user login, state ter-update dengan role dari Firestore
- [ ] Saat user logout, state ter-clear dengan benar

### Test Case 6: Protected routes
- [ ] Route admin hanya bisa diakses oleh user dengan role 'admin'
- [ ] Route agent hanya bisa diakses oleh user dengan role 'agent'
- [ ] Redirect ke unauthorized jika role tidak sesuai

## Migrasi Data Existing (Jika Ada)

Jika ada user yang sudah terdaftar di Firebase Auth tapi belum ada di Firestore:

1. **Option 1**: Buat script migrasi untuk membuat user document di Firestore dengan role default 'agent'
2. **Option 2**: Admin harus membuat user document secara manual di Firestore Console
3. **Option 3**: Buat page admin untuk mendaftarkan user yang sudah ada di Firebase Auth

## Security Considerations

1. **Firestore Rules**: Pastikan rules tidak mengizinkan user mengubah role sendiri
   ```javascript
   // User tidak bisa mengubah role sendiri
   allow update: if request.auth != null && 
     request.auth.uid == userId &&
     request.resource.data.role == resource.data.role;
   ```

2. **Role Validation**: Pastikan role selalu divalidasi dari Firestore, bukan dari client state

3. **Admin Only Actions**: Pastikan aksi admin hanya bisa dilakukan oleh user dengan role 'admin' yang terverifikasi dari Firestore

## Implementasi Priority

### Phase 1: Core Fix (PENTING)
1. Hapus logic role berdasarkan email
2. Hapus auto-create user document
3. Tambahkan validasi user document harus ada
4. Tambahkan validasi role harus valid

### Phase 2: Error Handling (PENTING)
1. Tambahkan error messages yang jelas
2. Improve error handling di semua flow

### Phase 3: Security (PENTING)
1. Update Firestore rules untuk mencegah user mengubah role sendiri
2. Tambahkan validasi role di semua protected actions

### Phase 4: Testing & Documentation (OPSIONAL)
1. Test semua scenarios
2. Update dokumentasi
3. Buat migration script jika diperlukan

## Notes

- Jangan langsung generate code, perencanaan ini harus direview dulu
- Pastikan semua perubahan di-test dengan baik
- Backup data Firestore sebelum perubahan besar
- Pastikan Firestore rules sudah benar sebelum deploy


