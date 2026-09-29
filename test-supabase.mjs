import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse .env file manually without external dotenv dependency
function loadEnv() {
  const envPaths = ['.env', '.env.local'];
  const env = { ...process.env };

  for (const envFile of envPaths) {
    const fullPath = path.resolve(__dirname, envFile);
    if (fs.existsSync(fullPath)) {
      console.log(`📄 Lecture du fichier : ${envFile}`);
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          env[key] = val;
        }
      }
      break;
    }
  }
  return env;
}

async function runTest() {
  console.log('🔍 [MusicFight] Test de connexion à Supabase...\n');

  const env = loadEnv();
  const rawSupabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();
  const supabaseUrl = rawSupabaseUrl
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/rest\/?$/i, '')
    .replace(/\/+$/, '');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables Supabase introuvables !');
    console.log('👉 Assurez-vous d\'avoir créé un fichier .env à la racine avec :');
    console.log('   VITE_SUPABASE_URL=https://votre-projet.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique\n');
    process.exit(1);
  }

  if (supabaseUrl.includes('votre-projet') || supabaseAnonKey.includes('votre_cle')) {
    console.error('⚠️ Vous utilisez encore les valeurs d\'exemple dans votre fichier .env !');
    console.log('👉 Remplacez-les par vos vrais identifiants de projet Supabase.');
    process.exit(1);
  }

  console.log(`📡 URL Supabase détectée : ${supabaseUrl}`);
  console.log(`🔑 Clé Anon détectée : ${supabaseAnonKey.slice(0, 12)}...${supabaseAnonKey.slice(-6)}\n`);

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Test lecture table leaderboard
    console.log('⏳ Test 1 : Vérification de la table "leaderboard"...');
    const { data: readData, error: readError } = await client
      .from('leaderboard')
      .select('id, score, player_name')
      .limit(1);

    if (readError) {
      console.error(`❌ Échec de lecture de la table : ${readError.message}`);
      if (readError.code === '42P01' || readError.message.includes('does not exist')) {
        console.log('💡 La table "leaderboard" n\'existe pas encore. Exécutez le script SQL fourni dans le SQL Editor de Supabase.');
      } else if (readError.message.includes('JWT') || readError.code === 'PGRST301') {
        console.log('💡 Clé VITE_SUPABASE_ANON_KEY invalide ou expirée.');
      }
      process.exit(1);
    }
    console.log('✅ Lecture réussie sur la table "leaderboard" !');

    // 2. Test écriture (Insertion probe)
    console.log('⏳ Test 2 : Test d\'écriture (enregistrement d\'un score test)...');
    const testRow = {
      player_name: '__test_probe__',
      score: 100,
      accuracy: 100,
      mode: 'classic',
      category_name: 'Test Connexion'
    };

    const { data: insertData, error: insertError } = await client
      .from('leaderboard')
      .insert([testRow])
      .select()
      .single();

    if (insertError) {
      console.error(`❌ Échec d'insertion : ${insertError.message}`);
      console.log('💡 Vérifiez les politiques RLS (Row Level Security) sur la table "leaderboard".');
      console.log('   Assurez-vous d\'autoriser l\'opération INSERT pour le rôle "anon".');
      process.exit(1);
    }

    console.log('✅ Écriture réussie ! ID créé :', insertData.id);

    // 3. Nettoyage du score de test
    console.log('⏳ Nettoyage du score de test...');
    await client.from('leaderboard').delete().eq('id', insertData.id);
    console.log('✅ Nettoyage terminé.');

    console.log('\n🎉 SUCCÈS TOTAL : Votre Supabase est 100% opérationnel pour MusicFight !');
    console.log('Les scores des joueurs seront désormais synchronisés en direct mondialement.\n');

  } catch (err) {
    console.error('❌ Erreur inattendue :', err.message);
    process.exit(1);
  }
}

runTest();
