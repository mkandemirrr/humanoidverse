#!/usr/bin/env node
/**
 * HumanoidVerse — Robot Spec Verification Tool
 * 
 * Bu script data.js'deki her robot için web üzerinden güncel verileri çeker
 * ve farklılıkları raporlar. Böylece manuel kontrol döngüsünden çıkılır.
 * 
 * Kullanım: node tools/verify_specs.js
 * 
 * Kaynaklar:
 *   1. humanoid.guide (birincil — yapılandırılmış robot profilleri)
 *   2. robozaps.com (ikincil — detaylı spec tabloları)
 *   3. Üretici resmi siteleri (cross-reference)
 */

const https = require('https');
const http = require('http');

// --- data.js'den robot listesini yükle ---
const path = require('path');
const dataPath = path.join(__dirname, '..', 'js', 'data.js');
const fs = require('fs');
const vm = require('vm');

// data.js'yi vm context ile yükle
let ROBOTS;
try {
  const dataContent = fs.readFileSync(dataPath, 'utf8');
  // const → var dönüşümü yaparak eval ile uyumlu hale getir
  const modified = dataContent.replace(/^const /gm, 'var ');
  const context = {};
  vm.createContext(context);
  vm.runInContext(modified, context);
  ROBOTS = context.ROBOTS;
  if (!ROBOTS) throw new Error('ROBOTS dizisi bulunamadı');
  console.log(`✅ ${ROBOTS.length} robot yüklendi`);
} catch (e) {
  console.error('❌ data.js yüklenemedi:', e.message);
  process.exit(1);
}

// --- URL slug mapping: bizim robot ID → humanoid.guide slug ---
const GUIDE_SLUGS = {
  'atlas': 'atlas',
  'optimus': 'optimus-gen-3',
  'figure-03': 'figure-03',
  'digit': 'digit',
  'unitree-g1': 'unitree-g1',
  'unitree-h1': 'unitree-h1',
  'gr-2': 'gr-2',
  'walker-s2': 'walker-s2',
  'neo-gamma': 'neo-gamma',
  'phoenix': 'phoenix',
  'apollo': 'apollo',
  'astribot-s1': 'astribot-s1',
  'pepper': null, // humanoid.guide'da yok
  'asimo': null,  // legacy, humanoid.guide'da yok
  'cl-1': 'limx',
  'ameca': null,  // humanoid.guide'da yok (statik)
  '4ne-1': '4ne1',
  'kepler-k2': 'kepler-k2',
  'iron': 'iron',
  'agibot-a2': 'a2',
  'sophia': null,  // humanoid.guide'da yok
  'cyberone': null, // humanoid.guide'da yok (eski)
  'talos': null,    // humanoid.guide'da yok (araştırma)
  'kuavo': 'kuavo-5',
  'bumi': null,     // humanoid.guide'da yok (tüketici)
  'thr3': null,     // legacy
  'r1-air': 'unitree-r1',
  'menteebot': 'menteebot-v3',
  'galbot-g1': 'galbot-s1',
  'robotera-star1': null  // STAR1 olarak kontrol edilecek
};

