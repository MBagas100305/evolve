# EVOLVE — RES NEXUS Dashboard

Dashboard web (Next.js 15 + React 19) untuk ide **EVOLVE (Electric Vehicle Operations, Lifecycle & Value Ecosystem)** — tim Jawara Consulting, NRECS 2026. RES NEXUS menggabungkan empat pilar strategi PT RES ke dalam satu platform pendukung keputusan.

## Halaman

| Halaman | Path | Isi |
|---|---|---|
| Overview | `/` | Rencana scale-up 500 → 10.000 unit, hasil pilot, hal yang perlu diputuskan, pilar strategi |
| Energy control | `/energy` | Kurva beban charging (tanpa/dengan RES SmartCharge, dikurangi RES SolarHub), simulasi ukuran armada, status tiap terminal |
| Battery lifecycle | `/battery` | Battery Health Passport, distribusi SoH, tahap first life → assessment → RES RePower → RES ReCycle |
| Route economics | `/routes` | Route Investment Pool: skor rute dengan bobot yang bisa diubah, urutan investasi per fase |
| Driver income | `/drivers` | Simulator sewa baterai (RES Income Shield), Route Protection Fund, pendapatan per rute |
| Financial projection | `/finance` | Tabel investasi (Appendix 4), asumsi yang bisa diedit, NPV, IRR, payback, skenario low/base/high |

## Menjalankan di lokal

Butuh Node.js 18.18 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

Untuk mencoba versi produksi: `npm run build` lalu `npm start`.

## Deploy ke Vercel

1. Push folder ini ke repository GitHub.
2. Di vercel.com pilih **Add New → Project**, import repository tersebut.
3. Vercel mengenali Next.js secara otomatis. Tidak ada environment variable yang perlu diisi. Klik **Deploy**.

Atau lewat CLI: `npm i -g vercel` lalu jalankan `vercel` di folder ini.

## Data

Semua data ada di `lib/data.js`.

- **Dari business case:** 500 unit pilot, target 10.000 unit dalam 36 bulan, biaya operasional −35%, emisi −42%, batas pendapatan bersih pengemudi Rp100.000/hari.
- **Ilustratif (data demo):** rute, terminal, profil beban, kondisi baterai, tahapan fase, serta seluruh asumsi biaya dan tarif. Ganti dengan angka riset tim sebelum dipresentasikan. Nilai default asumsi finansial ada di `defaultAssumptions`.

Rumus finansial ada di `lib/finance.js`:

- `Maximum Rental Fee = Daily Driver Revenue − Operating Costs − Rp100,000`
- Minimum fee PT RES = anuitas biaya baterai per kendaraan (pada discount rate) dikurangi nilai circular recovery, ditambah biaya operasi baterai per hari
- Arus kas hanya menghitung 9.500 unit tambahan; CAPEX dicairkan per fase sesuai jumlah unit yang ditambah

## Struktur

```
app/          halaman (App Router) dan globals.css
components/   Sidebar, grafik SVG, komponen UI, state asumsi bersama
lib/          data, rumus finansial, format angka
public/       logo EVOLVE
```

Grafik dibuat dengan SVG tanpa library tambahan, jadi dependensinya hanya `next`, `react`, dan `react-dom`.
