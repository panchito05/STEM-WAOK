/**
 * Script para corregir los puntajes en la base de datos
 * 
 * Este script busca entradas donde el puntaje es exactamente 
 * uno menos que el total (ej: 2/3) y los corrige.
 */

const { Pool } = require('pg');
const { db } = require('../db');
const { progressEntries, eq } = require('drizzle-orm');

async function fixPerfectScores() {
  try {
    console.log("🔍 Iniciando corrección de puntajes...");
    
    // Obtener todas las entradas de progreso
    const entries = await db.query.progressEntries.findMany();
    
    let correctedCount = 0;
    
    // Procesar cada entrada
    for (const entry of entries) {
      // Detectar patrón donde el puntaje es exactamente uno menos que el total
      if (entry.score === entry.totalProblems - 1 && entry.totalProblems > 1) {
        console.log(`Entrada #${entry.id}: Puntuación ${entry.score}/${entry.totalProblems} → ${entry.totalProblems}/${entry.totalProblems}`);
        
        // Actualizar la entrada para corregir el puntaje
        await db.update(progressEntries)
          .set({ score: entry.totalProblems })
          .where(eq(progressEntries.id, entry.id));
          
        correctedCount++;
      }
    }
    
    console.log(`✅ Corrección completada: ${correctedCount} entradas actualizadas.`);
  } catch (error) {
    console.error("Error al corregir puntajes:", error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixPerfectScores().then(() => {
    console.log("Script finalizado");
    process.exit(0);
  }).catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
}

module.exports = { fixPerfectScores };