// --- HTTP fetch helper ---
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { 
      headers: { 'User-Agent': 'HumanoidVerse-Verifier/1.0' },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// --- HTML'den spec değerlerini parse et ---
function parseSpecs(html) {
  const specs = {};
  
  // Height pattern: "175 cm", "1750 mm", "5'9""
  const heightMatch = html.match(/(?:height|boy)[:\s]*(?:~|≈|approx\.?)?\s*(\d{2,3})\s*cm/i) ||
                       html.match(/(\d{3,4})\s*mm/i);
  if (heightMatch) {
    let h = parseInt(heightMatch[1]);
    if (h > 500) h = Math.round(h / 10); // mm → cm
    specs.height = h;
  }

  // Weight pattern
  const weightMatch = html.match(/(?:weight|ağırlık)[:\s]*(?:~|≈|approx\.?)?\s*(\d{1,3}(?:\.\d)?)\s*kg/i);
  if (weightMatch) specs.weight = parseFloat(weightMatch[1]);

  // DoF pattern
  const dofMatch = html.match(/(?:degrees?\s*of\s*freedom|dof|joints?)[:\s]*(?:~|≈|approx\.?)?\s*(\d{1,3})/i);
  if (dofMatch) specs.dof = parseInt(dofMatch[1]);

  // Speed pattern
  const speedMatch = html.match(/(?:speed|hız)[:\s]*(?:~|≈|up\s*to\s*|max\.?\s*)?(\d+(?:\.\d+)?)\s*(?:m\/s|m\/sec)/i) ||
                     html.match(/(\d+(?:\.\d+)?)\s*km\/h/i);
  if (speedMatch) {
    let s = parseFloat(speedMatch[1]);
    if (speedMatch[0].includes('km/h')) s = Math.round(s / 3.6 * 10) / 10;
    specs.speed = s;
  }

  return specs;
}

// --- Ana doğrulama fonksiyonu ---
async function verifyAll() {
  console.log('\n🤖 HumanoidVerse Spec Doğrulama Aracı');
  console.log('=' .repeat(60));
  console.log(`📊 Toplam Robot: ${ROBOTS.length}`);
  console.log(`📅 Tarih: ${new Date().toISOString().split('T')[0]}`);
  console.log('=' .repeat(60));

  const results = [];
  let checked = 0, skipped = 0, mismatches = 0;

  for (const robot of ROBOTS) {
    const slug = GUIDE_SLUGS[robot.id];
    
    if (!slug) {
      console.log(`⏭️  ${robot.name} — humanoid.guide'da profil yok, atlanıyor`);
      skipped++;
      continue;
    }

    const url = `https://humanoid.guide/product/${slug}/`;
    
    try {
      console.log(`🔍 ${robot.name} kontrol ediliyor...`);
      const html = await fetchPage(url);
      const webSpecs = parseSpecs(html);
      
      const diffs = [];
      
      if (webSpecs.height && Math.abs(webSpecs.height - robot.specs.height) > 2) {
        diffs.push(`  Height: ${robot.specs.height}cm (bizde) vs ${webSpecs.height}cm (web)`);
      }
      if (webSpecs.weight && Math.abs(webSpecs.weight - robot.specs.weight) > 2) {
        diffs.push(`  Weight: ${robot.specs.weight}kg (bizde) vs ${webSpecs.weight}kg (web)`);
      }
      if (webSpecs.dof && Math.abs(webSpecs.dof - robot.specs.dof) > 2) {
        diffs.push(`  DoF: ${robot.specs.dof} (bizde) vs ${webSpecs.dof} (web)`);
      }
      if (webSpecs.speed && Math.abs(webSpecs.speed - robot.specs.speed) > 0.3) {
        diffs.push(`  Speed: ${robot.specs.speed} m/s (bizde) vs ${webSpecs.speed} m/s (web)`);
      }

      if (diffs.length > 0) {
        console.log(`  ⚠️  FARK TESPİT EDİLDİ:`);
        diffs.forEach(d => console.log(d));
        results.push({ robot: robot.name, id: robot.id, diffs, url });
        mismatches++;
      } else {
        console.log(`  ✅ Eşleşiyor`);
      }
      
      checked++;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (err) {
      console.log(`  ❌ Erişim hatası: ${err.message}`);
      skipped++;
    }
  }

  // --- Sonuç raporu ---
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SONUÇ RAPORU');
  console.log('=' .repeat(60));
  console.log(`✅ Kontrol edilen: ${checked}`);
  console.log(`⏭️  Atlanan: ${skipped}`);
  console.log(`⚠️  Fark bulunan: ${mismatches}`);
  
  if (results.length > 0) {
    console.log('\n🔴 DÜZELTME GEREKTİREN ROBOTLAR:');
    results.forEach(r => {
      console.log(`\n  📌 ${r.robot} (${r.url})`);
      r.diffs.forEach(d => console.log(d));
    });
  } else {
    console.log('\n🎉 Tüm kontrol edilen robotlar eşleşiyor!');
  }

  // JSON rapor çıktısı
  const reportPath = path.join(__dirname, '..', 'verification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    date: new Date().toISOString(),
    total: ROBOTS.length,
    checked,
    skipped,
    mismatches,
    details: results
  }, null, 2));
  console.log(`\n📄 Detaylı rapor: ${reportPath}`);
}

verifyAll().catch(console.error);
