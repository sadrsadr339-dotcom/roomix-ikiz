// ROOMIX A · dijital ikiz (4 Kasım planı): senaryo, simülasyon, tahmin ve kutu hattı planlayıcısı. Çizimden bağımsız.
// Bütün değerler simüle edilmiş ya da varsayımdır; canlı sensör yoktur. Zaman t = gece yarısından itibaren dakika.
// Ölçüler cm, Desktop/4_11_MODULE1_PLANLAR.dwg'den (u = koridor dış yüzünden en, s = yatak ucu dış yüzünden boy).
// Metinler iki dilli: L(tr, en) → { tr, en }; arayüz seçili dile göre okur (G.IKIZ.d).
(function (G) {
  "use strict";

  // ------------------------------------------------------------------ yardımcılar
  const hm = (x) => { const [h, m] = x.split(":").map(Number); return h * 60 + m; };
  const saat = (t) => {
    t = ((t % 1440) + 1440) % 1440;
    const h = Math.floor(t / 60), m = Math.floor(t % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const yumusak = (k) => k * k * (3 - 2 * k);
  const L = (tr, en) => ({ tr, en });
  const d = (x) => (x && typeof x === "object" && "tr" in x ? (G.IKIZ_DIL === "en" ? x.en : x.tr) : x);
  function rnd(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ------------------------------------------------------------------ ölçüler (DWG 4 Kasım + Rhino modeli 5 Kasım)
  const OLCU = {
    W: 380, L: 1220, H: 270, DUVAR: 20,
    U1: { k: 44.1, s: 304.2 },                                    // yataklı dolap (alt yüzünden tek kişilik yatak)
    U2: { k: 45.3, ust: 348.5, alt: 484.9 },                      // gardırop: alt durakta U1 ile arası 2. yatak odası
    U3: { k: 30, ust: 738.4, alt: 895 },                          // TV + yemek masası: üst durakta yemek odası açılır
    yatak: { u0: 106.5, u1: 329, s0: 91.2, s1: 237.2, yukari: 232, asagi: 26 },
    koltuk: { u0: 126.5, u1: 356.5, s0: 560.7, s1: 619.8, yukari: 232, asagi: 24 },
    tavanAlt: 232, motor: 264, kutuH: 32,
    kapi: { u0: 22.6, u1: 114.6, h: 241 },
    // 3 x 2 katlanır panjur (yatak ucu tam cam önünde); alt sıra aşağı (denizlik), üst sıra yukarı (saçak)
    panjur: { seritler: [[20, 133.33], [133.33, 246.67], [246.67, 360]], alt: [40, 127.5], ust: [132.5, 268] },
    // pencereler (5 Kas: birimlerin park yerleri arasına; ikisi de s 460 eksenine simetrik)
    pencere: { KOR: [[40.5, 280.5], [388, 532], [639.5, 879.5]], KAR: [[95.6, 145.6], [185.6, 235.6], [434.5, 484.5], [683.4, 733.4], [773.4, 823.4]] },
    perde: { u0: 20, u1: 103.6, s0: 303.35, r: 18.4, s1: 528 },
    // kutu hattı: makas J; S istasyon (kör hat, doğuya), B bekleme hattı (kuzeye, 5 Kas eklendi), A ana hat (güneye)
    hat: {
      J: { u: 71.35, s: 545.2 },
      S: [153.5, 212.5, 271.5, 330.5],                 // u, makasa yakından uzağa (s = J.s)
      B: [515, 485, 455, 425, 395, 365],                // s, makasa yakından uzağa (u = J.u)
      A: [895, 925, 955, 985],                          // s, ana hatta geçici yer (makasa yakından uzağa)
      durak: { yemek: 857.2, giris: 964 },
      kutu: { w: 53, d: 24, h: 28 }, ust: 234.5, el: 95, istasyonInis: 118,
      hiz: 1800, inisHiz: 1500,                         // cm/dk (30 cm/sn yatay, 25 cm/sn düşey)
    },
    cepheAzimut: 225, enlem: 41.05,
  };

  // ------------------------------------------------------------------ tavan kutuları (Horror Vacui ızgarası; DWG plan 3)
  const TAVAN = [
    { id: "Y1", oda: "Y", u0: 56, u1: 100, s0: 40.7, s1: 84.7, ad: L("Yastık ve yorgan", "Pillows and duvet"), inis: 128 },
    { id: "Y2", oda: "Y", u0: 106, u1: 216.3, s0: 40.7, s1: 84.7, ad: L("Mevsimlik giysi", "Off-season clothes"), inis: 118 },
    { id: "Y3", oda: "Y", u0: 222.3, u1: 329.5, s0: 40.7, s1: 84.7, ad: L("Bavul", "Suitcase"), inis: 128 },
    { id: "Y4", oda: "Y", u0: 56, u1: 100, s0: 90.7, s1: 237.7, ad: L("Kitaplık ve bitkiler (açık raf)", "Books and plants (open shelf)"), inis: 75, tur: "raf" },
    { id: "Y5", oda: "Y", u0: 56, u1: 100, s0: 243.7, s1: 287.7, ad: L("Ayakkabı", "Shoes"), inis: 104 },
    { id: "Y6", oda: "Y", u0: 106, u1: 216.3, s0: 243.7, s1: 287.7, ad: L("Hobi malzemesi", "Hobby supplies"), inis: 94 },
    { id: "Y7", oda: "Y", u0: 222.3, u1: 329.5, s0: 243.7, s1: 287.7, ad: L("Arşiv ve yazıcı", "Files and printer"), inis: 104 },
    { id: "S1", oda: "S", u0: 126, u1: 200, s0: 623.3, s1: 657.3, ad: L("Kutu oyunları", "Board games"), inis: 150 },
    { id: "S2", oda: "S", u0: 206, u1: 297.6, s0: 623.3, s1: 657.3, ad: L("Misafir yatak takımı", "Guest bedding"), inis: 110 },
    { id: "S3", oda: "S", u0: 303.6, u1: 357, s0: 623.3, s1: 657.3, ad: L("Projektör ve hoparlör", "Projector and speaker"), inis: 150 },
    { id: "S4", oda: "S", u0: 126, u1: 200, s0: 663.3, s1: 735.3, ad: L("Yoga matları", "Yoga mats"), inis: 60 },
    { id: "S5", oda: "S", u0: 206, u1: 248.8, s0: 663.3, s1: 735.3, ad: L("Bitki ve hobi rafı", "Plants and hobby shelf"), inis: 98 },
    { id: "S6", oda: "S", u0: 254.8, u1: 297.6, s0: 663.3, s1: 735.3, ad: L("Ütü ve temizlik", "Ironing and cleaning"), inis: 108 },
    { id: "S7", oda: "S", u0: 303.6, u1: 357, s0: 663.3, s1: 735.3, ad: L("Spor (dambıl)", "Sport (dumbbells)"), inis: 30, tur: "spor" },
  ];
  // kutu hattı kutuları (istasyon)
  const KUTULAR = [
    { id: "KH1", ad: L("Anahtar, çanta, şemsiye", "Keys, bag, umbrella"), renk: "#7A1F2B" },
    { id: "KH2", ad: L("Market ve kargo", "Groceries and parcels"), renk: "#C08A3E" },
    { id: "KH3", ad: L("Temizlik", "Cleaning"), renk: "#3D5A80" },
    { id: "KH4", ad: L("Çamaşır", "Laundry"), renk: "#8E6C8A" },
    { id: "KH5", ad: L("Alet çantası", "Tool case"), renk: "#5B6B3A" },
    { id: "KH6", ad: L("Kiler (kahvaltılık)", "Pantry (breakfast)"), renk: "#B9824A" },
    { id: "KH7", ad: L("Ayakkabı ve spor çantası", "Shoes and gym bag"), renk: "#2F5D62" },
  ];

  // ------------------------------------------------------------------ mevsimler
  const MEVSIM = {
    yaz: { kod: "yaz", ad: L("Yaz günü · 14 Temmuz (Salı)", "Summer day · 14 July (Tuesday)"), gun: 195, dMin: 22, dMinT: hm("05:30"), dMax: 32.5, dMaxT: hm("15:30"),
      bulut: 0.08, isitma: false, gunDogumu: "05:43", gunBatimi: "20:33" },
    guz: { kod: "guz", ad: L("Güz günü · 3 Kasım (Salı)", "Autumn day · 3 November (Tuesday)"), gun: 307, dMin: 7, dMinT: hm("06:30"), dMax: 13, dMaxT: hm("14:30"),
      bulut: 0.45, isitma: true, gunDogumu: "07:42", gunBatimi: "18:10" },
  };
  function disSicaklik(m, t) {
    const a = m.dMinT, b = m.dMaxT, sonraki = m.dMinT + 1440;
    const x = t < a ? t + 1440 : t;
    if (x <= b && x >= a) return lerp(m.dMin, m.dMax, (1 - Math.cos(Math.PI * (x - a) / (b - a))) / 2);
    return lerp(m.dMax, m.dMin, (1 - Math.cos(Math.PI * (x - b) / (sonraki - b))) / 2);
  }
  function gunes(m, t) {
    const n = m.gun;
    const dek = 23.44 * Math.sin((2 * Math.PI * (284 + n)) / 365) * Math.PI / 180;
    const B = (2 * Math.PI * (n - 81)) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const gunesSaati = (t + 4 * (28.9 - 45) + eot) / 60;
    const Hh = (15 * (gunesSaati - 12)) * Math.PI / 180;
    const fi = OLCU.enlem * Math.PI / 180;
    const sinYuk = Math.sin(fi) * Math.sin(dek) + Math.cos(fi) * Math.cos(dek) * Math.cos(Hh);
    const yuk = Math.asin(clamp(sinYuk, -1, 1));
    let az = Math.atan2(Math.sin(Hh), Math.cos(Hh) * Math.sin(fi) - Math.tan(dek) * Math.cos(fi));
    az = (az * 180 / Math.PI + 180 + 360) % 360;
    return { yukseklik: yuk * 180 / Math.PI, azimut: az };
  }
  function cepheIsinim(m, t) {
    const g = gunes(m, t);
    if (g.yukseklik <= 0.5) return { dogrudan: 0, toplam: 0, gelis: 90, g };
    const am = 1 / Math.sin(g.yukseklik * Math.PI / 180);
    const dni = 1353 * Math.pow(0.7, Math.pow(am, 0.678)) * (1 - 0.75 * m.bulut);
    const fark = (g.azimut - OLCU.cepheAzimut) * Math.PI / 180;
    const cosGelis = Math.cos(g.yukseklik * Math.PI / 180) * Math.cos(fark);
    const dogrudan = Math.max(0, dni * cosGelis);
    const yaygin = 0.5 * (0.12 * dni * Math.sin(g.yukseklik * Math.PI / 180) + 60 * m.bulut);
    return { dogrudan, toplam: dogrudan + yaygin, gelis: Math.acos(clamp(cosGelis, -1, 1)) * 180 / Math.PI, g };
  }

  // ------------------------------------------------------------------ eylem çizelgesi (t'ye bağlı saf fonksiyon)
  // sosyal: komşuluk sinyali 0 "kapım açık" · 1 "evdeyim, sakinim" · 2 "rahatsız etmeyin / evde değilim" (bilerek belirsiz)
  // led: panjur alt kirişindeki gece ışık çizgisi (kapalı panjur + ışık = "evdeyim, uğrayabilirsin")
  const AKTUATOR_ILK = {
    yatak: 1, U2: OLCU.U2.ust, U3: OLCU.U3.alt, misafirYatak: 0, masaA: 0, masaB: 0, calisma: 0, koltuk: 0, perde: 1,
    dolapKapak: 0, kanat: 0.6, tvAcik: 0, isik: 0, isikRenk: 0, sosyal: 2, led: 0,
    k0: 0, k1: 0, k2: 0, k3: 0, k4: 0, k5: 0,
  };
  TAVAN.forEach((k) => (AKTUATOR_ILK["tk" + k.id] = 0));

  function Cizelge() { this.e = []; }
  Cizelge.prototype.ekle = function (ad, t0, sure, hedef) { this.e.push({ ad, t0, sure: Math.max(sure, 0.01), hedef }); return this; };
  Cizelge.prototype.panjur = function (t0, sure, alt, ust, ayri) {
    const a = Array.isArray(alt) ? alt : [alt, alt, alt], u = Array.isArray(ust) ? ust : [ust, ust, ust];
    for (let i = 0; i < 3; i++) {
      const gecik = ayri ? i * 0.35 : 0;
      if (a[i] !== null) this.ekle("k" + i, t0 + gecik, sure, a[i]);
      if (u[i] !== null) this.ekle("k" + (i + 3), t0 + gecik, sure, u[i]);
    }
    return this;
  };
  Cizelge.prototype.deger = function (ad, t) {
    let v = AKTUATOR_ILK[ad], once = v;
    const list = this.sirali[ad] || [];
    for (const e of list) {
      if (t < e.t0) break;
      if (t >= e.t0 + e.sure) { v = e.hedef; once = v; continue; }
      return lerp(once, e.hedef, yumusak((t - e.t0) / e.sure));
    }
    return v;
  };
  Cizelge.prototype.hareketli = function (ad, t) { return (this.sirali[ad] || []).some((e) => t >= e.t0 && t < e.t0 + e.sure); };
  Cizelge.prototype.bitir = function () {
    this.sirali = {};
    for (const e of this.e) (this.sirali[e.ad] = this.sirali[e.ad] || []).push(e);
    for (const k in this.sirali) this.sirali[k].sort((a, b) => a.t0 - b.t0);
    return this;
  };

  // ------------------------------------------------------------------ kişiler: yerler ve koridor üstünden rotalar
  const YER = {
    yatak: { u: 217, s: 165, ad: L("yatak", "bed") },
    calisma: { u: 205, s: 165, ad: L("çalışma masası", "desk") },
    hol1: { u: 70, s: 292, ad: L("koridor", "hall") },
    hol2: { u: 70, s: 470, ad: L("koridor", "hall") },
    hol3: { u: 70, s: 700, ad: L("koridor", "hall") },
    hol4: { u: 70, s: 905, ad: L("koridor", "hall") },
    hol5: { u: 70, s: 1065, ad: L("koridor", "hall") },
    banyo: { u: 247, s: 1128, ad: L("banyo", "bathroom") },
    tezgah: { u: 262, s: 902, ad: L("mutfak tezgâhı", "kitchen counter") },
    masa: { u: 135, s: 791, ad: L("yemek masası", "dining table") },
    koltuk: { u: 172, s: 598, ad: L("koltuk", "sofa") },
    giris: { u: 68, s: 1162, ad: L("giriş", "entrance") },
    disari: { u: 68, s: 1300, ad: L("dışarıda", "outside") },
    mat1: { u: 205, s: 512, ad: L("yoga matı", "yoga mat") },
    mat2: { u: 225, s: 640, ad: L("yoga matı", "yoga mat") },
    misafirYatak: { u: 258, s: 388, ad: L("2. yatak odası", "second bedroom") },
    misafirKoltuk: { u: 300, s: 598, ad: L("koltuk", "sofa") },
  };
  const ROTA = {
    "yatak>banyo": ["yatak", "hol1", "hol2", "hol3", "hol4", "hol5", "banyo"],
    "banyo>tezgah": ["banyo", "hol5", "hol4", "tezgah"],
    "tezgah>masa": ["tezgah", "masa"],
    "masa>koltuk": ["masa", "hol3", "koltuk"],
    "koltuk>giris": ["koltuk", "hol3", "hol4", "hol5", "giris"],
    "giris>disari": ["giris", "disari"],
    "disari>giris": ["disari", "giris"],
    "giris>calisma": ["giris", "hol5", "hol4", "hol3", "hol2", "hol1", "calisma"],
    "calisma>mat1": ["calisma", "hol1", "hol2", "mat1"],
    "mat1>koltuk": ["mat1", "hol2", "hol3", "koltuk"],
    "koltuk>banyo": ["koltuk", "hol3", "hol4", "hol5", "banyo"],
    "banyo>yatak": ["banyo", "hol5", "hol4", "hol3", "hol2", "hol1", "yatak"],
    "disari>mat2": ["disari", "giris", "hol5", "hol4", "hol3", "mat2"],
    "mat2>disari": ["mat2", "hol3", "hol4", "hol5", "giris", "disari"],
    "disari>misafirKoltuk": ["disari", "giris", "hol5", "hol4", "hol3", "misafirKoltuk"],
    "misafirKoltuk>misafirYatak": ["misafirKoltuk", "hol3", "hol2", "misafirYatak"],
  };
  const YURUME_HIZI = 110 * 60, ADIM = 58;
  function egri(noktalar) {
    const P = noktalar.map((k) => [YER[k].u, YER[k].s]);
    const out = [P[0]];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 4));
      for (let j = 1; j <= n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((e) => 0.5 * (2 * p1[e] + (-p0[e] + p2[e]) * t + (2 * p0[e] - 5 * p1[e] + 4 * p2[e] - p3[e]) * t2 + (-p0[e] + 3 * p1[e] - 3 * p2[e] + p3[e]) * t3)));
      }
    }
    const kum = [0];
    for (let i = 1; i < out.length; i++) kum.push(kum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    return { pts: out, kum, L: kum[kum.length - 1] };
  }
  function egriNokta(e, dd) {
    dd = clamp(dd, 0, e.L);
    let lo = 0, hi = e.kum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (e.kum[m] < dd) lo = m; else hi = m; }
    const k = e.kum[hi] > e.kum[lo] ? (dd - e.kum[lo]) / (e.kum[hi] - e.kum[lo]) : 0;
    const a = e.pts[lo], b = e.pts[hi];
    return { u: lerp(a[0], b[0], k), s: lerp(a[1], b[1], k), yon: Math.atan2(b[0] - a[0], b[1] - a[1]) };
  }
  function profil(k, Lx) {
    const a = clamp(60 / Math.max(Lx, 1), 0.05, 0.35), v = 1 / (1 - a);
    if (k <= a) return (v * k * k) / (2 * a);
    if (k >= 1 - a) return 1 - (v * (1 - k) * (1 - k)) / (2 * a);
    return v * (k - a / 2);
  }
  function KisiYolu(ilk) { this.h = [{ t: 0, yer: ilk, rota: null, yon: 0 }]; }
  KisiYolu.prototype.git = function (t, hedef) {
    const once = this.h[this.h.length - 1];
    const r = ROTA[once.yer + ">" + hedef] || [once.yer, hedef];
    const e = egri(r);
    const sure = Math.max(0.05, e.L / YURUME_HIZI);
    this.h.push({ t, yer: hedef, rota: r, sure, e, yon: egriNokta(e, e.L).yon });
    return this;
  };
  KisiYolu.prototype._son = function (t) { let son = this.h[0]; for (const a of this.h) { if (a.t <= t) son = a; else break; } return son; };
  KisiYolu.prototype.konum = function (t) {
    const son = this._son(t);
    if (son.e && t < son.t + son.sure) {
      const p = egriNokta(son.e, profil((t - son.t) / son.sure, son.e.L) * son.e.L);
      return { u: p.u, s: p.s, yon: p.yon, yer: son.yer, yuruyor: true };
    }
    const p = YER[son.yer];
    return { u: p.u, s: p.s, yon: son.yon, yer: son.yer, yuruyor: false };
  };
  KisiYolu.prototype.izler = function (t) {
    const son = this._son(t);
    if (!son.e) return [];
    const gecen = t - son.t, solma = 0.2;
    if (gecen < 0 || gecen > son.sure + solma) return [];
    const dd = gecen >= son.sure ? son.e.L : profil(gecen / son.sure, son.e.L) * son.e.L;
    const sonra = gecen > son.sure ? 1 - (gecen - son.sure) / solma : 1;
    const out = [], n = Math.floor(dd / ADIM);
    for (let i = n; i >= 1 && out.length < 14; i--) {
      const p = egriNokta(son.e, i * ADIM), yan = i % 2 ? 7 : -7, yas = (n - i) / 14;
      out.push({ u: p.u + Math.cos(p.yon) * yan, s: p.s - Math.sin(p.yon) * yan, yon: p.yon, alfa: clamp((1 - yas) * sonra, 0, 1) });
    }
    return out;
  };
  KisiYolu.prototype.yuruyusler = function () { return this.h.filter((x) => x.e).map((x) => ({ a: x.t, b: x.t + x.sure, tur: "yuruyus", uz: x.e.L })); };
  KisiYolu.prototype.evde = function (t) { const k = this.konum(t); return k.yer !== "disari" || k.yuruyor; };

  // ------------------------------------------------------------------ Sistem 3: kutu hattı planlayıcısı
  // Ray ağı tek makaslı üç koldur; kutular birbirinin İÇİNDEN GEÇEMEZ. Her kol bir yığın gibi davranır (makasa en yakın
  // kutu en üstte). Kullanıcının istasyonu (S) tek başına sıralamayı değiştiremez (öndeki kutular hep önde kalır);
  // 5 Kas: makasın kuzeyine eklenen kısa bekleme hattı (B) ile her sıra elde edilir (demiryolu manevra düzeni).
  // Ana hat (A) teslim yoludur; kısa süreli tampon olarak da kullanılabilir (yemek durağının arkası).
  const KAP = { S: 4, B: 6, A: 4 };
  const durumAnahtar = (st) => st.S.join(",") + "|" + st.B.join(",") + "|" + st.A.join(",");
  const kopya = (st) => ({ S: st.S.slice(), B: st.B.slice(), A: st.A.slice() });
  const BFS_ONBELLEK = new Map();
  function bfsOnbellekli(bas, hedefAd, hedefMi, enCok) {
    const k = durumAnahtar(bas) + "→" + hedefAd;
    if (!BFS_ONBELLEK.has(k)) BFS_ONBELLEK.set(k, bfs(bas, hedefMi, enCok));
    const y = BFS_ONBELLEK.get(k);
    return y ? y.map((h) => ({ ...h })) : null;
  }
  function bfs(bas, hedefMi, enCok = 14) {
    const once = new Map(); const k0 = durumAnahtar(bas); once.set(k0, null);
    let kuyruk = [bas], derin = 0;
    if (hedefMi(bas)) return [];
    while (kuyruk.length && derin < enCok) {
      const yeni = [];
      for (const st of kuyruk) {
        for (const x of ["S", "B", "A"]) {
          if (!st[x].length) continue;
          for (const y of ["S", "B", "A"]) {
            if (x === y || st[y].length >= KAP[y]) continue;
            const n = kopya(st); const id = n[x].pop(); n[y].push(id);
            const k = durumAnahtar(n);
            if (once.has(k)) continue;
            once.set(k, { onceki: durumAnahtar(st), hamle: { id, x, y }, st: n });
            if (hedefMi(n)) {
              const yol = []; let kk = k;
              while (once.get(kk)) { const o = once.get(kk); yol.push(o.hamle); kk = o.onceki; }
              return yol.reverse();
            }
            yeni.push(n);
          }
        }
      }
      kuyruk = yeni; derin++;
    }
    return null;
  }
  // kolda yığın indisi → konum (u, s); yığın derinden üste dizili, derin uç kapasitenin son yuvası
  function yuvaKonum(kol, i, n) {
    const H = OLCU.hat, yuva = KAP[kol] - 1 - i;
    if (kol === "S") return { u: H.S[yuva], s: H.J.s };
    if (kol === "B") return { u: H.J.u, s: H.B[yuva] };
    return { u: H.J.u, s: H.A[yuva] };
  }
  function HatPlani(bas) {
    this.durum = kopya(bas); this.t = 0; this.olay = []; this.anlik = [{ t: -1, st: kopya(bas), teslim: {} }]; this.hamleSay = 0;
    this.teslim = {};   // kutu id -> { durak, s } (ana hatta teslimde)
  }
  // bir hamleyi zamanla: kutu bulunduğu yerden makasa, makastan hedef kolun üstüne
  HatPlani.prototype._hamle = function (h, t0, durak) {
    const H = OLCU.hat, st = this.durum;
    const kaynakI = st[h.x].length - 1;
    const a = this.teslim[h.id] ? { u: H.J.u, s: this.teslim[h.id].s } : yuvaKonum(h.x, kaynakI);
    st[h.x].pop(); st[h.y].push(h.id);
    delete this.teslim[h.id];
    const b = durak ? { u: H.J.u, s: H.durak[durak] } : yuvaKonum(h.y, st[h.y].length - 1);
    if (durak) this.teslim[h.id] = { durak, s: H.durak[durak] };
    const d1 = Math.hypot(a.u - H.J.u, a.s - H.J.s), d2 = Math.hypot(b.u - H.J.u, b.s - H.J.s);
    const t1 = t0 + d1 / H.hiz, t2 = t1 + 0.025, t3 = t2 + d2 / H.hiz;
    this.olay.push({ id: h.id, t0, t1: t3, yol: [[a.u, a.s, t0], [H.J.u, H.J.s, t1], [H.J.u, H.J.s, t2], [b.u, b.s, t3]], tur: "hamle" });
    this.hamleSay++;
    this.anlik.push({ t: t3, st: kopya(st), teslim: JSON.parse(JSON.stringify(this.teslim)) });
    return t3;
  };
  // kutuyu ana hattaki durağa getir (gerekirse manevra), indir, bekle, kaldır, istasyona geri koy
  HatPlani.prototype.teslimEt = function (id, t, durak, bekle) {
    const H = OLCU.hat, sD = H.durak[durak];
    const hedefMi = (st) => st.A.length > 0 && st.A[st.A.length - 1] === id && (durak === "giris" ? st.A.length === 1 : true);
    const yol = bfsOnbellekli(this.durum, "teslim:" + id + ":" + durak, hedefMi, 14) || [];
    let tt = Math.max(t, this.t);
    yol.forEach((h, i) => {
      const sonHamle = i === yol.length - 1 && h.id === id && h.y === "A";
      tt = this._hamle(h, tt, sonHamle ? durak : null);
    });
    if (!this.teslim[id]) {                                    // kutu zaten ana hattaydı: yuvasından durağa kayar
      const i = this.durum.A.indexOf(id), a = yuvaKonum("A", i);
      const t1 = tt + Math.abs(a.s - sD) / H.hiz;
      this.olay.push({ id, t0: tt, t1, yol: [[a.u, a.s, tt], [H.J.u, sD, t1]], tur: "hamle" });
      this.teslim[id] = { durak, s: sD };
      this.anlik.push({ t: t1, st: kopya(this.durum), teslim: JSON.parse(JSON.stringify(this.teslim)) });
      tt = t1;
    }
    const t3 = tt, inis = (H.ust - H.el) / H.inisHiz;
    const t4 = t3 + inis, t5 = t4 + bekle, t6 = t5 + inis;
    this.olay.push({ id, t0: t3, t1: t6, tur: "inis", inis: [t3, t4, t5, t6], z: H.el, durak });
    // dönüş: ana hat boşalır (istenen kutu ve tampondakiler istasyona / bekleme hattına)
    const donus = bfsOnbellekli(this.durum, "bosalt", (st) => st.A.length === 0, 10) || [];
    let t7 = t6;
    for (const h of donus) t7 = this._hamle(h, t7);
    this.t = t7;
    return { gelis: t3, hazir: t4, bitis: t7, manevra: Math.max(0, yol.length - 1), donus: donus.length };
  };
  // gece dizilimi: hedef sıraya manevra
  HatPlani.prototype.diz = function (t, hedef) {
    const anahtar = durumAnahtar(hedef);
    const yol = bfsOnbellekli(this.durum, "diz:" + anahtar, (st) => durumAnahtar(st) === anahtar, 16) || [];
    let tt = Math.max(t, this.t);
    for (const h of yol) tt = this._hamle(h, tt);
    this.t = tt;
    return { hamle: yol.length, bitis: tt };
  };
  HatPlani.prototype.konum = function (id, t) {
    const H = OLCU.hat;
    for (const o of this.olay) {
      if (o.id !== id || t < o.t0 || t >= o.t1) continue;
      if (o.tur === "inis") {
        const [a, b, c, e] = o.inis;
        const k = t < b ? yumusak((t - a) / (b - a)) : t < c ? 1 : 1 - yumusak((t - c) / (e - c));
        return { u: H.J.u, s: H.durak[o.durak], z: lerp(H.ust, o.z, k), in: k, hareket: t < b || t >= c, durak: o.durak };
      }
      const y = o.yol;
      for (let i = 0; i < y.length - 1; i++) {
        if (t >= y[i][2] && t < y[i + 1][2]) {
          const k = (t - y[i][2]) / Math.max(1e-6, y[i + 1][2] - y[i][2]);
          return { u: lerp(y[i][0], y[i + 1][0], k), s: lerp(y[i][1], y[i + 1][1], k), z: H.ust, in: 0, hareket: true, makas: i === 1 };
        }
      }
    }
    // duran kutu: o andaki dizilim
    let an = this.anlik[0];
    for (const x of this.anlik) { if (x.t <= t) an = x; else break; }
    if (an.teslim[id]) return { u: H.J.u, s: an.teslim[id].s, z: H.ust, in: 0, hareket: false, kol: "A" };
    for (const kol of ["S", "B", "A"]) {
      const i = an.st[kol].indexOf(id);
      if (i >= 0) { const p = yuvaKonum(kol, i); return { u: p.u, s: p.s, z: H.ust, in: 0, hareket: false, kol }; }
    }
    return { u: H.J.u, s: H.J.s, z: H.ust, in: 0, hareket: false };
  };
  HatPlani.prototype.dizilim = function (t) {
    let an = this.anlik[0];
    for (const x of this.anlik) { if (x.t <= t) an = x; else break; }
    return an.st;
  };

  // 4 haftalık simüle kutu kaydı → saat × kutu olasılığı (Ö3)
  function kullanimTablosu(mevsimKod) {
    const R = rnd(42 + (mevsimKod === "guz" ? 7 : 0));
    const tablo = {}; KUTULAR.forEach((k) => (tablo[k.id] = new Array(24).fill(0)));
    const ekle = (id, h, p) => { if (R() < p) tablo[id][h] += 1; };
    for (let gun = 0; gun < 28; gun++) {
      const hg = gun % 7, hafta = hg < 5;
      if (hafta) { ekle("KH1", 7, 0.95); ekle("KH6", 7, 0.85); ekle("KH7", 18, 0.8); }
      else { ekle("KH1", 11, 0.7); ekle("KH6", 10, 0.7); ekle("KH5", 11, 0.2); }
      if (hg === 1 || hg === 3) ekle("KH7", 7, 0.6);
      ekle("KH2", 18, 0.35); ekle("KH3", 10, hg === 5 ? 0.8 : 0.05); ekle("KH4", 20, hg === 6 ? 0.8 : 0.1);
    }
    for (const id in tablo) tablo[id] = tablo[id].map((n) => n / 28);
    return tablo;
  }

  // ------------------------------------------------------------------ ısıl model (tek düğüm, varsayım katsayılar)
  const ISIL = { tau: 22, tauKapali: 30, kG: 2.4, kI: 0.18, tauH: 0.55, isitmaGuc: 2.4, konfor: 26, setEvde: 21, setYok: 17, setUyku: 19 };
  function gecirgenlik(p) {
    let top = 0;
    p.forEach((v, i) => { const alan = i < 3 ? 0.9 : 1.4; top += alan * (0.16 + 0.84 * Math.pow(v, 1.3)); });
    return top / (3 * 0.9 + 3 * 1.4);
  }

  // ------------------------------------------------------------------ GÜNÜN SENARYOSU
  // olaylar: { misafir, firtina, kesinti, tatil }; elle: arayüzden sakin komutları
  function kur(mevsimKod = "yaz", olaylar = {}, elle = []) {
    const M = MEVSIM[mevsimKod];
    const C = new Cizelge();
    const tatil = !!olaylar.tatil;
    const P = new KisiYolu(tatil ? "disari" : "yatak");
    const komsuP = new KisiYolu("disari");
    const misafirP = new KisiYolu("disari");
    const kayit = [], an = [];
    const yaz = M.kod === "yaz";
    const K = (t, x, ek = {}) => kayit.push({ t, ...x, ...ek });
    const tk = (id, t, sure, hedef) => C.ekle("tk" + id, t, sure, hedef);

    // --- kutu hattı: dünkü dizilim (sabah kutuları dipte) → 03:00 gece dizilimi (Ö3) → gün içi teslimler
    const hatBas = { S: ["KH6", "KH1", "KH3", "KH7"], B: ["KH5", "KH4", "KH2"], A: [] };
    const hat = new HatPlani(hatBas);
    const tablo = kullanimTablosu(M.kod);
    const hatOlay = [];
    // planlı hat işlemleri kaydedilir: sakin gün içinde kutu çağırırsa hepsi saat sırasıyla yeniden oynatılır (bitir)
    const planOps = [];
    const teslim = (id, t, durak, bekle) => { planOps.push({ tur: "teslim", id, t, durak, bekle }); return hat.teslimEt(id, t, durak, bekle); };
    const diz = (t, hedef) => { planOps.push({ tur: "diz", t, hedef }); return hat.diz(t, hedef); };

    if (tatil) return tatilGunu(M, C, P, komsuP, misafirP, kayit, an, hat, tablo, olaylar, elle, hatBas);

    // gece başlangıcı: yatak inik, U2 üstte (2. oda yok), U3 altta (mutfak kapalı), perde kapalı, panjur kapalı
    C.ekle("kanat", 0, 0.1, yaz ? 0.6 : 0);

    // --- 03:00 gece dizilimi (Ö3): yarın en çok gerekecek kutular makasa en yakın
    const dizT = hm("03:00");
    an.push({ no: 1, t: dizT, ad: L("Gece: istasyon yarına göre dizilir", "Night: the station re-orders for tomorrow"), sistem: 3 });
    const hedefDiz = { S: ["KH3", "KH7", "KH2", "KH6"], B: ["KH5", "KH4", "KH1"], A: [] };
    const dz = diz(dizT, hedefDiz);
    K(dizT, {
      baslik: L("Kutu hattı yarına göre dizildi", "Box line re-ordered for tomorrow"),
      girdi: L("4 haftalık kutu kaydı (RFID + ağırlık) · yarının takvimi · hava tahmini", "4-week box log (RFID + weight) · tomorrow's calendar · weather forecast"),
      tahmin: L("Sabah önce kiler (07:12), sonra anahtar-çanta (07:44) gerekecek; ayakkabı ve spor çantası akşam", "Morning: pantry first (07:12), then keys and bag (07:44); shoes and gym bag in the evening"),
      tepki: L(`Makas manevrası: ${dz.hamle} hamle. Kiler istasyonun, anahtar-çanta bekleme hattının ucuna gelir; kutular birbirinin içinden geçmez`,
        `Shunting: ${dz.hamle} moves. Pantry to the head of the station, keys and bag to the head of the holding track; no box passes through another`),
      geri: L("Sakin bir şey fark etmez; sabah çağrıda manevra beklemesi olmaz", "The resident notices nothing; no shunting wait in the morning"),
    }, { sistem: 3, tur: "tahmin" });

    // --- 06:45 uyanmadan önce (Ö1)
    const uyan = hm("07:00");
    an.push({ no: 2, t: hm("06:45"), ad: L("Uyanmadan önce: ışıkla uyanma", "Before waking: wake with daylight"), sistem: 2 });
    K(hm("06:40"), {
      baslik: L("Uyanma saati öngörüldü", "Wake-up time predicted"),
      girdi: L("Takvim: ilk ders 09:30 · yol 35 dk · son 14 Salı'nın kalkış saatleri", "Calendar: first class 09:30 · 35 min commute · last 14 Tuesdays' wake-up times"),
      tahmin: L("Kalkış 07:00 (±6 dk, güven %86)", "Out of bed 07:00 (±6 min, 86 % confidence)"),
      tepki: L("06:45'ten itibaren üst sıra panjurlar 15 dk'da yavaşça açılır; alt sıra kapalı (mahremiyet)", "From 06:45 the upper shutter row opens over 15 min; lower row stays closed (privacy)"),
      geri: L("Yatak başı tuşu: ‘5 dk daha’", "Bedside key: ‘5 more minutes’"),
    }, { sistem: 2, tur: "tahmin" });
    C.panjur(hm("06:45"), 15, null, 1, true);

    // --- 07:00 uyanış → banyo; ikiz banyo süresinde mutfağı kurar (Ö1 + Ö3)
    an.push({ no: 3, t: uyan, ad: L("Uyanış → banyo; mutfak kurulur", "Up → bathroom; the kitchen sets itself"), sistem: 1 });
    C.ekle("kanat", uyan, 0.6, 1).ekle("isik", uyan, 1, 0.55).ekle("isikRenk", uyan, 1, 0.3);
    P.git(uyan + 1.2, "banyo");
    const banyoGir = uyan + 1.4;
    C.ekle("perde", uyan + 0.6, 1.2, 0);
    C.ekle("U3", banyoGir + 0.5, 1.6, OLCU.U3.ust);
    C.ekle("masaA", banyoGir + 2.3, 0.9, 1);
    const kiler = teslim("KH6", banyoGir + 1.0, "yemek", 26);
    hatOlay.push({ id: "KH6", ...kiler });
    K(banyoGir, {
      baslik: L("Banyoda → mutfak ve masa kuruluyor", "In the bathroom → kitchen and table set"),
      girdi: L("Banyo kapı kontağı + varlık: sakin banyoda · orta alan boş", "Bathroom door contact + presence: resident inside · middle zone empty"),
      tahmin: L("Banyo 11 dk (4 haftalık medyan) → 07:13'te mutfakta", "Bathroom 11 min (4-week median) → in the kitchen at 07:13"),
      tepki: L("U3 1,57 m yukarı kayar: mutfak ve yemek odası açılır, masanın TEK kanadı iner; kiler kutusu yemek durağına gelir (manevrasız: gece öne alınmıştı)",
        "U3 slides 1.57 m: kitchen and dining room open, ONE table leaf drops; the pantry box arrives at the dining stop (no shunting: moved forward overnight)"),
      geri: L("Hareket şeridinde biri belirirse birim durur; tezgâhtaki tuşla geri alınır", "A unit stops if someone enters its lane; undo from the counter key"),
    }, { sistem: 1, tur: "tahmin" });

    // --- 07:15 havalandırma biter → yatak tavana; panjur tam açık = "kapım açık"
    const yatakKalk = uyan + 15;
    C.ekle("kanat", yatakKalk, 0.8, yaz ? 0.15 : 0);
    C.ekle("yatak", yatakKalk + 0.4, 2.2, 0);
    C.panjur(hm("07:19"), 1.2, 1, null, true);
    C.ekle("sosyal", hm("07:19"), 0.05, 0);
    K(yatakKalk, {
      baslik: L("Havalandırma bitti → yatak tavana, panjur açık", "Airing done → bed to the ceiling, shutters open"),
      girdi: L("Zamanlayıcı 15 dk · CO₂ {CO2@07:15} ppm · yatak bölgesi boş", "Timer 15 min · CO₂ {CO2@07:15} ppm · bed zone empty"),
      tahmin: L("—", "—"),
      tepki: L("Kanat kapanır; yatak +0,26 → +2,32 (tavan ızgarasının yatak bölmesi). Alt sıra da açılır: komşu ‘kapım açık’ okur",
        "Sash closes; bed +0.26 → +2.32 (bed bay of the ceiling grid). Lower row opens too: the neighbour reads ‘my door is open’"),
      geri: L("Sakin istediği sinyali kapı yanındaki ikizden değiştirebilir", "The resident can change the signal from the entrance twin"),
    }, { sistem: 1, tur: "tepki" });

    // --- kahvaltı → koltuk
    P.git(uyan + 13.2, "tezgah");
    P.git(hm("07:20"), "masa");
    C.ekle("koltuk", hm("07:30"), 1.6, 1);
    P.git(hm("07:36"), "koltuk");
    an.push({ no: 4, t: hm("07:20"), ad: L("Kahvaltı → koltuk iner", "Breakfast → sofa comes down"), sistem: 1 });
    K(hm("07:30"), {
      baslik: L("Kahvaltı bitiyor → koltuk iniyor", "Breakfast ending → sofa descends"),
      girdi: L("Varlık: masada 10 dk · son 4 hafta: kahvaltı sonrası 8 dk oturma", "Presence: 10 min at the table · last 4 weeks: 8 min sitting after breakfast"),
      tahmin: L("07:36'da koltukta", "On the sofa at 07:36"),
      tepki: L("Tavandaki koltuk paketi iner: sırtlık kalkar, ayaklar açılır (30 cm paket → 82 cm koltuk)", "The ceiling sofa pack descends: backrest rises, legs unfold (30 cm pack → 82 cm sofa)"),
      geri: L("‘Bugün oturmayacağım’ → koltuk yukarıda kalır ve öğrenilir", "‘Not today’ → the sofa stays up and this is learned"),
    }, { sistem: 1, tur: "tahmin" });

    // --- çıkış kutusu (Ö3) + çıkış
    const cikisKutu = teslim("KH1", hm("07:43"), "giris", 10);
    hatOlay.push({ id: "KH1", ...cikisKutu });
    an.push({ no: 5, t: hm("07:43"), ad: L("Anahtar-çanta kutusu girişe iner", "Keys-and-bag box comes down at the door"), sistem: 3 });
    K(hm("07:43"), {
      baslik: L("Çıkış kutusu iniyor", "Leaving box comes down"),
      girdi: yaz ? L("Takvim: Salı 09:30 ders · 4 haftalık kayıt: Salı 07:40–07:50 anahtar-çanta %95", "Calendar: Tuesday 09:30 class · 4-week log: keys and bag 07:40–07:50 at 95 %")
        : L("Hava: 07:30–10:30 yağmur (%80) · kayıt: yağmurlu sabah şemsiye %90", "Weather: rain 07:30–10:30 (80 %) · log: umbrella on rainy mornings 90 %"),
      tahmin: L("Anahtar-çanta-şemsiye kutusu 07:45'te gerekecek", "Keys, bag, umbrella box needed at 07:45"),
      tepki: L(`Kutu bekleme hattından makasa, ana hattan giriş durağına; +0,95'e iner (manevra ${cikisKutu.manevra})`, `Box from the holding track via the switch to the entrance stop; lowered to +0.95 (shunting moves ${cikisKutu.manevra})`),
      geri: L("Sakin alır; kutu kendiliğinden yukarı çıkar ve istasyona döner", "The resident takes it; the box rises and returns"),
    }, { sistem: 3, tur: "tahmin" });
    P.git(hm("07:46"), "giris");
    const cikis = hm("07:55");
    P.git(cikis, "disari");

    // --- 07:55 boş ev: öngörülü panjur (Ö2) + birimler akşam düzenine
    an.push({ no: 6, t: cikis, ad: L("Boş ev → panjur güneşten önce", "Empty home → shutters close before the sun"), sistem: 2 });
    C.ekle("isik", cikis, 0.8, 0).ekle("kanat", cikis, 0.5, 0);
    C.ekle("koltuk", cikis + 1, 1.6, 0).ekle("masaA", cikis + 1, 0.9, 0);
    C.ekle("U3", cikis + 2.4, 1.6, OLCU.U3.alt);
    if (yaz) {
      K(cikis, {
        baslik: L("Boş ev → panjur ÖNCEDEN kapanır", "Empty home → shutters close AHEAD"),
        girdi: L("Kapı + telefon çeperi: ev boş, dönüş 18:00 · tahmin 32 °C açık gök · güneş cepheye 11:40–20:20", "Door + phone geofence: empty, back 18:00 · forecast 32 °C clear · sun on the façade 11:40–20:20"),
        tahmin: L("Açık kalırsa 16:30'da ≈ 31 °C; şimdi kapanırsa ≈ 26 °C (12 sa ileri simülasyon)", "Left open ≈ 31 °C at 16:30; closed now ≈ 26 °C (12 h look-ahead)"),
        tepki: L("6 panjur 07:58'de kapanır. Sinyal ‘kapalı’: komşu ‘evde değil ya da rahatsız etmeyin’ okur — bilerek belirsiz (güvenlik)",
          "6 shutters close at 07:58. Signal ‘closed’: the neighbour reads ‘away or do not disturb’ — deliberately ambiguous (security)"),
        geri: L("Telefon: ‘Ev 18:00'e kadar serin’ · [Açık bırak] seçilirse ikiz ısınmayı gösterir", "Phone: ‘Home kept cool until 18:00’ · [Leave open] shows the heat it causes"),
      }, { sistem: 2, tur: "tahmin" });
      C.panjur(cikis + 3, 1.6, 0, 0, true);
    } else {
      K(cikis, {
        baslik: L("Boş ev → kış: güneşi içeri al", "Empty home → winter: let the sun in"),
        girdi: L("Ev boş · yağmur 10:30'da biter, 12:30–16:40 güneş cephede · dış 7–13 °C", "Empty · rain ends 10:30, sun on the façade 12:30–16:40 · 7–13 °C outside"),
        tahmin: L("Açık panjur öğleden sonra evi ısıtmasız ≈ 21 °C'ye çıkarır", "Open shutters lift the home to ≈ 21 °C without heating"),
        tepki: L("Panjurlar gündüz AÇIK, 16:50'de kapanır (yalıtım katmanı). Sinyal yine ‘kapalı’ gösterir: açık panjur ‘evdeyim’ anlamına gelmesin",
          "Shutters stay OPEN by day, close at 16:50 (insulating layer). The signal still shows ‘closed’: open shutters must not mean ‘I'm home’"),
        geri: L("Telefon: ‘Isıtma 17:25'te başlayacak’", "Phone: ‘Heating restarts 17:25’"),
      }, { sistem: 2, tur: "tahmin" });
      C.panjur(hm("16:50"), 1.6, 0, 0, true);
    }
    C.ekle("sosyal", cikis + 3, 0.05, 2);

    // --- 17:35 dönüş öngörüsü
    const donus = hm("17:35"), varis = hm("18:00");
    an.push({ no: 7, t: donus, ad: L("Eve dönüş öngörüsü", "Coming home"), sistem: 1 });
    K(donus, {
      baslik: L("Eve dönüyor: 25 dk", "Coming home: 25 min"),
      girdi: L("Telefon çeperi (1 km) · trafik · iç {Ti@17:35} °C", "Phone geofence (1 km) · traffic · indoor {Ti@17:35} °C"),
      tahmin: yaz ? L("18:00 varış; güneş cephede 20:20'ye kadar", "Arrival 18:00; sun on the façade until 20:20") : L("18:00 varış; ısıtma 25 dk'da 17 → 21 °C", "Arrival 18:00; heating 17 → 21 °C in 25 min"),
      tepki: L("Varışta ayakkabı ve spor çantası kutusu girişe gelir: istasyonun dibinde → öndeki kutular bekleme hattına çekilir (görünür manevra)",
        "On arrival the shoes and gym bag box comes to the door: it is deep in the station → the boxes in front move to the holding track (visible shunting)"),
      geri: L("—", "—"),
    }, { sistem: 1, tur: "tahmin" });
    const ayakkabi = teslim("KH7", varis - 1.2, "giris", 4);
    hatOlay.push({ id: "KH7", ...ayakkabi });
    P.git(varis, "giris");
    C.ekle("isik", varis, 0.6, yaz ? 0.35 : 0.8).ekle("isikRenk", varis, 0.6, 0);
    an.push({ no: 8, t: varis - 1.2, ad: L("Manevra: arkadaki kutu öne", "Shunting: the rear box comes out"), sistem: 3 });
    K(varis - 1.2, {
      baslik: L("Arkadaki kutu istendi → manevra", "Rear box requested → shunting"),
      girdi: L("Kapıya 1 dk · kutu kaydı: Salı 18:00 ayakkabı + spor çantası %80", "1 min to the door · log: Tuesday 18:00 shoes + gym bag 80 %"),
      tahmin: L(`Kutu istasyonun dibinde; önünde ${ayakkabi.manevra} kutu var`, `The box is deep in the station; ${ayakkabi.manevra} boxes are in front`),
      tepki: L(`${ayakkabi.manevra} ara hamle: öndeki kutu makastan bekleme hattına geçer, istenen kutu ana hatta çıkar, girişe iner`,
        `${ayakkabi.manevra} intermediate moves: the front box goes to the holding track, the requested box takes the main line to the door`),
      geri: L("Kutular asla birbirinin içinden geçmez: sıra ancak makasla değişir", "Boxes never pass through each other: order changes only at the switch"),
    }, { sistem: 3, tur: "tepki" });

    // --- 18:05 odak (plan 1): perde kapanır, masa açılır, raf iner, panjur V = "evdeyim, sakinim"
    const odak = hm("18:05");
    an.push({ no: 9, t: odak, ad: L("Odak: çalışma odası kapanır", "Focus: the study closes"), sistem: 1 });
    P.git(odak + 0.5, "calisma");
    C.ekle("perde", odak, 1.2, 0.66).ekle("calisma", odak + 0.3, 1, 1);
    tk("Y4", odak + 0.4, 1.4, 1);
    if (yaz) C.panjur(odak + 0.6, 1.4, 0.5, 0.5, true);
    else C.panjur(odak + 0.6, 1.4, 0.5, 0.5, true);
    C.ekle("sosyal", odak + 0.6, 0.05, 1);
    K(odak, {
      baslik: L("Odak saati → çalışma odası", "Focus time → the study"),
      girdi: L("Takvim: 18:00–19:00 ödev · son 3 Salı aynı · güneş cephede (V güvenli)", "Calendar: assignment 18:00–19:00 · same on the last 3 Tuesdays · sun on the façade (V is safe)"),
      tahmin: L("1 sa sessiz çalışma", "1 h of quiet work"),
      tepki: L("Perde koridoru kapatır, masa açılır, kitap ve bitki rafı (Y4) masa yanına iner; panjur V: komşu ‘evdeyim, sakinim’ okur",
        "Curtain closes the hall, desk unfolds, the book-and-plant shelf (Y4) lowers beside it; shutters V: the neighbour reads ‘home, but quiet’"),
      geri: L("Sinyal kapı yanındaki ikizde de orta bölme olarak yanar", "The entrance twin lights its middle segment too"),
    }, { sistem: 2, tur: "tahmin" });

    // --- 19:00 hobi (plan 1): kapım açık → komşu gelir; büyük salon
    const hobi = hm("19:00");
    an.push({ no: 10, t: hobi, ad: L("Kapım açık → komşu yogaya gelir", "Door open → the neighbour joins for yoga"), sistem: 2 });
    C.ekle("calisma", hobi, 1, 0).ekle("perde", hobi + 0.2, 1.2, 0);
    tk("Y4", hobi + 0.3, 1.4, 0);
    tk("S4", hobi + 0.5, 1.4, 1);
    tk("S7", hobi + 0.8, 1.6, 1);
    C.ekle("sosyal", hobi, 0.05, 0);
    P.git(hobi + 1.2, "mat1");
    komsuP.git(hobi + 6, "mat2");
    K(hobi, {
      baslik: L("Sakin ‘kapım açık’ dedi → gölge ile sinyal ayrışır", "Resident set ‘my door is open’ → shade and signal split"),
      girdi: yaz ? L("Kapı ikizinde ‘açık’ seçildi · güneş cephede 20:20'ye kadar ({isinim@19:00} W/m²)", "‘Open’ chosen on the entrance twin · sun on the façade until 20:20 ({isinim@19:00} W/m²)")
        : L("Kapı ikizinde ‘açık’ seçildi · dışarısı karanlık ve soğuk", "‘Open’ chosen on the entrance twin · dark and cold outside"),
      tahmin: yaz ? L("Panjur şimdi tam açılırsa yatak ucu 20:00'de ≈ 28 °C", "Fully open now → bed end ≈ 28 °C by 20:00") : L("Panjur açılırsa saatte 0,4 kWh fazla kayıp", "Opening the shutters loses 0.4 kWh per hour"),
      tepki: L("Panjur V kalır (gölge), sinyal ışığı ‘açık’ yanar: komşu panjurdan değil kapı ikizinden okur. Büyük salon: U1+U2 üstte, U3 altta → 17 m²; yoga matı (S4) ve dambıl (S7) kutuları iner",
        "Shutters stay V (shade), the signal shows ‘open’: the neighbour reads the entrance twin, not the shutters. Large room: U1+U2 up, U3 down → 17 m²; yoga mat (S4) and dumbbell (S7) boxes lower"),
      geri: L("19:06 komşu gelir; kapı çalmadan, sinyali görerek", "19:06 the neighbour arrives — reading the signal, not knocking"),
    }, { sistem: 2, tur: "tahmin" });

    // --- 20:20 güneş çekildi → panjur tam açık; 20:35 komşu gider, salon toplanır
    if (yaz) {
      C.panjur(hm("20:20"), 1.4, 1, 1, true);
      K(hm("20:20"), {
        baslik: L("Güneş cepheden çekildi → panjur tam açık", "Sun has left the façade → shutters fully open"),
        girdi: L("Cephe ışınımı < 80 W/m² · iç {Ti@20:20} °C", "Façade irradiance < 80 W/m² · indoor {Ti@20:20} °C"),
        tahmin: L("—", "—"),
        tepki: L("Üst sıra saçak, alt sıra denizlik: panjur artık sinyalle aynı şeyi söylüyor", "Upper row becomes a canopy, lower a sill: shutters now say what the signal says"),
        geri: L("—", "—"),
      }, { sistem: 2, tur: "tepki" });
    }
    komsuP.git(hm("20:32"), "disari");
    tk("S4", hm("20:36"), 1.4, 0);
    tk("S7", hm("20:37"), 1.6, 0);
    C.ekle("U3", hm("20:40"), 1.6, OLCU.U3.ust);
    C.ekle("koltuk", hm("20:42"), 1.6, 1);
    P.git(hm("20:44"), "koltuk");
    // akşam: panjur kapalı + ışık çizgisi = "evdeyim, uğrayabilirsin"
    C.panjur(hm("20:48"), 1.4, 0, 0, true);
    C.ekle("led", hm("20:50"), 0.3, 1);
    an.push({ no: 11, t: hm("20:48"), ad: L("Gece sinyali: kapalı + ışık çizgisi", "Night signal: closed + light line"), sistem: 2 });
    K(hm("20:48"), {
      baslik: L("Akşam mahremiyeti, ama ‘uğrayabilirsin’", "Evening privacy, but ‘drop by’"),
      girdi: L("Gün batımı · sakin salonda · sinyal ‘açık’", "Sunset · resident in the living room · signal ‘open’"),
      tahmin: L("Gece panjur zaten kapalı olur: kapalı panjur tek başına ‘yokum’ ile karışır", "At night shutters are closed anyway: closed alone would read ‘away’"),
      tepki: L("Panjurlar kapanır, alt kirişteki sıcak ışık çizgisi yanar: ‘evdeyim, uğrayabilirsin’", "Shutters close, the warm light line under them switches on: ‘home, drop by’"),
      geri: L("—", "—"),
    }, { sistem: 2, tur: "tepki" });

    // --- 21:00 film (elle) → öğrenilir
    const film = hm("21:00");
    an.push({ no: 12, t: film, ad: L("Film: elle komut → öğrenilir", "Film: manual → learned"), sistem: 2 });
    C.ekle("led", film, 0.3, 0).ekle("sosyal", film, 0.05, 2);
    C.ekle("isik", film, 0.8, 0.12).ekle("tvAcik", film + 0.3, 0.4, 1);
    tk("S3", film - 0.6, 1.2, 1);
    K(film, {
      baslik: L("Film modu (sakin istedi)", "Film mode (resident asked)"),
      girdi: L("Telefon: ‘Film’ · son 3 Salı aynı saatte aynı komut", "Phone: ‘Film’ · same command at this time on the last 3 Tuesdays"),
      tahmin: L("Alışkanlık: Salı 21:00 film (3/3) → gelecek Salı 20:58'de ÖNERİLİR, kendiliğinden yapılmaz", "Habit: Tuesday 21:00 film (3/3) → next Tuesday it is SUGGESTED at 20:58, not done unasked"),
      tepki: L("Işık çizgisi söner, sinyal ‘rahatsız etmeyin’; projektör kutusu (S3) iner, ışık %15", "Light line off, signal ‘do not disturb’; projector box (S3) lowers, lights 15 %"),
      geri: L("—", "—"),
    }, { sistem: 2, tur: "elle" });
    tk("S3", hm("22:44"), 1.2, 0);

    // --- 21:40 plansız misafir (beklenmedik, isteğe bağlı) → 2. yatak odası (plan 2)
    const misafir = !!olaylar.misafir;
    if (misafir) {
      const mt = hm("21:40");
      an.push({ no: "!", t: mt, ad: L("Beklenmedik: plansız misafir", "Unexpected: unplanned guest"), sistem: 1, beklenmedik: true });
      misafirP.git(mt, "misafirKoltuk");
      K(mt, {
        baslik: L("Plansız misafir → ikiz SORAR", "Unplanned guest → the twin ASKS"),
        girdi: L("Kapı açıldı · varlık 2 kişi · takvimde misafir yok", "Door opened · presence counts 2 · no guest in the calendar"),
        tahmin: L("Rutin dışı gece: güven %40 → otomatik değil öneri", "Off-routine night: confidence 40 % → suggestion, not automation"),
        tepki: L("Onaydan sonra U2 1,36 m aşağı kayar: U1 ile arasında 2. yatak odası (3,3 m²); U1'in yatağı açılır, misafir yatak takımı (S2) iner, perde odayı koridordan ayırır",
          "After approval U2 slides 1.36 m: a second bedroom (3.3 m²) forms against U1; U1's bed unfolds, guest bedding (S2) lowers, the curtain closes the room off the hall"),
        geri: L("Misafir veri kaydına girmez (mahremiyet); ertesi sabah koreografi yalnız öneri", "The guest is never logged (privacy); next morning's choreography only suggests"),
      }, { sistem: 1, tur: "beklenmedik" });
      C.ekle("U2", hm("22:20"), 1.6, OLCU.U2.alt);
      tk("S2", hm("22:22"), 1.4, 1);
      C.ekle("misafirYatak", hm("22:27"), 1.4, 1);
      C.ekle("dolapKapak", hm("22:29"), 0.8, 1);
      tk("S2", hm("22:33"), 1.4, 0);
      C.ekle("dolapKapak", hm("22:40"), 0.8, 0);
      misafirP.git(hm("22:36"), "misafirYatak");
    }

    // --- 22:50 uyku düzeni
    an.push({ no: 13, t: hm("22:50"), ad: L("Uyku düzeni", "Night layout"), sistem: 1 });
    K(hm("22:50"), {
      baslik: L("Uyku saati öngörüldü → gece düzeni", "Bedtime predicted → night layout"),
      girdi: L("Son 4 hafta yatış 23:10 (±15 dk) · TV kapandı · iç {Ti@22:50} °C", "Bedtime last 4 weeks 23:10 (±15 min) · TV off · indoor {Ti@22:50} °C"),
      tahmin: yaz ? L("Gece serin: P-K1 kanadı açık kalırsa sabah iç 24,5 °C", "Cool night: with the P-K1 sash open, 24.5 °C by morning") : L("Gece 19 °C yeterli", "19 °C is enough at night"),
      tepki: L("Koltuk tavana, U3 aşağı (mutfak kapanır), yatak iner, perde yatak odasını kapatır, panjur kapalı, sinyal ‘rahatsız etmeyin’",
        "Sofa up, U3 down (kitchen closes), bed down, curtain closes the bedroom, shutters closed, signal ‘do not disturb’"),
      geri: L("Yatak başı tuşu: ‘üst orta açık’ → yatakta gökyüzü", "Bedside key: ‘upper middle open’ → sky from the bed"),
    }, { sistem: 1, tur: "tahmin" });
    C.ekle("tvAcik", hm("22:46"), 0.4, 0);
    C.ekle("koltuk", hm("22:48"), 1.6, 0);
    C.ekle("U3", hm("22:51"), 1.6, OLCU.U3.alt);
    C.ekle("yatak", hm("22:56"), 2.2, 1);
    C.ekle("perde", hm("23:02"), 1.2, 1);
    C.ekle("isik", hm("22:55"), 1, 0.25).ekle("isik", hm("23:12"), 2, 0);
    if (yaz) C.ekle("kanat", hm("23:30"), 1, 0.6);
    P.git(hm("22:58"), "banyo");
    P.git(hm("23:08"), "yatak");

    return bitir({ M, C, P, komsuP, misafirP: misafir ? misafirP : null, kayit, an, hat, hatOlay, tablo, olaylar, elle, misafir, hatBas, planOps });
  }

  // tatil günü: kimse yok; ev ‘biri varmış gibi’ yaşar (güvenlik), sinyal hep ‘kapalı’
  function tatilGunu(M, C, P, komsuP, misafirP, kayit, an, hat, tablo, olaylar, elle, hatBas) {
    const R = rnd(77);
    const yaz = M.kod === "yaz";
    C.ekle("yatak", 0.2, 0.1, 0);
    an.push({ no: 1, t: hm("07:50"), ad: L("Tatil modu: ev rol yapar", "Holiday mode: the home acts"), sistem: 2 });
    const ac = hm("07:30") + Math.round(R() * 40), kapa = hm("21:40") + Math.round(R() * 50);
    C.panjur(ac, 1.6, yaz ? 0.5 : 1, yaz ? 0.5 : 1, true);
    C.panjur(hm("12:10") + Math.round(R() * 30), 1.6, 0, yaz ? 0.5 : 1, true);
    C.panjur(hm("19:05") + Math.round(R() * 35), 1.6, 0.5, 1, true);
    C.panjur(kapa, 1.6, 0, 0, true);
    C.ekle("isik", hm("19:50") + Math.round(R() * 30), 0.8, 0.45).ekle("isik", kapa + 20, 0.8, 0.2).ekle("isik", kapa + 70, 0.8, 0);
    C.ekle("tvAcik", hm("21:05") + Math.round(R() * 20), 0.4, 1).ekle("tvAcik", kapa + 10, 0.4, 0);
    K0(kayit, ac, {
      baslik: L("Tatil modu: panjur her gün farklı saatte", "Holiday mode: shutters move at a different time each day"),
      girdi: L("Takvim: 3 gün tatil · ev boş · son 4 haftanın rutini", "Calendar: 3-day holiday · empty · last 4 weeks' routine"),
      tahmin: L("Her gün aynı saatte kapalı panjur ‘ev boş’ der; sabit bir zamanlayıcı da öyle", "Shutters closed at the same time every day say ‘empty’; so does a fixed timer"),
      tepki: L("Sakinin gerçek rutini ± rastgele 20–50 dk ile oynanır; akşam ışığı ve TV yanar. Kapı ikizi hep ‘kapalı’ (rahatsız etmeyin) gösterir, asla ‘yok’ değil",
        "The resident's real routine is replayed ± 20–50 random minutes; evening lights and TV switch on. The entrance twin always shows ‘closed’ (do not disturb), never ‘away’"),
      geri: L("Güvendiği komşu (isteğe bağlı) gerçek durumu telefonda görür", "A trusted neighbour (opt-in) sees the real state on their phone"),
    }, { sistem: 2, tur: "tahmin" });
    return bitir({ M, C, P, komsuP, misafirP: null, kayit, an, hat, hatOlay: [], tablo, olaylar, elle, misafir: false, tatil: true, hatBas, planOps: [] });
  }
  function K0(kayit, t, x, ek) { kayit.push({ t, ...x, ...ek }); }

  // ortak bitiş: olaylar, elle komutlar, kesinti, simülasyon, metin doldurma
  function bitir(o) {
    const { M, C, P, komsuP, misafirP, kayit, an, olaylar, elle } = o;
    const yaz = M.kod === "yaz";
    const firtina = !!olaylar.firtina;
    if (firtina) {
      an.push({ no: "!", t: hm("18:40"), ad: L("Beklenmedik: fırtına", "Unexpected: storm"), sistem: 2, beklenmedik: true });
      K0(kayit, hm("18:40"), {
        baslik: L("Fırtına uyarısı → panjur kilitlenir", "Storm warning → shutters lock"),
        girdi: L("Meteoroloji + çatı rüzgârölçeri: 19:00–20:00 70 km/sa", "Met office + roof anemometer: 70 km/h 19:00–20:00"),
        tahmin: L("Açık kanatlar 50 km/sa üstünde zarar görür", "Open leaves are damaged above 50 km/h"),
        tepki: L("Bütün panjurlar kapanır ve kilitlenir; sinyal ışık çizgisine geçer (panjur sinyal veremez)", "All shutters close and lock; the signal moves to the light line (the shutters cannot signal)"),
        geri: L("Bu sürede elle açma devre dışı (güvenlik kuralı)", "Manual opening disabled meanwhile (safety rule)"),
      }, { sistem: 2, tur: "beklenmedik" });
      C.panjur(hm("18:42"), 1.5, 0, 0, false);
      C.ekle("led", hm("18:43"), 0.3, 1).ekle("led", hm("20:12"), 0.3, 0);
      C.panjur(hm("20:10"), 1.5, yaz ? 1 : 0, yaz ? 1 : 0, true);
    }
    const kesinti = olaylar.kesinti ? [hm("19:30"), hm("20:15")] : null;
    if (kesinti) {
      an.push({ no: "!", t: kesinti[0], ad: L("Beklenmedik: elektrik kesintisi", "Unexpected: power cut"), sistem: 0, beklenmedik: true });
      K0(kayit, kesinti[0], {
        baslik: L("Elektrik kesildi → ikiz kör, ev durur", "Power cut → the twin is blind, the home stops"),
        girdi: L("Şebeke yok · sensörler küçük bataryayla yalnız kayıt tutar", "No grid · sensors only log on a small battery"),
        tahmin: L("Yok: veri akışı kesildi", "None: data stream lost"),
        tepki: L("Motorlar olduğu yerde frenle durur (yatak, koltuk ve kutular düşmez). Birimler kilit kolu çekilince elle itilir; panjur el çarkıyla açılır",
          "Motors brake where they are (bed, sofa and boxes never drop). Units are pushed by hand after the lock lever; shutters by hand crank"),
        geri: L("Dönüşte ikiz kaçırdığı adımları SORAR", "When power returns the twin ASKS about missed steps"),
      }, { sistem: 0, tur: "beklenmedik" });
    }
    let hat = o.hat, hatOlay = o.hatOlay;
    const elleKutu = elle.filter((e) => e.ad.startsWith("kutu:"));
    if (elleKutu.length) {
      // hat sıralı bir kuyruktur: planlı teslimler + sakinin çağrıları saat sırasıyla yeniden oynatılır;
      // meşgul hatta gelen çağrı, önceki işlem (dönüş dahil) bitince başlar
      hat = new HatPlani(o.hatBas); hatOlay = [];
      const ops = o.planOps.concat(elleKutu.map((e) => ({ tur: "teslim", id: e.ad.slice(5), t: e.t, durak: e.durak || "giris", bekle: e.bekle || 4, elle: true })));
      ops.sort((a, b) => a.t - b.t);
      for (const x of ops) {
        if (x.tur === "diz") hat.diz(x.t, x.hedef);
        else hatOlay.push({ id: x.id, elle: !!x.elle, ...hat.teslimEt(x.id, x.t, x.durak, x.bekle) });
      }
    }
    for (const e of elle) {
      if (e.ad.startsWith("kutu:")) continue;
      if (/^k\d$/.test(e.ad)) C.ekle(e.ad, e.t, 1.2, e.hedef);
      else C.ekle(e.ad, e.t, e.sure || 1.5, e.hedef);
    }
    C.bitir();
    if (kesinti) {
      const ham = C.deger.bind(C);
      C.deger = function (ad, t) {
        if (t >= kesinti[0] && t < kesinti[1] && ad !== "isik") return ham(ad, kesinti[0]);
        if (ad === "isik" && t >= kesinti[0] && t < kesinti[1]) return 0.05;
        return ham(ad, t);
      };
    }
    const kutuDurum = (id, t) => (kesinti && t >= kesinti[0] && t < kesinti[1] ? hat.konum(id, kesinti[0] - 0.001) : hat.konum(id, t));
    const sim = simule(M, C, P, [komsuP, misafirP].filter(Boolean), kesinti);
    const virgul = (x, n) => (G.IKIZ_DIL === "en" ? x.toFixed(n) : x.toFixed(n).replace(".", ","));
    const doldur = (m) => m.replace(/\{(CO2|Ti|dis|isinim)@(\d\d:\d\d)\}/g, (_, ne, h) => {
      const i = hm(h);
      if (ne === "CO2") return Math.round(sim.ikiz.co2[i]).toLocaleString(G.IKIZ_DIL === "en" ? "en-GB" : "tr-TR");
      if (ne === "isinim") return Math.round(sim.isinim[i]);
      return virgul(ne === "Ti" ? sim.ikiz.Ti[i] : sim.dis[i], 1);
    });
    kayit.forEach((k) => ["baslik", "girdi", "tahmin", "tepki", "geri"].forEach((f) => (k[f] = doldur(d(k[f]) || "—"))));
    an.forEach((a) => (a.ad = d(a.ad)));
    return { M, C, P, komsuP, misafirP, kayit: kayit.sort((a, b) => a.t - b.t), an: an.sort((a, b) => a.t - b.t), hat, hatOlay,
      kutuDurum, tablo: o.tablo, sim, olaylar: { misafir: !!o.misafir, kesinti: !!kesinti, firtina, tatil: !!o.tatil } };
  }

  // ------------------------------------------------------------------ simülasyon (ısı, CO₂, nem; üç politika)
  function simule(M, C, P, digerleri, kesinti) {
    const N = 1441;
    const dis = new Float32Array(N), isinim = new Float32Array(N), gunesY = new Float32Array(N), gunesA = new Float32Array(N);
    for (let t = 0; t < N; t++) {
      dis[t] = disSicaklik(M, t);
      const c = cepheIsinim(M, t); isinim[t] = c.toplam; gunesY[t] = c.g.yukseklik; gunesA[t] = c.g.azimut;
    }
    const panjurT = (t) => [0, 1, 2, 3, 4, 5].map((i) => C.deger("k" + i, t));
    const kisiSay = (t) => (P.evde(t) ? 1 : 0) + digerleri.reduce((a, Q) => a + (Q.evde(t) ? 1 : 0), 0);
    const uyuyor = (t) => P.konum(t).yer === "yatak" && (t < hm("07:00") || t > hm("23:10"));
    function kos(politika) {
      const Ti = new Float32Array(N), co2 = new Float32Array(N), nem = new Float32Array(N);
      let T = M.isitma ? 19.5 : 25.2, CO2 = 900, tepkiKapali = false, enerji = 0;
      for (let tur = 0; tur < 3; tur++) {
        enerji = 0;
        for (let t = 0; t < N; t++) {
          let kep = panjurT(t);
          if (politika !== "ikiz") {
            const gunduz = t >= hm("07:20") && t < hm("21:00");
            if (politika === "yok") kep = gunduz ? [1, 1, 1, 1, 1, 1] : kep;
            if (politika === "tepki") {
              if (M.isitma) kep = gunduz ? [1, 1, 1, 1, 1, 1] : kep;
              else {
                if (T > ISIL.konfor + 0.3) tepkiKapali = true;
                if (T < ISIL.konfor - 1.2) tepkiKapali = false;
                kep = gunduz ? (tepkiKapali ? [0, 0, 0, 0, 0, 0] : [1, 1, 1, 1, 1, 1]) : kep;
              }
            }
          }
          const g = gecirgenlik(kep);
          const kapaliOran = 1 - kep.reduce((a, b) => a + b, 0) / 6;
          const tau = lerp(ISIL.tau, ISIL.tauKapali, kapaliOran);
          let hav = C.deger("kanat", t);
          if (politika === "yok" && !M.isitma) hav = (t >= hm("07:00") && t < hm("07:15")) ? 1 : (t >= hm("23:30") || t < hm("06:30")) ? 0.6 : 0;
          const n = kisiSay(t);
          let dT = (dis[t] - T) / tau + ISIL.kG * (isinim[t] / 1000) * g + ISIL.kI * Math.min(2, n) + hav * (dis[t] - T) / ISIL.tauH * (M.isitma ? 0.35 : 1);
          let isitma = 0;
          if (M.isitma) {
            let set;
            if (politika === "ikiz") {
              if (kesinti && t >= kesinti[0] && t < kesinti[1]) set = 0;
              else if (uyuyor(t)) set = ISIL.setUyku;
              else if (n) set = ISIL.setEvde;
              else if (t >= hm("17:35") && t < hm("18:00")) set = ISIL.setEvde;
              else if (t >= hm("06:10") && t < hm("07:00")) set = ISIL.setEvde;
              else set = ISIL.setYok;
            } else set = ISIL.setEvde;
            if (T < set) isitma = Math.min(ISIL.isitmaGuc, (set - T) * 3);
          }
          dT += isitma;
          T += dT / 60;
          if (tur === 2) { Ti[t] = T; enerji += isitma / 60 * 1.6; }
          const uretim = n ? (uyuyor(t) ? 16 : 22) * n : 0;
          CO2 += uretim - (CO2 - 420) * (0.012 + (n && !uyuyor(t) ? 0.018 : 0) + hav * 0.13);
          if (tur === 2) { co2[t] = CO2; nem[t] = clamp(52 + (n ? 4 : 0) - (T - 22) * 1.2 + (M.isitma ? -6 : 0) + (t > hm("07:02") && t < hm("07:14") ? 8 : 0), 30, 70); }
        }
      }
      return { Ti, co2, nem, enerji };
    }
    return { dis, isinim, gunesY, gunesA, ikiz: kos("ikiz"), tepki: kos("tepki"), yok: kos("yok") };
  }

  // ------------------------------------------------------------------ öngörüler
  function ongoruler(D, t) {
    const yaz = D.M.kod === "yaz", s = D.sim;
    const tepe = (arr, a, b) => { let m = -1e9, at = a; for (let i = a; i < b; i++) if (arr[i] > m) { m = arr[i]; at = i; } return { m, at }; };
    const pY = tepe(s.yok.Ti, hm("08:00"), hm("18:00")), pI = tepe(s.ikiz.Ti, hm("08:00"), hm("18:00")), pT = tepe(s.tepki.Ti, hm("08:00"), hm("18:00"));
    let tepkiKapanis = null;
    for (let i = hm("08:00"); i < hm("18:00"); i++) if (s.tepki.Ti[i] > ISIL.konfor + 0.3) { tepkiKapanis = i; break; }
    const en = G.IKIZ_DIL === "en";
    return [
      { kod: en ? "P1" : "Ö1", ad: en ? "Routine" : "Rutin", sistem: 1,
        deger: en ? "Up 07:00 · bathroom 11 min · out 07:55 · back 18:00" : "Kalkış 07:00 · banyo 11 dk · çıkış 07:55 · dönüş 18:00",
        girdi: en ? "Calendar, 4-week movement log (presence, door, bed pressure), alarm" : "Takvim, 4 haftalık hareket kaydı (varlık, kapı, yatak basıncı), alarm",
        mantik: en ? "Weighted average of the same weekdays ± spread; below 70 % confidence it suggests instead of acting. The layout (rooms) is planned from it: units move before the body arrives"
          : "Haftanın aynı günlerinin ağırlıklı ortalaması ± sapma; güven %70'in altındaysa yapmaz, önerir. Oda düzeni buna göre planlanır: birimler beden gelmeden yer değiştirir",
        ufuk: en ? "Next day + 15 min" : "Ertesi gün + 15 dk", sinir: en ? "Illness, guests, holidays; first 2–3 weeks of learning" : "Hastalık, misafir, tatil; ilk 2–3 hafta öğrenme",
        guven: D.olaylar.misafir && t > hm("21:40") ? 40 : 86 },
      { kod: en ? "P2" : "Ö2", ad: en ? (yaz ? "Overheating" : "Heating") : (yaz ? "Aşırı ısınma" : "Isıtma"), sistem: 2,
        deger: yaz ? (en ? `Shutters open ${pY.m.toFixed(1)} °C · predictive ${pI.m.toFixed(1)} °C` : `Panjur açık ${pY.m.toFixed(1)} °C · öngörülü ${pI.m.toFixed(1)} °C`)
          : (en ? `Fixed thermostat ${s.tepki.enerji.toFixed(1)} kWh · twin ${s.ikiz.enerji.toFixed(1)} kWh` : `Sabit termostat ${s.tepki.enerji.toFixed(1)} kWh · ikiz ${s.ikiz.enerji.toFixed(1)} kWh`),
        girdi: en ? "Forecast, sun position, façade azimuth 225° (assumed), indoor temperature, shutter state, occupancy, social signal" : "Hava tahmini, güneş konumu, cephe yönü 225° (varsayım), iç sıcaklık, panjur durumu, doluluk, sosyal sinyal",
        mantik: en ? "Single-node thermal model run 12 h ahead; options compared; comfort limit 26 °C. When shade and signal disagree, the signal moves to the light line and entrance twin"
          : "Tek düğümlü ısıl model 12 sa ileri koşturulur; seçenekler karşılaştırılır, konfor sınırı 26 °C. Gölge ile sinyal çelişirse sinyal ışık çizgisine ve kapı ikizine taşınır",
        ufuk: en ? "12–24 h" : "12–24 sa", sinir: en ? "Cloud forecast error, no neighbour shading, uncalibrated coefficients" : "Bulut tahmini hatası, komşu gölgesi yok, katsayılar kalibre değil",
        tepkiKapanis, pY, pI, pT, guven: 74 },
      { kod: en ? "P3" : "Ö3", ad: en ? "Objects and the box line" : "Eşya ve kutu hattı", sistem: 3,
        deger: en ? "Pantry 07:12 · keys 07:44 · shoes and gym bag 18:00" : "Kiler 07:12 · anahtar 07:44 · ayakkabı ve spor 18:00",
        girdi: en ? "Box log (RFID + weight), calendar, rain forecast, the station's current order" : "Kutu kaydı (RFID + ağırlık), takvim, yağmur tahmini, istasyonun o anki sırası",
        mantik: en ? "Hour × weekday probability table; at 03:00 a search finds the fewest shunting moves that put tomorrow's boxes at the head of the station and holding track"
          : "Saat × gün olasılık tablosu; 03:00'te arama, yarının kutularını istasyonun ve bekleme hattının başına getiren en az manevrayı bulur",
        ufuk: en ? "Next day + 10 min" : "Ertesi gün + 10 dk", sinir: en ? "New objects; box contents updated by hand" : "Yeni eşya; kutu içeriği elle güncellenmeli",
        guven: 81 },
    ];
  }

  // ------------------------------------------------------------------ oda düzeni: "ev şu an kaç odalı" (hocanın kritiği)
  function odalar(D, t) {
    const v = (a) => D.C.deger(a, t), O = OLCU, en = G.IKIZ_DIL === "en";
    const u2 = v("U2"), u3 = v("U3");
    const out = [];
    const yatak = v("yatak") > 0.5, calisma = v("calisma") > 0.5;
    out.push({ ad: en ? (yatak ? "Bedroom" : calisma ? "Study" : "Room") : (yatak ? "Yatak odası" : calisma ? "Çalışma odası" : "Oda"), m2: 9.7, tur: "oda", s0: 20, s1: 304 });
    const ara = u2 - (O.U1.s + O.U1.k);
    if (ara > 60) out.push({ ad: en ? (v("misafirYatak") > 0.5 ? "Second bedroom" : "Dressing room") : (v("misafirYatak") > 0.5 ? "2. yatak odası" : "Giyinme odası"), m2: +(ara / 100 * 2.4).toFixed(1), tur: "oda", s0: O.U1.s + O.U1.k, s1: u2 });
    const salonS0 = u2 + O.U2.k, salonS1 = u3;
    const salon = (salonS1 - salonS0) / 100 * 3.4;
    const koltuk = v("koltuk") > 0.5, hobi = v("tkS4") > 0.5 || v("tkS7") > 0.5;
    const salonAd = hobi ? (en ? "Hobby room" : "Hobi salonu") : koltuk ? (en ? "Living room" : "Oturma") : salon > 15 ? (en ? "Large room" : "Büyük salon") : (en ? "Living room" : "Salon");
    out.push({ ad: salonAd, m2: +salon.toFixed(1), tur: "salon", s0: salonS0, s1: salonS1 });
    if (u3 < 820) out.push({ ad: en ? "Dining + kitchen" : "Yemek + mutfak", m2: +((925.7 - (u3 + O.U3.k)) / 100 * 3.4 + 1.8).toFixed(1), tur: "yemek", s0: u3 + O.U3.k, s1: 1001.8 });
    else out.push({ ad: en ? "Kitchen (closed)" : "Mutfak (kapalı)", m2: 1.8, tur: "kapali", s0: 925.7, s1: 1001.8 });
    out.push({ ad: en ? "Bathroom" : "Banyo", m2: 4.3, tur: "banyo", s0: 1013.5, s1: 1200 });
    const yatakSay = out.filter((o) => o.tur === "oda").length;
    const salonSay = out.filter((o) => o.tur === "salon" || o.tur === "yemek").length;
    return { liste: out, kod: `${yatakSay}+${salonSay ? 1 : 0}` + (out.some((o) => o.tur === "yemek") ? (en ? " + dining" : " + yemek") : ""), ozet: out.filter((o) => o.tur !== "banyo" && o.tur !== "kapali").map((o) => `${o.ad} ${String(o.m2).replace(".", en ? "." : ",")}`).join(" · ") };
  }
  // panjur + sinyal anlamı (komşu ne görüyor)
  function sinyal(D, t) {
    const s = Math.round(D.C.deger("sosyal", t)), led = D.C.deger("led", t) > 0.5, en = G.IKIZ_DIL === "en";
    const k = [0, 1, 2, 3, 4, 5].map((i) => D.C.deger("k" + i, t)), ort = k.reduce((a, b) => a + b, 0) / 6;
    const alt = (k[0] + k[1] + k[2]) / 3, ust = (k[3] + k[4] + k[5]) / 3;
    const panjur = ort > 0.8 ? (en ? "open" : "açık") : ort < 0.2 ? (en ? "closed" : "kapalı")
      : ust > 0.8 && alt < 0.2 ? (en ? "upper row open" : "üst sıra açık") : alt > 0.8 && ust < 0.2 ? (en ? "lower row open" : "alt sıra açık")
      : (en ? "half (V)" : "yarı (V)");
    const anlam = [en ? "My door is open — drop by" : "Kapım açık — uğrayabilirsin", en ? "Home, but quiet" : "Evdeyim ama sakinim", en ? "Do not disturb / not home" : "Rahatsız etmeyin / evde değilim"][s];
    const gece = led && s !== 2 ? (en ? "Closed + light line: home, drop by" : "Kapalı + ışık çizgisi: evdeyim, uğrayabilirsin") : null;
    return { s, led, panjur, anlam: gece || anlam, ort };
  }

  // ------------------------------------------------------------------ programlar (zaman çubuğu blokları)
  function programlar(D) {
    const en = G.IKIZ_DIL === "en";
    if (D.olaylar.tatil) return [{ a: 0, b: 1440, ad: en ? "Holiday · the home acts" : "Tatil · ev rol yapar", tur: "bos" }];
    const p = [
      [0, hm("06:45"), "Uyku", "Sleep", "gece"], [hm("06:45"), hm("07:00"), "Işıkla uyanma", "Wake with light", "sabah"],
      [hm("07:00"), hm("07:13"), "Banyo", "Bathroom", "sabah"], [hm("07:13"), hm("07:36"), "Kahvaltı", "Breakfast", "sabah"],
      [hm("07:36"), hm("07:55"), "Koltuk · çıkış", "Sofa · leaving", "sabah"], [hm("07:55"), hm("18:00"), "Boş ev", "Empty home", "bos"],
      [hm("18:00"), hm("19:00"), "Odak", "Focus", "aksam"], [hm("19:00"), hm("20:35"), "Hobi · komşu", "Hobby · neighbour", "aksam"],
      [hm("20:35"), hm("21:00"), "Akşam", "Evening", "aksam"], [hm("21:00"), hm("22:46"), "Film", "Film", "aksam"],
      [hm("22:46"), hm("23:08"), "Uykuya hazırlık", "Getting ready for bed", "gece"], [hm("23:08"), 1440, "Uyku", "Sleep", "gece"],
    ];
    return p.map(([a, b, tr_, en_, tur]) => ({ a, b, ad: en ? en_ : tr_, tur }));
  }
  function programAdi(D, t) {
    const ps = programlar(D).filter((p) => t >= p.a && t < p.b);
    let ad = ps.length ? ps[ps.length - 1].ad : "";
    const en = G.IKIZ_DIL === "en";
    if (D.olaylar.kesinti && t >= hm("19:30") && t < hm("20:15")) ad = en ? "Power cut" : "Elektrik kesintisi";
    if (D.olaylar.firtina && t >= hm("18:40") && t < hm("20:10")) ad = en ? "Storm · shutters locked" : "Fırtına · panjur kilitli";
    if (D.olaylar.misafir && t >= hm("21:40")) ad = t < hm("22:46") ? (en ? "Unplanned guest" : "Plansız misafir") : (en ? "Night with a guest" : "Misafirli gece");
    return ad;
  }

  G.IKIZ = { hm, saat, clamp, lerp, yumusak, L, d, OLCU, TAVAN, KUTULAR, MEVSIM, YER, ISIL, YURUME_HIZI, kur, gunes, cepheIsinim, disSicaklik,
    ongoruler, odalar, sinyal, programlar, programAdi, gecirgenlik, bfs, KAP };
})(typeof window !== "undefined" ? window : globalThis);
