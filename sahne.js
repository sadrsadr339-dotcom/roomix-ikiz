// ROOMIX A · dijital ikiz (4 Kasım planı): 3B sahne (three.js). Ölçüler cm → m; Rhino modeliyle aynı (Session_4_Final/01_Model).
// Eksenler: X = u/100 (koridor 0 → karşı 3,8), Z = s/100 (yatak ucu 0 → giriş 12,2), Y = kot/100.
// Klasik betik: index.html içindeki modül THREE'yi verir → window.SAHNE_KUR(THREE, araclar, kap).
(function () {
  "use strict";
  window.SAHNE_KUR = function (THREE, araclar, kap) {
    const { RoomEnvironment } = araclar;
    const I = window.IKIZ, O = I.OLCU;
    const cm = (x) => x / 100;

    // ---------------------------------------------------------------- çizici
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    renderer.setClearColor(0xdde3e7, 1);
    kap.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.12, 260);
    const gokTuval = document.createElement("canvas"); gokTuval.width = 4; gokTuval.height = 256;
    const gokDoku = new THREE.CanvasTexture(gokTuval); gokDoku.colorSpace = THREE.SRGBColorSpace;
    scene.background = gokDoku;
    let gokSon = "", sabitGok = null;
    function gokSabit(renk) { sabitGok = renk; scene.background = renk ? new THREE.Color(renk) : gokDoku; }
    function gokCiz(ust, alt) {
      if (sabitGok) return;
      const k = ust.getHexString() + alt.getHexString();
      if (k === gokSon) return; gokSon = k;
      const g = gokTuval.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "#" + ust.getHexString()); gr.addColorStop(1, "#" + alt.getHexString());
      g.fillStyle = gr; g.fillRect(0, 0, 4, 256); gokDoku.needsUpdate = true;
    }

    // ---------------------------------------------------------------- malzemeler
    const yukleyici = new THREE.TextureLoader();
    function doku(ad, tekrar) {
      const t = yukleyici.load(window.DOKULAR[ad]);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      t.userData.tekrar = tekrar; return t;
    }
    function delikDokusu() {
      const c = document.createElement("canvas"); c.width = c.height = 512;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 512, 512);
      g.fillStyle = "#000"; const a = 512 / 8, r = a * (20 / 45) / 2;
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc(a * i + a / 2, a * j + a / 2, r, 0, Math.PI * 2); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.userData.tekrar = 0.36; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }
    const D_MESE = doku("mese", 1.2), D_PARKE = doku("parke", 1.6), D_KUMAS = doku("kumas", 0.5), D_KOYU = doku("kumas_koyu", 0.5), D_FAYANS = doku("fayans", 0.9);
    const D_DELIK = delikDokusu();
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const MAT = {
      duvar: std({ color: 0xefebe6, roughness: 0.92 }), tavanAlti: std({ color: 0xe9e5df, roughness: 0.95 }),
      dis: std({ color: 0x8a8e93, roughness: 0.5, metalness: 0.35 }), poche: std({ color: 0x2a2224, roughness: 0.9 }),
      kaset: std({ color: 0x6b6d70, roughness: 0.8 }), parke: std({ map: D_PARKE, color: 0xf2ece4, roughness: 0.62 }),
      mese: std({ map: D_MESE, color: 0xffffff, roughness: 0.58 }), meseFume: std({ map: D_MESE, color: 0x7d6656, roughness: 0.6 }),
      kumas: std({ map: D_KUMAS, color: 0xd9d3ca, roughness: 0.98 }), kumasKoyu: std({ map: D_KOYU, color: 0x8a8a8e, roughness: 0.98 }),
      keten: std({ color: 0xece6db, roughness: 0.95 }), yorgan: std({ color: 0xf3efe8, roughness: 0.95 }), yastik: std({ color: 0xdcd5c9, roughness: 0.95 }),
      mavi: std({ color: 0xaebfd4, roughness: 0.95 }), beyaz: std({ color: 0xf4f2ee, roughness: 0.35 }), fayans: std({ map: D_FAYANS, color: 0xffffff, roughness: 0.3 }),
      cam: new THREE.MeshPhysicalMaterial({ color: 0xbfd6dd, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
      ayna: std({ color: 0xdfe5ea, roughness: 0.03, metalness: 1.0 }),
      alu: std({ color: 0x3b3e42, roughness: 0.4, metalness: 0.6 }), ray: std({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.8 }),
      celik: std({ color: 0x3d4045, roughness: 0.55, metalness: 0.5 }), tas: std({ color: 0xe8e4dd, roughness: 0.25 }),
      siyahCam: std({ color: 0x0f0f11, roughness: 0.12, metalness: 0.2 }), siyah: std({ color: 0x1b1b1d, roughness: 0.6 }),
      bordo: std({ color: 0x7a1f2b, roughness: 0.5, metalness: 0.3 }),
      delikli: std({ color: 0x7a1f2b, roughness: 0.52, metalness: 0.28, alphaMap: D_DELIK, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }),
      tv: std({ color: 0x0c0d10, roughness: 0.1, emissive: 0x6f8fb5, emissiveIntensity: 0 }),
      zemin: std({ color: 0xd9d4cc, roughness: 1 }), komsu: std({ color: 0xcfcac2, roughness: 0.95 }),
      golge: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
      kisi: new THREE.MeshStandardMaterial({ color: 0x7a1f2b, emissive: 0x7a1f2b, emissiveIntensity: 0.55, transparent: true, opacity: 0.9 }),
      komsuKisi: new THREE.MeshStandardMaterial({ color: 0xb5772a, emissive: 0xb5772a, emissiveIntensity: 0.55, transparent: true, opacity: 0.9 }),
      misafir: new THREE.MeshStandardMaterial({ color: 0x2f5d62, emissive: 0x2f5d62, emissiveIntensity: 0.55, transparent: true, opacity: 0.9 }),
      sensor: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7a1f2b, emissiveIntensity: 0.0, roughness: 0.4 }),
      led: new THREE.MeshStandardMaterial({ color: 0x3a3a3c, emissive: 0xffc47a, emissiveIntensity: 0, roughness: 0.35 }),
      sinyal: [0, 1, 2].map(() => new THREE.MeshStandardMaterial({ color: 0xd6d4ce, emissive: 0xffc47a, emissiveIntensity: 0, roughness: 0.3 })),
      yaprak: std({ color: 0x5f7f4e, roughness: 0.8 }), saksi: std({ color: 0xbe7a58, roughness: 0.8 }), toprak: std({ color: 0x4e3e32, roughness: 1 }),
      yoga: std({ color: 0x80907f, roughness: 0.9 }), kaucuk: std({ color: 0x232325, roughness: 0.8 }),
      kitap: [0x922f2b, 0x344a68, 0xe0d4bc, 0x405e4e, 0xc4963c].map((c) => std({ color: c, roughness: 0.7 })),
    };
    const DELIK_DERINLIK = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: D_DELIK, alphaTest: 0.5, side: THREE.DoubleSide });
    const delikliler = [];
    function delikliGolge(acik) { delikliler.forEach((m) => (m.customDepthMaterial = acik ? DELIK_DERINLIK : undefined)); }
    const kesitDuzlemi = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.05);
    const kesikMat = new Map();
    function kesik(m) {
      if (!kesikMat.has(m)) { const k = m.clone(); k.clippingPlanes = [kesitDuzlemi]; k.clipShadows = false; kesikMat.set(m, k); }
      return kesikMat.get(m);
    }
    function uvOlcek(g, w, h, d, mat) {
      const map = mat.map || mat.alphaMap;
      if (!map || !map.userData.tekrar) return;
      const T = map.userData.tekrar, uv = g.attributes.uv;
      const boyut = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * boyut[f][0] / T, uv.getY(i) * boyut[f][1] / T); }
    }
    const kok = new THREE.Group(); scene.add(kok);
    // çizim için katman etiketi: her bölüm başında kok'un çocuk sayısı not edilir, yapım bitince her nesneye bölüm adı yazılır
    const katmanSinir = [];
    function katmanBasla(ad) { katmanSinir.push({ ad, i: kok.children.length }); }
    function kutu(par, u0, u1, s0, s1, z0, z1, mat, o = {}) {
      const w = cm(Math.abs(u1 - u0)), h = cm(Math.abs(z1 - z0)), dd = cm(Math.abs(s1 - s0));
      const g = new THREE.BoxGeometry(Math.max(w, 0.002), Math.max(h, 0.002), Math.max(dd, 0.002));
      uvOlcek(g, w, h, dd, mat);
      const m = new THREE.Mesh(g, o.kesik ? kesik(mat) : mat);
      const org = par.userData.org || { u: 0, s: 0, z: 0 };
      m.position.set(cm((u0 + u1) / 2 - org.u), cm((z0 + z1) / 2 - org.z), cm((s0 + s1) / 2 - org.s));
      m.castShadow = o.golge !== false; m.receiveShadow = true;
      par.add(m); return m;
    }
    function grup(par, u, s, z, ad) {
      const g = new THREE.Group(); g.name = ad || "";
      const org = par.userData.org || { u: 0, s: 0, z: 0 };
      g.position.set(cm(u - org.u), cm(z - org.z), cm(s - org.s));
      g.userData.org = { u, s, z }; par.add(g); return g;
    }
    function cubuk(par, a, b, r, mat) {
      const org = par.userData.org || { u: 0, s: 0, z: 0 };
      const A = new THREE.Vector3(cm(a.u - org.u), cm(a.z - org.z), cm(a.s - org.s));
      const B = new THREE.Vector3(cm(b.u - org.u), cm(b.z - org.z), cm(b.s - org.s));
      const m = new THREE.Mesh(new THREE.CylinderGeometry(cm(r), cm(r), A.distanceTo(B), 10), mat);
      m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
      m.castShadow = true; par.add(m); return m;
    }
    function kure(par, u, s, z, r, mat, sy = 1) {
      const org = par.userData.org || { u: 0, s: 0, z: 0 };
      const m = new THREE.Mesh(new THREE.SphereGeometry(cm(r), 18, 14), mat);
      m.scale.y = sy; m.position.set(cm(u - org.u), cm(z - org.z), cm(s - org.s)); m.castShadow = true; par.add(m); return m;
    }
    // halat: tavandan (z üst) bir noktaya; konumu her karede ayarlanır
    function halat(par, u, s, r = 0.3) { const m = new THREE.Mesh(new THREE.CylinderGeometry(cm(r), cm(r), 0.01, 8), MAT.ray); m.castShadow = true; m.userData = { u, s }; par.add(m); return m; }
    function halatAyar(h, org, ust, alt) {
      const a = Math.max(0.001, cm(ust - alt)); h.scale.y = a / 0.01;
      h.position.set(cm(h.userData.u - org.u), cm((ust + alt) / 2 - org.z), cm(h.userData.s - org.s));
      h.visible = ust - alt > 1.5;
    }

    // ---------------------------------------------------------------- zemin, çevre
    const W = O.W, L = O.L, H = O.H, CL = 4.1;
    MAT.zemin = new THREE.ShadowMaterial({ color: 0x1e1614, opacity: 0.3 });
    const zemin = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), MAT.zemin);
    zemin.rotation.x = -Math.PI / 2; zemin.position.set(1.9, -0.4, 6.1); zemin.receiveShadow = true; scene.add(zemin);
    scene.fog = new THREE.Fog(0xd9d8d4, 34, 90);   // uzaktaki komşu blokları arka plana karışsın
    const komsular = new THREE.Group(); scene.add(komsular);
    [[-26, -44, 12, 13, 9], [8, -52, 16, 18, 10], [38, -30, 10, 10, 14], [-48, -8, 10, 15, 12], [46, 16, 9, 11, 13], [-30, 44, 14, 9, 9], [18, 54, 12, 14, 12]]
      .forEach(([x, z, w, h, dd]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), MAT.komsu); m.position.set(x, h / 2 - 0.4, z); m.castShadow = m.receiveShadow = true; komsular.add(m); });

    // ---------------------------------------------------------------- taşıyıcı, döşeme, çatı
    katmanBasla("yapi");
    kutu(kok, -CL + 0.3, W + CL - 0.3, -CL + 0.3, L + CL - 0.3, -25, -0.7, MAT.kaset);
    kutu(kok, 20, 360, 20, 1200, -0.6, 0, MAT.parke, { golge: false });
    kutu(kok, 130, 360, 1013.5, 1200, 0, 0.8, MAT.fayans, { golge: false });
    for (const u of [10, 360]) for (const s of [10, 305, 605, 905, 1200]) {
      kutu(kok, u, u + 10, s, s + 10, -40, -25, MAT.celik);
      kutu(kok, u - 10, u + 20, s - 10, s + 20, -40, -38, MAT.kaset);
      kutu(kok, u === 10 ? 9.5 : 359.3, u === 10 ? 20.7 : 370.5, s === 1200 ? 1199.3 : s - 0.5, s === 10 ? 20.7 : s + 10.5, 0, H, MAT.celik, { kesik: u === 10 });
    }
    const cati = kutu(kok, -CL, W + CL, -CL, L + CL, H, 300, MAT.golge);
    const tavan = kutu(kok, 20, 360, 20, 1200, H, H + 1, MAT.tavanAlti, { golge: false });

    // ---------------------------------------------------------------- duvarlar ve pencereler
    katmanBasla("zarf");
    function pencere(eksen, sabit, a0, a1, z0, z1, kes, par = kok, kayit = []) {
      const p = 2.5, kal = 5, o = { kesik: kes };
      if (eksen === "s") {
        kutu(par, sabit - kal / 2, sabit + kal / 2, a0, a0 + p, z0, z1, MAT.alu, o); kutu(par, sabit - kal / 2, sabit + kal / 2, a1 - p, a1, z0, z1, MAT.alu, o);
        kutu(par, sabit - kal / 2, sabit + kal / 2, a0, a1, z0, z0 + p, MAT.alu, o); kutu(par, sabit - kal / 2, sabit + kal / 2, a0, a1, z1 - p, z1, MAT.alu, o);
        for (const m of kayit) kutu(par, sabit - kal / 2, sabit + kal / 2, m - 1.75, m + 1.75, z0, z1, MAT.alu, o);
        const c = kutu(par, sabit - 0.6, sabit + 0.6, a0 + p, a1 - p, z0 + p, z1 - p, MAT.cam, { golge: false, kesik: kes }); c.castShadow = false;
      } else {
        kutu(par, a0, a0 + p, sabit - kal / 2, sabit + kal / 2, z0, z1, MAT.alu); kutu(par, a1 - p, a1, sabit - kal / 2, sabit + kal / 2, z0, z1, MAT.alu);
        kutu(par, a0, a1, sabit - kal / 2, sabit + kal / 2, z0, z0 + p, MAT.alu); kutu(par, a0, a1, sabit - kal / 2, sabit + kal / 2, z1 - p, z1, MAT.alu);
        for (const m of kayit) kutu(par, m - 1.75, m + 1.75, sabit - kal / 2, sabit + kal / 2, z0, z1, MAT.alu);
        const c = kutu(par, a0 + p, a1 - p, sabit - 0.6, sabit + 0.6, z0 + p, z1 - p, MAT.cam, { golge: false }); c.castShadow = false;
      }
    }
    // boy duvarı: u0–u1 kalınlık, açıklıklar [s0, s1, z0, z1, kayıtlar]
    function boyDuvar(u0, u1, aciklik, kes, disYuz) {
      const kenar = [0, ...aciklik.flatMap((a) => [a[0], a[1]]), L];
      const parca = [];
      for (let i = 0; i < kenar.length; i += 2) parca.push([kenar[i], kenar[i + 1], 0, H]);
      for (const a of aciklik) { parca.push([a[0], a[1], 0, a[2]]); parca.push([a[0], a[1], a[3], H]); }
      for (const [s0, s1, z0, z1] of parca) {
        if (s1 - s0 < 0.5 || z1 - z0 < 0.5) continue;
        kutu(kok, u0, u1, s0, s1, z0, z1, MAT.duvar, { kesik: kes });
        const du0 = disYuz < 0 ? -CL : W, du1 = disYuz < 0 ? 0 : W + CL;
        kutu(kok, du0, du1, s0 - (s0 === 0 ? CL : 0), s1 + (s1 === L ? CL : 0), z0 === 0 ? -25 : z0, z1 === H ? 300 - 30 : z1, MAT.dis, { kesik: kes });
      }
      for (const a of aciklik) pencere("s", (u0 + u1) / 2, a[0], a[1], a[2], a[3], kes, kok, a[4] || []);
    }
    const KOR_PEN = [[40.5, 121, 10, 232], [200, 280.5, 10, 232], [388, 532, 10, 232], [639.5, 719.5, 10, 232], [799.5, 879.5, 10, 232]];
    const KAR_PEN = O.pencere.KAR.map(([a, b]) => [a, b, 10, 232]);
    // koridor duvarı (kesitte kesik): P-K1 ve P-K3'ün orta kanadı ayrı (havalandırma kanadı açılır)
    boyDuvar(0, 20, [[40.5, 280.5, 10, 232, [121, 200]], [388, 532, 10, 232], [639.5, 879.5, 10, 232, [719.5, 799.5]]], true, -1);
    boyDuvar(360, 380, KAR_PEN, false, +1);
    for (const [a, b] of [[95.6, 145.6], [185.6, 235.6]]) kutu(kok, 366.3, 367, a + 2.5, b - 2.5, 12.5, 76, MAT.siyah, { golge: false });   // opak cam: alçak dolap arkası
    // koridor penceresinin açılır kanadı (P-K1 orta, s 121–200): içe döner
    const kanat = grup(kok, 12, 121, 0, "kanat");
    kutu(kanat, 10.5, 13.5, 121, 200, 13, 229, MAT.alu, { kesik: true });
    kutu(kanat, 11.4, 12.6, 124, 197, 16, 226, MAT.cam, { golge: false, kesik: true });
    const kesitBasliklari = new THREE.Group(); kok.add(kesitBasliklari);
    [[0, 40.5], [280.5, 388], [532, 639.5], [879.5, 1220]].forEach(([a, b]) => kutu(kesitBasliklari, -CL, 20.9, a, b, 0, 1.2, MAT.poche, { golge: false }));

    // giriş ucu: kapı (net 90 × 240) + boş duvar (kişisel eşik) + sinyal ikizi
    katmanBasla("giris");
    {
      const kapi = O.kapi;
      const parca = [[0, kapi.u0, 0, H], [kapi.u1, W, 0, H], [kapi.u0, kapi.u1, kapi.h, H]];
      for (const [u0, u1, z0, z1] of parca) { kutu(kok, u0, u1, 1200, 1220, z0, z1, MAT.duvar); kutu(kok, u0, u1, L, L + CL, z0 === 0 ? -25 : z0, z1 === H ? 270 : z1, MAT.dis); }
      kutu(kok, kapi.u0, kapi.u0 + 1, 1208, 1220, 0, kapi.h, MAT.alu); kutu(kok, kapi.u1 - 1, kapi.u1, 1208, 1220, 0, kapi.h, MAT.alu);
      kutu(kok, kapi.u0, kapi.u1, 1208, 1220, kapi.h - 1, kapi.h, MAT.alu);
      kutu(kok, kapi.u0 + 1, kapi.u1 - 1, 1212, 1216, 0.5, kapi.h - 1, MAT.bordo);
      cubuk(kok, { u: kapi.u1 - 8.6, s: 1219.5, z: 75 }, { u: kapi.u1 - 8.6, s: 1219.5, z: 195 }, 1.2, MAT.ray);
    }
    const sinyalBolme = [];
    kutu(kok, 116.8, 123.2, L + CL, L + CL + 2.4, 58, 222, MAT.alu);
    [[168, 218], [113, 163], [62, 108]].forEach(([z0, z1], k) => sinyalBolme.push(kutu(kok, 117.6, 122.4, L + CL + 2.4, L + CL + 2.9, z0, z1, MAT.sinyal[k], { golge: false })));
    // sahanlık + eşik bahçesi (kullanıcının varsayılan kurgusu)
    kutu(kok, -CL, W + CL, L + CL, L + 150, -20, -1, MAT.kaset); kutu(kok, -CL, W + CL, L + 150, L + 182, -40, -20, MAT.kaset);
    kutu(kok, 115.5, W, 1275, 1280, -1, 30, MAT.kaset); kutu(kok, 115.5, 120.5, L + CL, 1275, -1, 30, MAT.kaset); kutu(kok, W - 5, W, L + CL, 1275, -1, 30, MAT.kaset);
    kutu(kok, 120.5, W - 5, L + CL, 1275, -1, 26, MAT.toprak);
    kutu(kok, 123, W - 8, L + CL + 1, L + CL + 13, 26, 56, MAT.yaprak);
    for (const [u, r] of [[175, 16], [318, 16], [141, 10], [205, 9], [287, 9], [353, 10]]) kure(kok, u, 1255, 26 + r * 0.8, r, MAT.yaprak, 0.85);
    cubuk(kok, { u: 247, s: 1252, z: 26 }, { u: 247, s: 1252, z: 118 }, 2.2, MAT.meseFume); kure(kok, 247, 1252, 140, 24, MAT.yaprak, 1.15);

    // ---------------------------------------------------------------- yatak ucu: tam cam + seki + 3×2 katlanır panjur
    katmanBasla("yatakUcu");
    kutu(kok, 0, 20, 0, 20, 0, H, MAT.duvar); kutu(kok, 360, W, 0, 20, 0, H, MAT.duvar);
    kutu(kok, 20, 360, 0, 20, 0, 40, MAT.duvar); kutu(kok, 20, 360, 0, 20, 268, H, MAT.duvar);
    kutu(kok, -CL, W + CL, -CL, 0, -25, 38.5, MAT.dis); kutu(kok, -CL, 20, -CL, 0, 38.5, H, MAT.dis); kutu(kok, 360, W + CL, -CL, 0, 38.5, H, MAT.dis);
    kutu(kok, -CL, W + CL, -CL, 0, 268, 270, MAT.dis);
    for (const [a, b] of O.panjur.seritler) pencere("u", 6, a, b, 40, 268, false);
    kutu(kok, 20, 360, 8, 45, 0.5, 40, MAT.mese);                          // boydan boya seki (5 çekmece)
    for (const u of [88, 156, 224, 292]) kutu(kok, u - 0.15, u + 0.15, 45, 45.3, 1, 37, MAT.siyah, { golge: false });
    for (const [a, b] of [[21, 132], [134.5, 245.5], [248, 359]]) kutu(kok, a, b, 9, 46.5, 40, 48, MAT.kumasKoyu);
    // panjur taşıyıcısı: dikmeler + menteşe kirişleri (bordo)
    const SF = -(CL + 9);
    for (const [a] of O.panjur.seritler.concat([[360]])) kutu(kok, a - 2, a + 2, SF - 2, -CL - 0.5, 36, 272, MAT.bordo);
    for (const [z0, z1] of [[36, 40], [127.5, 132.5], [268, 272]]) kutu(kok, 18, 362, SF - 2, -CL - 0.5, z0, z1, MAT.bordo);
    const ledCizgi = kutu(kok, 20, 360, SF - 3, SF - 2, 36.5, 39.5, MAT.led, { golge: false });
    const panjurlar = [];
    [O.panjur.alt, O.panjur.ust].forEach(([z0, z1], sira) => {
      O.panjur.seritler.forEach(([u0, u1], i) => {
        const yuk = z1 - z0, h = yuk / 2, gen = u1 - u0 - 4.6, ust = sira === 1;
        const mentese = ust ? z1 : z0;
        const k1 = grup(kok, (u0 + u1) / 2, SF, mentese, "panjur");
        const kanatCiz = (par) => {
          const yon = ust ? -1 : 1, org = par.userData.org;
          const z0k = ust ? -h + 0.6 : 0.6, z1k = ust ? -0.6 : h - 0.6;
          const pl = new THREE.Mesh(new THREE.PlaneGeometry(cm(gen - 6), cm(h - 7)), MAT.delikli);
          const uv = pl.geometry.attributes.uv;
          for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * cm(gen - 6) / 0.36, uv.getY(q) * cm(h - 7) / 0.36);
          pl.position.set(0, cm(yon * h / 2), 0); pl.castShadow = true; pl.receiveShadow = true; pl.customDepthMaterial = DELIK_DERINLIK; delikliler.push(pl); par.add(pl);
          const cer = (a, b, c, e) => kutu(par, org.u + a, org.u + b, org.s - 1.2, org.s + 1.2, org.z + c, org.z + e, MAT.bordo);
          cer(-gen / 2, -gen / 2 + 3, Math.min(z0k, z1k), Math.max(z0k, z1k)); cer(gen / 2 - 3, gen / 2, Math.min(z0k, z1k), Math.max(z0k, z1k));
          cer(-gen / 2, gen / 2, Math.min(z0k, z1k), Math.min(z0k, z1k) + 3); cer(-gen / 2, gen / 2, Math.max(z0k, z1k) - 3, Math.max(z0k, z1k));
        };
        kanatCiz(k1);
        const k2 = grup(k1, (u0 + u1) / 2, SF, mentese + (ust ? -h : h), "panjur2");
        kanatCiz(k2);
        panjurlar.push({ k1, k2, ust, i, sira });
      });
    });

    // ---------------------------------------------------------------- banyo ve mutfak (sabit çekirdek)
    katmanBasla("cekirdek");
    kutu(kok, 120, 360, 1001.8, 1013.5, 0, H, MAT.duvar);
    kutu(kok, 120, 130, 1103.5, 1200, 0, H, MAT.duvar);
    kutu(kok, 120, 130, 1013.5, 1103.5, 210, H, MAT.duvar);
    { const k = grup(kok, 128, 1014.5, 0, "banyoKapi"); kutu(k, 125.5, 128, 1014.5, 1102.5, 0.5, 208, MAT.mese); k.rotation.y = 0.18; }
    kutu(kok, 130, 360, 1199, 1200, 0, 220, MAT.fayans, { golge: false });
    kutu(kok, 150, 184, 1192, 1199, 0, 110, MAT.fayans); kutu(kok, 152, 182, 1140, 1192, 28, 40.5, MAT.beyaz);
    kutu(kok, 206.9, 286.9, 1153, 1199, 45, 78, MAT.mese); kutu(kok, 208, 285.8, 1151.2, 1199, 78, 86, MAT.beyaz);
    kutu(kok, 210, 284, 1198.2, 1199, 110, 190, MAT.ayna, { golge: false });
    kutu(kok, 297, 359, 1082, 1199, 0, 3, MAT.beyaz); kutu(kok, 293.5, 294.5, 1082, 1199, 3, 200, MAT.cam, { golge: false });
    kutu(kok, 298, 358, 1016, 1076, 0, 85, MAT.beyaz); kutu(kok, 298, 358, 1016, 1076, 85.5, 170, MAT.beyaz);
    kutu(kok, 296.8, 298, 1027, 1065, 20, 60, MAT.siyahCam); kutu(kok, 296.8, 298, 1027, 1065, 105, 145, MAT.siyahCam);
    kutu(kok, 293, 360, 1013.5, 1078.5, 172, H, MAT.mese);
    // mutfak: 65 cm tezgâh + 11 cm niş (U3 dayandığı için kulpsuz), üst dolaplar
    kutu(kok, 120, 360, 927.5, 990.7, 10, 86, MAT.mese); kutu(kok, 120, 360, 931.7, 990.7, 0, 10, MAT.siyah);
    for (const u of [180, 207, 257, 289, 324.5]) kutu(kok, u - 0.15, u + 0.15, 925.4, 925.7, 12, 84, MAT.siyah, { golge: false });
    kutu(kok, 120, 360, 925.7, 990.7, 86, 90, MAT.tas);
    kutu(kok, 296, 346, 936, 980, 89.6, 90.4, MAT.ray); kutu(kok, 215.8, 248.7, 930.5, 989.5, 90, 90.6, MAT.siyahCam);
    kutu(kok, 120, 360, 990.7, 1001.8, 0, 106, MAT.mese); kutu(kok, 120, 360, 990.2, 1001.8, 104, 106, MAT.tas);
    kutu(kok, 120, 360, 968.6, 1000.8, 150, H, MAT.mese);
    for (const u of [180, 240, 300]) kutu(kok, u - 0.15, u + 0.15, 966.5, 966.8, 152, 268, MAT.siyah, { golge: false });
    cubuk(kok, { u: 321, s: 987, z: 90 }, { u: 321, s: 987, z: 127 }, 1.2, MAT.ray); cubuk(kok, { u: 321, s: 987, z: 127 }, { u: 321, s: 962, z: 120 }, 1.1, MAT.ray);

    // ---------------------------------------------------------------- yatak odası: alçak dolap, katlanır masa, sandalye
    katmanBasla("mobilya");
    kutu(kok, 332.5, 360, 74.1, 254.1, 1, 75, MAT.mese);
    const calisma = grup(kok, 332, 165, 75, "calisma");
    kutu(calisma, 329, 332, 85, 245, 2, 75, MAT.mese);
    const sandalye = new THREE.Group(); kok.add(sandalye);
    { const g = grup(sandalye, 205, 165, 0); kutu(g, 182, 228, 142, 188, 41, 48, MAT.kumasKoyu); kutu(g, 175, 181, 145, 185, 55, 100, MAT.kumasKoyu);
      cubuk(g, { u: 205, s: 165, z: 8 }, { u: 205, s: 165, z: 41 }, 1.4, MAT.ray); kutu(g, 183, 227, 163, 167, 4, 7, MAT.siyah); kutu(g, 203, 207, 143, 187, 4, 7, MAT.siyah); }
    const lamba = new THREE.Group(); kok.add(lamba);
    { const g = grup(lamba, 283, 120, 75); cubuk(g, { u: 283, s: 120, z: 75 }, { u: 283, s: 120, z: 112 }, 0.8, MAT.siyah); kutu(g, 270.5, 295.5, 107.5, 132.5, 108, 122, MAT.keten); kutu(g, 266, 288, 150, 182, 75, 76.4, MAT.siyah); }

    // ---------------------------------------------------------------- TAVAN SİSTEMİ (Horror Vacui): ızgaralar, yatak, koltuk, 14 kutu
    katmanBasla("tavanSistemi");
    function izgara(u0, u1, s0, s1, us, ss, eksik = []) {
      kutu(kok, u0, u0 + 3, s0, s1, O.tavanAlt, H, MAT.meseFume); kutu(kok, u1 - 3, u1, s0, s1, O.tavanAlt, H, MAT.meseFume);
      kutu(kok, u0, u1, s0, s0 + 3, O.tavanAlt, H, MAT.meseFume); kutu(kok, u0, u1, s1 - 3, s1, O.tavanAlt, H, MAT.meseFume);
      us.forEach(([u, a, b]) => kutu(kok, u - 3, u + 3, a, b, O.tavanAlt, H, MAT.meseFume));
      ss.forEach(([s, a, b]) => kutu(kok, a, b, s - 3, s + 3, O.tavanAlt, H, MAT.meseFume));
    }
    izgara(53, 332.5, 37.7, 290.7, [[103, 40.7, 287.7], [219.3, 40.7, 87.7], [219.3, 240.7, 287.7]], [[87.7, 56, 329.5], [240.7, 56, 329.5]]);
    izgara(123, 360, 560.2, 738.3, [[203, 623.3, 738.3], [300.6, 623.3, 738.3], [251.8, 660.3, 738.3]], [[620.3, 126, 357], [660.3, 126, 357]]);
    // tavan yatağı
    const Y = O.yatak;
    const yatak = grup(kok, Y.u0, Y.s0, 0, "yatak");
    kutu(yatak, Y.u0, Y.u1, Y.s0, Y.s1, 0, 8, MAT.meseFume);
    kutu(yatak, Y.u0 + 0.5, Y.u1 - 0.5, Y.s0 + 0.5, Y.s1 - 0.5, 8.5, 23, MAT.beyaz);
    kutu(yatak, Y.u0 + 1, 289, Y.s0 + 0.8, Y.s1 - 0.8, 23, 26.5, MAT.yorgan);
    kutu(yatak, 292, 326, 95, 162, 23, 31, MAT.yastik); kutu(yatak, 292, 326, 166, 233, 23, 31, MAT.yastik);
    const yatakHalat = [[Y.u0 + 2, Y.s0 + 2], [Y.u1 - 2, Y.s0 + 2], [Y.u0 + 2, Y.s1 - 2], [Y.u1 - 2, Y.s1 - 2]].map(([u, s]) => halat(kok, u, s));
    // tavan kutuları
    const tkGrup = {};
    I.TAVAN.forEach((k) => {
      const g = grup(kok, k.u0, k.s0, O.tavanAlt, "tk-" + k.id), a0 = k.u0 + 0.5, a1 = k.u1 - 0.5, b0 = k.s0 + 0.5, b1 = k.s1 - 0.5;
      if (k.tur === "raf" || k.tur === "spor") {
        const hh = k.tur === "raf" ? 14 : 10;
        kutu(g, a0, a1, b0, b1, O.tavanAlt, O.tavanAlt + 2, MAT.mese);
        kutu(g, a0, a1, b0, b0 + 1.8, O.tavanAlt + 2, O.tavanAlt + hh, MAT.mese); kutu(g, a0, a1, b1 - 1.8, b1, O.tavanAlt + 2, O.tavanAlt + hh, MAT.mese);
        kutu(g, a0, a0 + 1.8, b0, b1, O.tavanAlt + 2, O.tavanAlt + hh, MAT.mese); kutu(g, a1 - 1.8, a1, b0, b1, O.tavanAlt + 2, O.tavanAlt + hh, MAT.mese);
        const z = O.tavanAlt + 2;
        if (k.tur === "raf") {
          for (const [u, s] of [[66.3, 100.5], [81.4, 99.8], [70.4, 113.5]]) { kutu(g, u - 5, u + 5, s - 5, s + 5, z, z + 11, MAT.saksi); kure(g, u, s, z + 17, 8, MAT.yaprak, 0.9); }
          let s = 124, j = 0;
          while (s < 234) { const th = 2.4 + (j % 3) * 0.6, hh2 = 20 + (j * 7) % 9; kutu(g, 60, 60 + 15 + (j % 2) * 3, s, s + th, z, z + hh2, MAT.kitap[j % 5]); s += th + (j % 7 === 6 ? 6 : 0.15); j++; }
        } else {
          for (const uc of [317, 343]) for (let q = 0; q < 9; q++) {
            const s = 670 + q * 7.6, rr = 2.6 + q * 0.3;
            cubuk(g, { u: uc - 7, s, z: z + 6 + rr }, { u: uc + 7, s, z: z + 6 + rr }, 1.4, MAT.ray);
            cubuk(g, { u: uc - 11, s, z: z + 6 + rr }, { u: uc - 7, s, z: z + 6 + rr }, rr, MAT.kaucuk);
            cubuk(g, { u: uc + 7, s, z: z + 6 + rr }, { u: uc + 11, s, z: z + 6 + rr }, rr, MAT.kaucuk);
          }
        }
        g.userData.ust = hh;
      } else {
        kutu(g, a0, a1, b0, b1, O.tavanAlt, O.tavanAlt + O.kutuH, MAT.mese);
        const uc = (a0 + a1) / 2;
        kutu(g, uc - 7, uc + 7, b0 - 0.3, b0, O.tavanAlt + O.kutuH - 8, O.tavanAlt + O.kutuH - 4, MAT.siyah, { golge: false });
        kutu(g, uc - 7, uc + 7, b1, b1 + 0.3, O.tavanAlt + O.kutuH - 8, O.tavanAlt + O.kutuH - 4, MAT.siyah, { golge: false });
        g.userData.ust = O.kutuH;
      }
      tkGrup[k.id] = { g, halat: [[a0 + 2.5, b0 + 2.5], [a1 - 2.5, b0 + 2.5], [a0 + 2.5, b1 - 2.5], [a1 - 2.5, b1 - 2.5]].map(([u, s]) => halat(kok, u, s, 0.25)), k };
    });
    // iner koltuk: platform + oturak + minder + kollar; sırtlık menteşede yatar / kalkar, ayaklar en sonda açılır
    const KO = O.koltuk;
    const koltuk = grup(kok, KO.u0, KO.s0, 0, "koltuk");
    kutu(koltuk, KO.u0, KO.u1, KO.s0, KO.s1, 0, 4, MAT.mese);
    kutu(koltuk, 145.5, 336, 571, 619, 4, 10, MAT.kumas);
    for (const [a, b] of [[145.5, 205.5], [210.5, 270.5], [276, 336]]) kutu(koltuk, a + 0.3, b - 0.3, 571.5, 618.8, 10, 22, MAT.kumas);
    kutu(koltuk, 135.5, 145.5, 571, 619, 4, 30, MAT.kumas); kutu(koltuk, 336, 346, 571, 619, 4, 30, MAT.kumas);
    kutu(koltuk, 135.5, 346, 561, 571, 4, 22, MAT.kumas);                    // sabit arka bant
    const sirt = grup(koltuk, 240, 566, 22, "sirt");                          // sırtlık: pakette oturağın üstüne yatar
    kutu(sirt, 135.5, 346, 561, 571, 22, 66, MAT.kumas);
    const kirlent = new THREE.Group(); koltuk.add(kirlent);
    { const g = grup(kirlent, 0, 0, 0); kutu(g, 150, 200, 571.5, 584, 22, 52, MAT.kumasKoyu); kutu(g, 281, 331, 571.5, 584, 22, 52, MAT.kumasKoyu); }
    const koltukAyak = [[KO.u0 + 3, KO.s0 + 3], [KO.u1 - 6, KO.s0 + 3], [KO.u0 + 3, KO.s1 - 6], [KO.u1 - 6, KO.s1 - 6]].map(([u, s]) => kutu(koltuk, u, u + 3, s, s + 3, -24, 0, MAT.siyah));
    const koltukHalat = [[KO.u0 + 4.5, KO.s0 + 4.5], [KO.u1 - 4.5, KO.s0 + 4.5], [KO.u0 + 4.5, KO.s1 - 4.5], [KO.u1 - 4.5, KO.s1 - 4.5]].map(([u, s]) => halat(kok, u, s));
    // bölme motorları (kutu inince görünür)
    I.TAVAN.forEach((k) => { const uc = (k.u0 + k.u1) / 2, sc = (k.s0 + k.s1) / 2, hw = Math.min(12, (k.u1 - k.u0) / 2 - 3); kutu(kok, uc - hw, uc + hw, sc - 4, sc + 4, O.motor, H, MAT.siyah, { golge: false }); });

    // ---------------------------------------------------------------- KUTU HATTI: ana hat + istasyon (kör hat) + bekleme hattı + döner makas
    katmanBasla("kutuHatti");
    const HT = O.hat, hatGrup = new THREE.Group(); kok.add(hatGrup);
    kutu(hatGrup, HT.J.u - 2, HT.J.u + 2, HT.J.s + 20, 1001.8, 266, H, MAT.ray);            // ana hat (güneye)
    kutu(hatGrup, HT.J.u - 2, HT.J.u + 2, 345, HT.J.s - 20, 266, H, MAT.ray);               // bekleme hattı (kuzeye, 5 Kas)
    kutu(hatGrup, HT.J.u + 20, 357, HT.J.s - 2, HT.J.s + 2, 266, H, MAT.ray);               // istasyon (doğuya)
    { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 32), MAT.alu); m.position.set(cm(HT.J.u), cm(268), cm(HT.J.s)); hatGrup.add(m); }
    for (const [ad, s] of Object.entries(HT.durak)) kutu(hatGrup, HT.J.u - 30, HT.J.u + 30, s - 14, s + 14, 268.5, 269, MAT.bordo, { golge: false });
    const kutular = {};
    I.KUTULAR.forEach((k) => {
      const g = grup(hatGrup, 0, 0, 0, "kh-" + k.id), b = HT.kutu;
      kutu(g, -b.w / 2, b.w / 2, -b.d / 2, b.d / 2, 0, b.h, MAT.mese);
      const renk = std({ color: new THREE.Color(k.renk), roughness: 0.6 });
      kutu(g, -b.w / 2 - 0.5, b.w / 2 + 0.5, -b.d / 2 - 0.5, b.d / 2 + 0.5, b.h - 5, b.h - 2, renk);
      const araba = kutu(g, -5, 5, -4, 4, 0, 3.5, MAT.alu);                 // rayda kalır; kutu halatla iner
      const h1 = cubuk(g, { u: -18, s: 0, z: b.h }, { u: -18, s: 0, z: b.h + 1 }, 0.3, MAT.ray);
      const h2 = cubuk(g, { u: 18, s: 0, z: b.h }, { u: 18, s: 0, z: b.h + 1 }, 0.3, MAT.ray);
      kutular[k.id] = { g, h: [h1, h2], araba };
    });

    // ---------------------------------------------------------------- KAYAN BİRİMLER
    katmanBasla("birim");
    function derzler(par, yuzS, u0, u1, z0, z1, kolonlar, satirlar, yon) {
      for (const u of kolonlar) kutu(par, u - 0.25, u + 0.25, yuzS - (yon > 0 ? 0 : 0.6), yuzS + (yon > 0 ? 0.6 : 0), z0, z1, MAT.siyah, { golge: false });
      for (const z of satirlar) kutu(par, u0, u1, yuzS - (yon > 0 ? 0 : 0.6), yuzS + (yon > 0 ? 0.6 : 0), z - 0.25, z + 0.25, MAT.siyah, { golge: false });
    }
    // U1: yataklı dolap (her planda en üstte); +s yüzünden tek kişilik yatak açılır
    const U1k = O.U1.k;
    const unite1 = grup(kok, 120, O.U1.s, 0, "U1");
    kutu(unite1, 123, 359.5, O.U1.s, O.U1.s + U1k, 1, 262, MAT.mese);
    derzler(unite1, O.U1.s, 123, 359.5, 1, 262, [182.1, 241.2, 300.4], [95, 205], -1);
    derzler(unite1, O.U1.s + U1k, 123, 359.5, 1, 262, [158], [95, 150, 205], +1);
    for (const u of [178, 186, 237, 245, 296, 304]) kutu(unite1, u - 0.6, u + 0.6, O.U1.s - 2.6, O.U1.s, 110, 150, MAT.siyah);
    // menteşe +0,24: açılınca şilte üstü +0,42 (ayaklar en sonda açılır)
    const misafirYatak = grup(unite1, 160, O.U1.s + U1k, 24, "misafirYatak");
    kutu(misafirYatak, 160, 356, O.U1.s + U1k - 5, O.U1.s + U1k - 2, 24, 96, MAT.mese);
    kutu(misafirYatak, 163, 353, O.U1.s + U1k - 18, O.U1.s + U1k - 5, 26, 94, MAT.beyaz);
    kutu(misafirYatak, 163, 316, O.U1.s + U1k - 19.5, O.U1.s + U1k - 18, 26, 94, MAT.mavi);
    kutu(misafirYatak, 330, 352, O.U1.s + U1k - 25, O.U1.s + U1k - 18, 29, 69, MAT.yastik);
    const misafirAyak = [166, 348].map((u) => kutu(unite1, u, u + 3, O.U1.s + U1k + 64, O.U1.s + U1k + 67, 0, 26, MAT.siyah));
    // U2: gardırop, açık yüzü −s (2. yatak odasına), arka yüzünde boy aynası
    const U2k = O.U2.k;
    const unite2 = grup(kok, 120, 0, 0, "U2");
    kutu(unite2, 123, 359.5, U2k - 2, U2k, 3, 262, MAT.mese);
    kutu(unite2, 123, 125, 0, U2k - 2, 3, 262, MAT.mese); kutu(unite2, 357.5, 359.5, 0, U2k - 2, 3, 262, MAT.mese);
    kutu(unite2, 123, 359.5, 0, U2k - 2, 3, 5, MAT.mese); kutu(unite2, 123, 359.5, 0, U2k - 2, 260, 262, MAT.mese);
    kutu(unite2, 178.7, 180.5, 2, U2k - 2, 5, 260, MAT.mese);
    for (const z of [94, 134, 170, 205]) kutu(unite2, 125, 178.7, 3, U2k - 2, z, z + 1.8, MAT.mese);
    cubuk(unite2, { u: 182, s: U2k / 2, z: 196 }, { u: 356, s: U2k / 2, z: 196 }, 0.8, MAT.ray);
    [0x2b3a55, 0xe8e2d6, 0x7a1f2b, 0x6b6f73, 0xc9b79c, 0x1f2a24, 0xd8d2c8, 0x8c6b52, 0x3d4a5c, 0xb4a48a, 0x2f2f33, 0x9aa3a8].forEach((c, k) => {
      const u = 190 + k * 13.5, uz = 75 + ((k * 37) % 50);
      kutu(unite2, u, u + 9, 8, U2k - 8, 196 - uz, 194, std({ color: c, roughness: 0.95 }));
    });
    for (const [z, c] of [[96, 0xd8d2c8], [104, 0x2b3a55], [136, 0x6b6f73], [172, 0xe8e2d6]]) kutu(unite2, 132, 172, 8, 36, z, z + 6, std({ color: c, roughness: 0.95 }));
    kutu(unite2, 205, 335, U2k, U2k + 0.6, 20, 205, MAT.ayna, { golge: false });
    const dolapKapaklari = [];
    [[125, 178.7, 0], [180.5, 269, 0], [269, 357.5, 1]].forEach(([a, b, sag], k) => {
      for (const [z0, z1] of [[5, 205], [207, 260]]) {
        const hu = sag ? b : a, kg = grup(unite2, hu, 0, 0, "kapak");
        kutu(kg, a + 0.3, b - 0.3, 0, 1.8, z0 + 0.3, z1 - 0.3, MAT.mese);
        kutu(kg, sag ? a + 1 : b - 2, sag ? a + 2 : b - 1, -0.6, 0, z0 + 60, Math.min(z1 - 10, z0 + 120), MAT.siyah, { golge: false });
        kg.userData.yon = sag ? -1 : 1; kg.userData.ilk = k === 0 && z0 < 100;
        dolapKapaklari.push(kg);
      }
    });
    // U3: TV (−s, salona) + yemek masası (+s, mutfağa)
    const U3k = O.U3.k;
    const unite3 = grup(kok, 120, 0, 0, "U3");
    kutu(unite3, 124, 359.5, 0, 27, 3, 262, MAT.mese);
    derzler(unite3, 0, 124, 359.5, 3, 262, [187.8, 292.2], [205], -1);
    derzler(unite3, 27, 124, 359.5, 3, 262, [161.7, 261.7], [130], +1);
    const tvEkran = kutu(unite3, 188.6, 291.4, -0.8, 0, 76, 135, MAT.tv, { golge: false });
    const masaKanat = [];
    for (const [a, b] of [[161.9, 211.6], [211.8, 261.5]]) {
      const kg = grup(unite3, (a + b) / 2, 28, 75, "masa");
      kutu(kg, a, b, 27.2, 29.5, 75, 155, MAT.mese);
      masaKanat.push(kg);
    }
    const masaAyaklari = masaKanat.map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.72, 8), MAT.siyah); m.castShadow = true; kok.add(m); return m; });
    const tabureler = new THREE.Group(); kok.add(tabureler);
    for (const [u0, ds] of [[120, 37.6], [271.2, 37.6], [120, 75.6], [271.2, 75.6]]) {
      const g = grup(tabureler, u0, ds, 0); kutu(g, u0, u0 + 30, ds, ds + 30, 42, 45, MAT.mese);
      for (const [du, dz] of [[1, 1], [26.5, 1], [1, 26.5], [26.5, 26.5]]) kutu(g, u0 + du, u0 + du + 2.5, ds + dz, ds + dz + 2.5, 0, 42, MAT.mese);
    }
    const kahvalti = new THREE.Group(); kok.add(kahvalti);
    { const g = grup(kahvalti, 179, 50.6, 75); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 24), MAT.beyaz); m.position.set(0, 0.006, 0); g.add(m);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.09, 16), MAT.beyaz); f.position.set(0.19, 0.045, -0.08); g.add(f); }
    // perde (L ray: s 303 boyunca u 20–104, yay, u 122 boyunca s 322–528)
    const perdeMat = std({ color: 0xece6db, roughness: 0.95, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    function perdeYuzu(boy, genlik = 0.025, dalga = 0.06) {
      const g = new THREE.PlaneGeometry(cm(boy), cm(262), Math.max(24, Math.round(boy / 1.4)), 1), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, genlik * Math.sin(p.getX(i) / dalga * Math.PI));
      g.computeVertexNormals(); const m = new THREE.Mesh(g, perdeMat); m.castShadow = true; m.receiveShadow = true; return m;
    }
    const perde1 = perdeYuzu(84), perde2 = perdeYuzu(206);
    const perdeG1 = new THREE.Group(), perdeG2 = new THREE.Group(); kok.add(perdeG1, perdeG2);
    perdeG1.position.set(cm(20), cm(135), cm(303.35)); perde1.position.x = cm(42); perdeG1.add(perde1);
    perdeG2.position.set(cm(122), cm(135), cm(321.75)); perde2.rotation.y = Math.PI / 2; perde2.position.z = cm(103); perdeG2.add(perde2);
    // açıkken kumaş koridor duvarındaki sabit uçta toplanır (kapanma oradan ray boyunca ilerler)
    const perdeTop = perdeYuzu(26, 0.05, 0.022); perdeTop.position.set(cm(34), cm(135), cm(303.35)); kok.add(perdeTop);
    kutu(kok, 18.5, 104, 301.85, 304.85, 266.5, 269.5, MAT.alu); kutu(kok, 120.5, 123.5, 320, 528, 266.5, 269.5, MAT.alu);
    // yoga matları (hobi saatinde S4 kutusundan çıkar)
    const matlar = new THREE.Group(); kok.add(matlar);
    for (const [u, s] of [[205, 512], [225, 640]]) { kutu(matlar, u - 30.5, u + 30.5, s - 87.5, s + 87.5, 0, 0.6, MAT.yoga, { golge: false }); }
    // zemin rayları + tavan kılavuzları
    katmanBasla("ray");
    for (const u of [184.6, 319.2]) for (const [s0, s1] of [[304.2, 530.2], [738.4, 925.7]]) { kutu(kok, u - 1, u + 1, s0, s1, -0.5, 0.35, MAT.ray, { golge: false }); kutu(kok, u - 3, u + 3, s0, s1, O.motor, H, MAT.alu); }

    // ---------------------------------------------------------------- dış uzun cephelerde kayar delikli paneller (S2 konumları)
    katmanBasla("zarf");
    const disPaneller = new THREE.Group(); kok.add(disPaneller);
    function kayarPanel(sabit, a, b, kes) {
      const mm = kes ? kesik(MAT.bordo) : MAT.bordo;
      kutu(disPaneller, sabit - 1, sabit + 1, a, a + 3, -23, 278, mm); kutu(disPaneller, sabit - 1, sabit + 1, b - 3, b, -23, 278, mm);
      kutu(disPaneller, sabit - 1, sabit + 1, a, b, -23, -20, mm); kutu(disPaneller, sabit - 1, sabit + 1, a, b, 275, 278, mm);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(cm(b - a - 6), cm(295)), kes ? kesik(MAT.delikli) : MAT.delikli);
      const uv = pl.geometry.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * cm(b - a - 6) / 0.36, uv.getY(q) * 2.95 / 0.36);
      pl.rotation.y = Math.PI / 2; pl.position.set(cm(sabit), cm(127.5), cm((a + b) / 2)); pl.castShadow = true; pl.customDepthMaterial = DELIK_DERINLIK; delikliler.push(pl); disPaneller.add(pl);
    }
    const tp = CL + 8, tr = CL + 5;
    kutu(disPaneller, -tr - 2.5, -tr + 2.5, -CL, L + CL, 278, 282, kesik(MAT.alu)); kutu(disPaneller, -tr - 2.5, -tr + 2.5, -CL, L + CL, -27, -23, MAT.alu);
    kutu(disPaneller, W + tr - 2.5, W + tr + 2.5, -CL, L + CL, 278, 282, MAT.alu); kutu(disPaneller, W + tr - 2.5, W + tr + 2.5, -CL, L + CL, -27, -23, MAT.alu);
    const disPanellerKor = new THREE.Group(); kok.add(disPanellerKor);
    const n0 = disPaneller.children.length;
    // ikizde paneller park konumunda: pencereler arasındaki duvar parçalarında (hiçbir pencereyi örtmez)
    [[1050, 1169.8], [926, 1045.8], [283, 385.5], [534.5, 637]].forEach(([a, b]) => kayarPanel(-tp, a, b, true));
    disPaneller.children.slice(n0).forEach((m) => disPanellerKor.add(m));
    [[240, 380], [490, 550], [830, 970]].forEach(([a, b]) => kayarPanel(W + tp, a, b, false));

    // ---------------------------------------------------------------- sensörler + çapalar
    katmanBasla("sensor");
    const sensorGrup = new THREE.Group(); kok.add(sensorGrup);
    const capalar = [];
    function sensor(id, ad, u, s, z, tur, yuzey = "tavan") {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 20), MAT.sensor);
      if (yuzey === "duvar-u") m.rotation.z = Math.PI / 2;
      if (yuzey === "duvar-s") m.rotation.x = Math.PI / 2;
      m.position.set(cm(u), cm(z), cm(s)); sensorGrup.add(m);
      capalar.push({ id, ad, tur, p: new THREE.Vector3(cm(u), cm(z), cm(s)) });
    }
    const Lx = I.L;
    sensor("S1", Lx("Varlık · yatak odası", "Presence · bedroom"), 40, 295, 268, "sensor");
    sensor("S1", Lx("Varlık · orta alan", "Presence · middle zone"), 70, 700, 268, "sensor");
    sensor("S1", Lx("Varlık + kapı · banyo", "Presence + door · bathroom"), 240, 1100, 268, "sensor");
    sensor("S2", Lx("Sıcaklık · nem · CO₂", "Temperature · RH · CO₂"), 357, 300, 150, "sensor", "duvar-u");
    sensor("S2", Lx("Sıcaklık · nem · CO₂", "Temperature · RH · CO₂"), 357, 880, 150, "sensor", "duvar-u");
    sensor("S3", Lx("Işık + güneş (cephe)", "Light + sun (façade)"), 190, -24, 285, "sensor");
    sensor("S4", Lx("Kapı + telefon çeperi", "Door + phone geofence"), 67, 1196, 225, "sensor", "duvar-s");
    sensor("S5", Lx("Kutu RFID + ağırlık", "Box RFID + weight"), 90, 545, 262, "sensor");
    sensor("S6", Lx("Yatak basınç şeridi", "Bed pressure strip"), 217, 163, 40, "sensor");
    [["M", Lx("Yatak ve kutu motorları (16)", "Bed and box hoists (16)"), 200, 165, 268], ["M", Lx("Kayan birim motorları (3)", "Sliding unit motors (3)"), 319, 520, 268],
      ["M", Lx("Panjur motorları (6)", "Shutter motors (6)"), 190, -16, 276], ["M", Lx("Hat arabaları + döner makas", "Line carriages + turntable"), 71, 545, 262],
      ["K", Lx("Kapı yanında sinyal ikizi", "Signal twin by the door"), 120, 1226, 140], ["K", Lx("Yatak başı tuşu (3 × 2)", "Bedside keypad (3 × 2)"), 350, 60, 100]]
      .forEach(([tur, ad, u, s, z]) => capalar.push({ id: tur, ad, tur: tur === "M" ? "motor" : "kumanda", p: new THREE.Vector3(cm(u), cm(z), cm(s)) }));

    // ---------------------------------------------------------------- kişiler (konum iğnesi) + ayak izleri
    katmanBasla("kisi");
    function igne(mat) {
      const g = new THREE.Group();
      const yari = mat.clone(); yari.opacity = 0.32; yari.depthWrite = false;
      const disk = new THREE.Mesh(new THREE.CircleGeometry(0.19, 48), yari); disk.rotation.x = -Math.PI / 2; disk.position.y = 0.014; g.add(disk);
      const halka = new THREE.Mesh(new THREE.RingGeometry(0.235, 0.255, 64), mat); halka.rotation.x = -Math.PI / 2; halka.position.y = 0.016; g.add(halka);
      const ok = new THREE.Shape(); ok.moveTo(0, 0.33); ok.lineTo(0.075, 0.2); ok.lineTo(-0.075, 0.2); ok.lineTo(0, 0.33);
      const okM = new THREE.Mesh(new THREE.ShapeGeometry(ok), mat); okM.rotation.x = -Math.PI / 2; okM.position.y = 0.018;
      const yonG = new THREE.Group(); yonG.add(okM); g.add(yonG);
      const cm_ = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.42, 10), mat); cm_.position.y = 0.72; g.add(cm_);
      const bas = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 18), mat); bas.position.y = 1.48; g.add(bas);
      g.userData.halka = halka; g.userData.yon = yonG; kok.add(g); return g;
    }
    const kisi = igne(MAT.kisi), komsu = igne(MAT.komsuKisi), misafir = igne(MAT.misafir);
    function izGrubu(renkHex) {
      const geo = new THREE.CircleGeometry(0.045, 20); geo.scale(1, 1.75, 1);
      return Array.from({ length: 14 }, () => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: renkHex, transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.011; m.visible = false; kok.add(m); return m; });
    }
    const izKisi = izGrubu(0x7a1f2b), izKomsu = izGrubu(0xb5772a), izMisafir = izGrubu(0x2f5d62);
    function izCiz(liste, izler, gorunur) {
      liste.forEach((m, i) => { const iz = izler[i]; if (!iz || !gorunur) { m.visible = false; return; } m.visible = true; m.position.x = cm(iz.u); m.position.z = cm(iz.s); m.rotation.z = iz.yon; m.material.opacity = 0.62 * iz.alfa; });
    }
    capalar.push({ id: "kisi", ad: Lx("sakin", "resident"), tur: "kisi", p: new THREE.Vector3(), obj: kisi });
    capalar.push({ id: "komsu", ad: Lx("komşu", "neighbour"), tur: "kisi", p: new THREE.Vector3(), obj: komsu });
    capalar.push({ id: "misafir", ad: Lx("misafir", "guest"), tur: "kisi", p: new THREE.Vector3(), obj: misafir });

    // ---------------------------------------------------------------- ışıklar
    const hemi = new THREE.HemisphereLight(0xdfe9f3, 0xb9ab98, 0.9); scene.add(hemi);
    const gunes = new THREE.DirectionalLight(0xfff1de, 3.2);
    gunes.castShadow = true; gunes.shadow.mapSize.set(4096, 4096);
    const sc = gunes.shadow.camera; sc.left = -8.5; sc.right = 8.5; sc.top = 8.5; sc.bottom = -8.5; sc.near = 1; sc.far = 70;
    gunes.shadow.bias = -0.0004; gunes.shadow.normalBias = 0.012; gunes.shadow.radius = 3;
    gunes.target.position.set(1.9, 0, 5.2); scene.add(gunes, gunes.target);
    // nokta ışık sayısı her pikselin hesabını büyütür (tümleşik kartta belirgin): 4 tavan lambası → 2 güçlü lamba
    const lambalar = [[2.2, 2.2, 3.0], [2.4, 2.2, 8.4]].map(([x, y, z]) => { const l = new THREE.PointLight(0xffc98f, 0, 9.5, 1.5); l.position.set(x, y, z); scene.add(l); return l; });
    // TV ve ışık çizgisi kendi parlaklığıyla (emissive) + gece parıltısıyla okunur; ayrı ışık sahneye eklenmez (hız)
    const tvIsik = new THREE.PointLight(0x9cb8ff, 0, 5, 1.5); tvIsik.position.set(2.4, 1.25, 6.4);
    const ledIsik = new THREE.PointLight(0xffc47a, 0, 3.5, 1.6); ledIsik.position.set(1.9, 0.4, -0.25);

    // ---------------------------------------------------------------- görünümler
    // iç görünümler alçak ve yandan (kesitli koridor duvarının üstünden): tavan ızgarasının altı görünsün
    const GORUNUM = {
      aks: { p: [-12.7, 12.9, -10.6], h: [1.9, 0.45, 5.6], fov: 30 },
      kus: { p: [1.9, 29, 6.25], h: [1.9, 0, 6.25], fov: 18.5, ust: [1, 0, 0] },
      cephe: { p: [1.9, 1.45, -9.4], h: [1.9, 1.35, 0], fov: 26 },
      cepheAks: { p: [-4.6, 3.4, -6.3], h: [1.9, 1.25, 0.4], fov: 32 },
      goz: { p: [0.62, 1.58, 2.95], h: [2.05, 1.32, -0.2], fov: 64 },
      salon: { p: [0.42, 1.55, 7.3], h: [2.55, 0.72, 5.85], fov: 64 },     // koridordan, koltuğa önden çapraz (göz hizası)
      orta: { p: [-6.5, 5.1, 6.7], h: [2.2, 1.0, 6.0], fov: 42 },
      mutfak: { p: [-6.8, 4.9, 10.0], h: [2.4, 1.05, 8.5], fov: 40 },
      hat: { p: [-3.3, 5.6, 3.0], h: [0.95, 2.15, 7.0], fov: 42 },
      giris: { p: [1.9, 1.6, 19.6], h: [1.9, 1.25, 12.2], fov: 30 },
    };

    // ---------------------------------------------------------------- durum uygula
    const v3 = new THREE.Vector3();
    function gunesYonu(az, yuk) {
      const th = (az - O.cepheAzimut) * Math.PI / 180, e = yuk * Math.PI / 180;
      return new THREE.Vector3(Math.sin(th) * Math.cos(e), Math.sin(e), -Math.cos(th) * Math.cos(e));
    }
    const renk = (h) => new THREE.Color(h);
    const GOK = { gece: renk(0x10131a), safak: renk(0xd2b39c), gun: renk(0xd8d7d3) };
    function uygula(D, t, ek = {}) {
      const C = D.C, v = (ad) => C.deger(ad, t), depo = !!ek.depoGoster;
      // yatak
      const yd = depo ? 1 : v("yatak"), yz = I.lerp(Y.yukari, Y.asagi, yd);
      yatak.position.y = cm(yz);
      yatakHalat.forEach((h) => halatAyar(h, { u: 0, s: 0, z: 0 }, O.motor, yz + 8));
      // tavan kutuları
      I.TAVAN.forEach((k) => {
        const o = tkGrup[k.id], a = depo ? 1 : v("tk" + k.id), z = I.lerp(O.tavanAlt, k.inis, a);
        o.g.position.y = cm(z);
        o.halat.forEach((h) => halatAyar(h, { u: 0, s: 0, z: 0 }, O.motor, z + o.g.userData.ust));
      });
      // koltuk: paket (sırtlık yatık, ayaklar kapalı) iner, en sonda açılır
      const kd = depo ? 1 : v("koltuk"), kz = I.lerp(KO.yukari, KO.asagi, kd);
      koltuk.position.y = cm(kz);
      const ac = I.clamp((kd - 0.75) / 0.25, 0, 1);
      sirt.rotation.x = (1 - ac) * Math.PI / 2;
      kirlent.visible = ac > 0.97;
      koltukAyak.forEach((m) => { m.scale.y = Math.max(0.02, ac); m.position.y = cm(-12 * ac); });
      koltukHalat.forEach((h) => halatAyar(h, { u: 0, s: 0, z: 0 }, O.motor, kz + 4));
      // kayan birimler
      unite2.position.z = cm(v("U2"));
      unite3.position.z = cm(v("U3"));
      misafirYatak.rotation.x = v("misafirYatak") * Math.PI / 2;
      misafirAyak.forEach((m) => (m.visible = v("misafirYatak") > 0.97));
      dolapKapaklari.forEach((k) => (k.rotation.y = (k.userData.ilk ? v("dolapKapak") : 0) * 1.4 * k.userData.yon));
      const u3 = v("U3");
      ["masaA", "masaB"].forEach((ad, i) => {
        const a = v(ad); masaKanat[i].rotation.x = a * Math.PI / 2;
        const ay = masaAyaklari[i]; ay.visible = a > 0.98;
        ay.position.set(cm(i === 0 ? 165 : 258), cm(36), cm(u3 + 105));
      });
      const masaAcik = v("masaA") > 0.9;
      tabureler.visible = masaAcik; tabureler.position.z = cm(u3);
      kahvalti.visible = masaAcik && t > I.hm("07:12") && t < I.hm("07:56"); kahvalti.position.z = cm(u3);
      matlar.visible = !depo && v("tkS4") > 0.9 && t > I.hm("19:03") && t < I.hm("20:34");
      // çalışma masası + sandalye + lamba
      calisma.rotation.z = v("calisma") * Math.PI / 2;   // dolap önündeki kapak odaya (−u) yatar → masa +0,72–0,75
      sandalye.visible = lamba.visible = v("calisma") > 0.5;
      // perde: kapalı uzunluk (koridor duvarından)
      const pr = v("perde"), Ltop = 84 + 29 + 206, kapali = pr * Ltop;
      perdeG1.scale.x = I.clamp(kapali / 84, 0.04, 1); perdeG1.visible = kapali > 24;
      perde2.scale.x = I.clamp((kapali - 113) / 206, 0.02, 1); perde2.position.z = cm(206 * perde2.scale.x / 2); perdeG2.visible = kapali > 116;
      perdeTop.visible = kapali <= 24;
      // panjurlar + ışık
      // akordeon kanat: 1. kanat menteşede dışarı (−s) döner, 2. kanat ters yöne katlanır; ucu cam düzleminde kayar
      panjurlar.forEach((kp) => {
        const idx = (kp.sira === 0 ? 0 : 3) + kp.i, a = v("k" + idx) * 84 * Math.PI / 180;
        if (kp.ust) { kp.k1.rotation.x = a; kp.k2.rotation.x = -2 * a; }
        else { kp.k1.rotation.x = -a; kp.k2.rotation.x = 2 * a; }
      });
      const ledA = v("led");
      MAT.led.emissiveIntensity = ledA * 4.2; ledIsik.intensity = ledA * 6;
      const so = Math.round(v("sosyal"));
      MAT.sinyal.forEach((m, k) => (m.emissiveIntensity = k === so ? 2.4 : 0));
      kanat.rotation.y = v("kanat") * 0.55;
      // kutu hattı
      I.KUTULAR.forEach((k) => {
        const p = D.kutuDurum(k.id, t), o = kutular[k.id];
        const z = depo && p.kol === "S" ? O.hat.istasyonInis : p.z;
        o.g.position.set(cm(p.u), cm(z), cm(p.s));
        o.araba.position.y = cm(262.5 - z + 1.75);
        o.h.forEach((h) => { const top = cm(262.5 - z), alt = cm(O.hat.kutu.h); h.scale.y = Math.max(0.001, (top - alt) / 0.01); h.position.y = (top + alt) / 2; h.visible = top - alt > 0.02; });
      });
      // kişiler
      const ik = (P, obj, iz, gorun, yukseklik) => {
        if (!P) { obj.visible = false; izCiz(iz, [], false); return; }
        const kp = P.konum(t);
        obj.position.set(cm(kp.u), cm(yukseklik(kp)), cm(kp.s));
        obj.visible = gorun && (kp.yer !== "disari" || kp.yuruyor) && kp.s < 1290 && !ek.kisiGizle;
        if (kp.yon !== undefined) obj.userData.yon.rotation.y = kp.yon + Math.PI;
        izCiz(iz, P.izler ? P.izler(t) : [], !ek.kisiGizle && !ek.izGizle);
      };
      ik(D.P, kisi, izKisi, true, (kp) => (kp.yer === "yatak" && yd > 0.9 ? 52 : 0));
      ik(D.komsuP, komsu, izKomsu, true, () => 0);
      ik(D.misafirP, misafir, izMisafir, true, (kp) => (kp.yer === "misafirYatak" && v("misafirYatak") > 0.9 ? 44 : 0));
      const nab = 1 + 0.18 * Math.sin((ek.saatGercek || 0) * 3.2);
      [kisi, komsu, misafir].forEach((o) => o.userData.halka.scale.set(nab, nab, nab));
      capalar.forEach((c) => { if (c.obj) c.p.copy(c.obj.position).add(v3.set(0, 1.7, 0)); });
      // güneş, gök, ışıklar
      const s = D.sim, ti = Math.min(1440, Math.max(0, Math.round(t)));
      const az = s.gunesA[ti], yk = s.gunesY[ti];
      gunes.position.copy(gunes.target.position).add(gunesYonu(az, Math.max(yk, 2)).multiplyScalar(40));
      const gun = I.clamp((yk + 4) / 14, 0, 1), alc = I.clamp(yk / 25, 0, 1);
      gunes.intensity = 3.4 * I.clamp(yk / 8, 0, 1) * (1 - D.M.bulut * 0.6);
      gunes.color.set(0xffffff).lerp(renk(0xffb27a), 1 - alc);
      hemi.intensity = (0.2 + 0.67 * gun) * 0.42; hemi.color.copy(GOK.gece).lerp(renk(0xe4e9ee), gun);
      scene.environmentIntensity = (0.08 + 0.42 * gun) * 1.25;
      const gok = GOK.gece.clone().lerp(GOK.safak, I.clamp((yk + 6) / 8, 0, 1)).lerp(GOK.gun, I.clamp((yk - 2) / 12, 0, 1));
      MAT.zemin.opacity = 0.12 + 0.2 * I.clamp(yk / 10, 0, 1);
      MAT.komsu.color.set(0xcfcac2).multiplyScalar(0.3 + 0.7 * gun);
      const il = v("isik");
      lambalar.forEach((l) => { l.intensity = il * 38; });
      const tvA = v("tvAcik"); MAT.tv.emissiveIntensity = tvA * 1.8; tvIsik.intensity = tvA * 9; tvIsik.position.z = cm(u3 - 70);
      MAT.sensor.emissiveIntensity = ek.sensorVurgu ? 0.9 : 0.15;
      renderer.toneMappingExposure = (0.95 + 0.25 * (1 - gun)) * 0.86;
      const ufuk = gok.clone().offsetHSL(0, -0.03, 0.04);
      gokCiz(ufuk, gok.clone().offsetHSL(0, -0.02, -0.05));
      if (scene.fog) scene.fog.color.copy(sabitGok ? new THREE.Color(sabitGok) : ufuk);
      return { gok, gun };
    }

    // ---------------------------------------------------------------- görünürlük
    function kesitFn(acik) {
      kesitDuzlemi.constant = acik ? 1.05 : 50;
      kesitBasliklari.visible = acik; kesitBasliklari.position.y = acik ? 1.05 - 0.006 : 0;
      disPanellerKor.visible = !acik; cati.visible = !acik; tavan.visible = !acik;
      delikliGolge(!acik);
    }
    const planDuzlemi = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.5);
    function plan(acik) { renderer.clippingPlanes = acik ? [planDuzlemi] : []; }
    function sensorler(acik) { sensorGrup.visible = acik; }
    function tavanGoster(acik) { tavan.visible = acik; }
    // katman etiketlerini dağıt (birleştirmeden önce)
    katmanSinir.forEach((k, j) => {
      const son = j + 1 < katmanSinir.length ? katmanSinir[j + 1].i : kok.children.length;
      for (let i = k.i; i < son; i++) kok.children[i].userData.katman = k.ad;
    });
    // ---------------------------------------------------------------- hız: sabit parçaları malzemeye göre birleştir
    // Intel UHD gibi tümleşik kartlarda asıl yük çizim komutu sayısı: ~400 ayrı sabit parça → malzeme başına tek parça.
    // Hareket eden, görünürlüğü değişen ya da özel gölge malzemesi taşıyan parçalar ayrı kalır.
    if (araclar.birlestir) {
      const koru = new Set([cati, tavan, perdeTop, ledCizgi, ...masaAyaklari, ...izKisi, ...izKomsu, ...izMisafir, ...delikliler]);
      const birlestir = (par) => {
        const kume = new Map();
        par.children.slice().forEach((m) => {
          if (!m.isMesh || koru.has(m) || m.customDepthMaterial || !m.visible || Array.isArray(m.material)) return;
          const k = m.material.uuid + "|" + m.castShadow + "|" + m.receiveShadow;
          if (!kume.has(k)) kume.set(k, []);
          kume.get(k).push(m);
        });
        kume.forEach((liste) => {
          if (liste.length < 2) return;
          const indisli = liste.every((m) => m.geometry.index);
          const geo = liste.map((m) => { m.updateMatrix(); const g = indisli ? m.geometry.clone() : (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()); g.applyMatrix4(m.matrix); return g; });
          let bir = null;
          try { bir = araclar.birlestir(geo, false); } catch (e) { bir = null; }
          if (!bir) return;
          const yeni = new THREE.Mesh(bir, liste[0].material);
          yeni.castShadow = liste[0].castShadow; yeni.receiveShadow = liste[0].receiveShadow; yeni.name = "birlesik";
          liste.forEach((m) => { par.remove(m); m.geometry.dispose(); });
          par.add(yeni);
        });
      };
      [kok, kesitBasliklari, hatGrup, disPaneller, disPanellerKor].forEach(birlestir);
    }

    kesitFn(true);
    return { THREE, renderer, scene, camera, GORUNUM, uygula, capalar, kesit: kesitFn, plan, sensorler, komsular, disPaneller, disPanellerKor, kok, delikliGolge, gokSabit, tavanGoster,
      MAT, zemin, cati, tavan, kesitBasliklari, sensorGrup, kisiler: [kisi, komsu, misafir], izler: [...izKisi, ...izKomsu, ...izMisafir] };
  };
})();
