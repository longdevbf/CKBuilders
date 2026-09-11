# OffCKB Onboarding Log

Ghi lại toàn bộ các bước đã thực hiện để chạy OffCKB local và deploy thử một smart contract mẫu, theo hướng dẫn [Quick Start (5min) — docs.nervos.org](https://docs.nervos.org/docs/getting-started/quick-start).

- **Ngày thực hiện:** 2026-09-09
- **Máy:** Windows 10, PowerShell
- **Thư mục làm việc:** `D:\CKBuilders`

## Môi trường

| Công cụ | Yêu cầu | Đã có |
|---|---|---|
| Node.js | >= 20 | v24.15.0 |
| npm | — | 11.12.1 |
| @offckb/cli | >= 0.4.0 | 0.4.13 |

## Các bước

### 1. Kiểm tra Node.js

```powershell
node -v
npm -v
```

### 2. Cài OffCKB CLI

```powershell
npm install -g @offckb/cli
```

CLI đã có sẵn trên máy (v0.4.13), không cần cài lại.

### 3. Khởi động devnet node

```powershell
offckb node
```

Kết quả:

```
Launching CKB devnet Node...
CKB devnet is ready at http://127.0.0.1:8114.
Follow the full node log with: offckb logs -f
CKB devnet RPC Proxy server running on http://127.0.0.1:28114
```

- RPC node: `http://127.0.0.1:8114`
- RPC proxy: `http://127.0.0.1:28114`

### 4. Xem danh sách tài khoản test (đã pre-fund CKB)

```powershell
offckb accounts
```

Liệt kê các tài khoản devnet kèm `address`, `pubkey`, `lock_arg`, `lockScript` (private key ẩn mặc định, dùng `--show-private-keys` nếu cần xem trong terminal tin cậy).

### 5. Tạo project contract mẫu

```powershell
offckb create hello-world-demo -c hello-world -l typescript --no-interactive
```

Tạo project mới tại `D:\CKBuilders\hello-world-demo`:
- Contract mẫu: `hello-world`
- Ngôn ngữ: TypeScript
- Package manager: pnpm

> Lần chạy đầu `pnpm install` bị lỗi timeout tới `registry.npmjs.org` (mạng chập chờn). Khắc phục bằng cách chạy lại `pnpm install` trong thư mục project.

### 6. Cài dependencies

```powershell
cd hello-world-demo
pnpm install
pnpm approve-builds esbuild   # cho phép chạy postinstall script của esbuild
```

### 7. Build contract

```powershell
pnpm run build
```

Kết quả:

```
Building contract: hello-world
  Bundling with esbuild with release settings...
  Compiling to bytecode...
  Contract 'hello-world' built successfully!
     JavaScript: dist\hello-world.js
     Bytecode:   dist\hello-world.bc
```

### 8. Deploy contract lên devnet

```powershell
offckb deploy --network devnet --target dist --output deployment --yes
```

(`--yes` để bỏ qua prompt xác nhận interactive khi chạy không tương tác. Project cũng có sẵn script `pnpm run deploy` tương đương nhưng cần xác nhận thủ công.)

**Kết quả deploy thành công:**

- Tx hash: `0x717f98ebdc961a4a5daa2cdbff938c38a5e39f2260c73ba36f738c56916ae974`
- Code hash: `0x68e6c55c513149a84bfb1d733cefda13cc8189a8cca2744e7487a6ce4167c0b2`
- Hash type: `data2`
- File deploy record: `deployment/devnet/hello-world.bc/deployment.toml`
- Migration record: `deployment/devnet/hello-world.bc/migrations/2026-09-09-161215.json`
- Script info tổng hợp: `deployment/scripts.json`

```toml
[[cells]]
name = "hello-world.bc"
enable_type_id = false

  [cells.location]
  file = "D:\\CKBuilders\\hello-world-demo\\dist\\hello-world.bc"

[lock]
code_hash = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
args = "0x4118c8c16749bf126b22468d030bf9de7da3717b"
hash_type = "type"
```

## Kết quả cuối cùng

- ✅ OffCKB chạy được local (devnet node + RPC proxy).
- ✅ Tài khoản test devnet xem được qua `offckb accounts`.
- ✅ Project contract mẫu `hello-world` được tạo, build và **deploy thành công** lên devnet.
- 📸 Screenshot xác nhận: chạy lại lệnh deploy (hoặc `offckb accounts` / `pnpm run build`) trực tiếp trong VSCode Terminal của máy để có ảnh chụp gửi cho quản lý.

## Tham khảo

- [Quick Start — docs.nervos.org](https://docs.nervos.org/docs/getting-started/quick-start)
- [OffCKB devtool docs](https://docs.nervos.org/docs/sdk-and-devtool/offckb)
- [offckb CLI trên GitHub](https://github.com/ckb-devrel/offckb)
