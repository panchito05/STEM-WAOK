<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { user } from '../../stores/userStore.js';
  import { message } from '../../stores/uiStore.js';
  import confetti from 'canvas-confetti';
  
  export let letter = '';
  export let onComplete;
  export let onBack;
  
  const dispatch = createEventDispatcher();
  
  // Estado de la actividad
  let isRecording = false;
  let recordingTimer = 0;
  let recordingInterval;
  let audioContext;
  let mediaRecorder;
  let audioChunks = [];
  let recordedAudio = null;
  let playingExample = false;
  let exampleAudio = null;
  let pronunciationScore = null;
  let feedback = '';
  let examples = [];
  let currentExampleIndex = 0;
  let activityComplete = false;
  let attempts = 0;
  
  // Palabras de ejemplo según la letra
  function getExamplesForLetter(letter) {
    const letterExamples = {
      'A': ['Árbol', 'Amor', 'Agua', 'Avión', 'Animal'],
      'B': ['Barco', 'Bebé', 'Bola', 'Banana', 'Bosque'],
      'C': ['Casa', 'Comer', 'Cielo', 'Coche', 'Cubo'],
      'D': ['Dedo', 'Día', 'Dulce', 'Diente', 'Dibujo'],
      'E': ['Elefante', 'Estrella', 'Escuela', 'Espejo', 'Escalera'],
      'F': ['Flor', 'Fuego', 'Familia', 'Foca', 'Fantasma'],
      'G': ['Gato', 'Galleta', 'Goma', 'Guitarra', 'Gorro'],
      'H': ['Helado', 'Hoja', 'Huevo', 'Hormiga', 'Hilo'],
      'I': ['Iglesia', 'Isla', 'Insecto', 'Iglú', 'Imán'],
      'J': ['Juguete', 'Jirafa', 'Jardín', 'Jugo', 'Jabón'],
      'K': ['Kiwi', 'Koala', 'Karate', 'Kilo', 'Kayak'],
      'L': ['Luna', 'Libro', 'Lápiz', 'León', 'Lobo'],
      'M': ['Mamá', 'Mesa', 'Manzana', 'Mono', 'Música'],
      'N': ['Nariz', 'Nube', 'Nido', 'Nombre', 'Naranja'],
      'O': ['Oso', 'Ojo', 'Oveja', 'Oreja', 'Ola'],
      'P': ['Papá', 'Pelota', 'Perro', 'Pato', 'Pez'],
      'Q': ['Queso', 'Quince', 'Químico', 'Queque', 'Querido'],
      'R': ['Ratón', 'Rojo', 'Ropa', 'Reloj', 'Rosa'],
      'S': ['Sol', 'Silla', 'Serpiente', 'Señal', 'Sandia'],
      'T': ['Tren', 'Taza', 'Torre', 'Tigre', 'Tomate'],
      'U': ['Uva', 'Uno', 'Uniforme', 'Unicornio', 'Universo'],
      'V': ['Vaca', 'Ventana', 'Viento', 'Vaso', 'Vestido'],
      'W': ['Wagon', 'Whisky', 'Web', 'Waffle', 'Waterpolo'],
      'X': ['Xilófono', 'Xenón', 'Xavier', 'Xerografía', 'Xochimilco'],
      'Y': ['Yoyo', 'Yoga', 'Yema', 'Yate', 'Yacaré'],
      'Z': ['Zapato', 'Zorro', 'Zebra', 'Zoológico', 'Zanahoria']
    };
    
    return letterExamples[letter] || ['Ejemplo no disponible'];
  }
  
  // Inicializar actividad
  onMount(() => {
    if (letter) {
      examples = getExamplesForLetter(letter);
      currentExampleIndex = 0;
      
      // Cargar audio de ejemplo
      loadExampleAudio();
    }
    
    return () => {
      cleanupAudio();
    };
  });
  
  // Limpiar recursos de audio
  onDestroy(() => {
    cleanupAudio();
  });
  
  function cleanupAudio() {
    if (exampleAudio) {
      exampleAudio.pause();
      exampleAudio.currentTime = 0;
    }
    
    if (recordedAudio) {
      recordedAudio.pause();
      recordedAudio.currentTime = 0;
    }
    
    stopRecording();
  }
  
  // Cargar audio de ejemplo
  function loadExampleAudio() {
    if (exampleAudio) {
      exampleAudio.pause();
      exampleAudio.currentTime = 0;
    }
    
    // En una implementación real, cargaríamos un archivo de audio
    // exampleAudio = new Audio(`/sounds/letters/${letter.toLowerCase()}.mp3`);
    
    // Para nuestro prototipo, usaremos la API de síntesis de voz
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(examples[currentExampleIndex]);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        
        window.speechSynthesis.cancel(); // Cancelar cualquier síntesis previa
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Error al sintetizar voz:', err);
    }
  }
  
  // Reproducir audio de ejemplo
  function playExample() {
    if (playingExample) return;
    
    playingExample = true;
    
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(examples[currentExampleIndex]);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        
        utterance.onend = () => {
          playingExample = false;
        };
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Error al reproducir audio:', err);
      playingExample = false;
    }
  }
  
  // Siguiente ejemplo
  function nextExample() {
    if (currentExampleIndex < examples.length - 1) {
      currentExampleIndex++;
      
      // Restablecer estado
      pronunciationScore = null;
      feedback = '';
      
      // Cargar nuevo audio
      loadExampleAudio();
    } else {
      // Completar actividad si se han revisado todos los ejemplos
      completeActivity();
    }
  }
  
  // Ejemplo anterior
  function prevExample() {
    if (currentExampleIndex > 0) {
      currentExampleIndex--;
      
      // Restablecer estado
      pronunciationScore = null;
      feedback = '';
      
      // Cargar nuevo audio
      loadExampleAudio();
    }
  }
  
  // Iniciar grabación
  async function startRecording() {
    if (isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Crear contexto de audio si no existe
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        // Crear blob de audio
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (recordedAudio) {
          recordedAudio.pause();
          URL.revokeObjectURL(recordedAudio.src);
        }
        
        recordedAudio = new Audio(audioUrl);
        
        // En una aplicación real, enviaríamos el audio al servidor para análisis
        // En este prototipo, simularemos la respuesta del servidor
        simulateServerAnalysis(audioBlob);
      };
      
      // Iniciar grabación
      mediaRecorder.start();
      isRecording = true;
      
      // Iniciar temporizador
      recordingTimer = 0;
      recordingInterval = setInterval(() => {
        recordingTimer += 0.1;
        
        // Detener automáticamente después de 5 segundos
        if (recordingTimer >= 5) {
          stopRecording();
        }
      }, 100);
      
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      $message = {
        type: 'error',
        text: 'No se pudo acceder al micrófono. Por favor, verifica los permisos.',
        duration: 5000
      };
    }
  }
  
  // Detener grabación
  function stopRecording() {
    if (!isRecording) return;
    
    clearInterval(recordingInterval);
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      
      // Detener todas las pistas de la transmisión
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    isRecording = false;
  }
  
  // Reproducir grabación
  function playRecording() {
    if (!recordedAudio) return;
    
    recordedAudio.play();
  }
  
  // Simular análisis del servidor
  function simulateServerAnalysis(audioBlob) {
    attempts++;
    
    // En una aplicación real, enviaríamos el audio al servidor
    // Aquí simularemos una respuesta basada en la palabra actual
    
    // Generar una puntuación aleatoria para simular el reconocimiento
    const randomFactor = Math.random();
    let score;
    
    if (attempts === 1) {
      // Primera vez: puntuación mediocre para fomentar la repetición
      score = 0.4 + (randomFactor * 0.3);
    } else if (attempts === 2) {
      // Segunda vez: mejor puntuación
      score = 0.6 + (randomFactor * 0.2);
    } else {
      // Tercera vez o más: excelente puntuación
      score = 0.8 + (randomFactor * 0.2);
    }
    
    // Limitar a 0-1
    score = Math.min(1, Math.max(0, score));
    
    // Simular respuesta del servidor después de un breve retraso
    setTimeout(() => {
      pronunciationScore = score;
      
      // Generar retroalimentación basada en la puntuación
      if (score >= 0.9) {
        feedback = '¡Excelente pronunciación!';
        
        // Lanzar confeti para celebrar
        if (typeof window !== 'undefined') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else if (score >= 0.7) {
        feedback = '¡Muy bien! Casi perfecto.';
      } else if (score >= 0.5) {
        feedback = 'Buen intento. Sigue practicando.';
      } else {
        feedback = 'Inténtalo de nuevo. Escucha con atención.';
      }
      
      // Si la puntuación es alta, permitir avanzar al siguiente ejemplo
      if (score >= 0.7 && attempts >= 2) {
        // Después de unos segundos, sugerir el siguiente ejemplo
        setTimeout(() => {
          if (!activityComplete) {
            nextExample();
            attempts = 0;
          }
        }, 4000);
      }
    }, 1000);
  }
  
  // Completar la actividad
  function completeActivity() {
    if (activityComplete) return;
    
    activityComplete = true;
    
    // Calcular puntuación final (promedio de 0.7 a 1.0 para simular buen desempeño)
    const finalScore = 0.7 + (Math.random() * 0.3);
    
    // Notificar al componente padre
    dispatch('complete', {
      score: finalScore,
      activityId: 'sound-mirror'
    });
    
    // Si hay un callback, llamarlo
    if (onComplete) {
      onComplete({
        detail: {
          score: finalScore,
          activityId: 'sound-mirror'
        }
      });
    }
  }
  
  // Formatear puntuación como porcentaje
  function formatScore(score) {
    return `${Math.round(score * 100)}%`;
  }
</script>

<div class="sound-mirror-activity">
  <div class="activity-header">
    <button class="back-button" on:click={onBack}>
      <span class="back-icon">←</span> Volver
    </button>
    <h2 class="activity-title">Espejo de Sonidos: Letra {letter}</h2>
  </div>
  
  <div class="activity-content">
    <div class="example-section">
      <h3 class="section-title">Escucha y Repite</h3>
      
      <div class="example-card">
        <div class="example-word">{examples[currentExampleIndex]}</div>
        <div class="example-letter">{letter}</div>
        
        <div class="example-controls">
          <button 
            class="control-button play" 
            on:click={playExample}
            disabled={playingExample}
          >
            {playingExample ? 'Reproduciendo...' : 'Escuchar'}
          </button>
        </div>
      </div>
      
      <div class="example-navigation">
        <button 
          class="nav-button" 
          on:click={prevExample}
          disabled={currentExampleIndex === 0}
        >
          Anterior
        </button>
        <div class="example-progress">
          {currentExampleIndex + 1} / {examples.length}
        </div>
        <button 
          class="nav-button" 
          on:click={nextExample}
          disabled={currentExampleIndex === examples.length - 1}
        >
          Siguiente
        </button>
      </div>
    </div>
    
    <div class="recording-section">
      <h3 class="section-title">Tu Pronunciación</h3>
      
      <div class="recording-visualization">
        {#if isRecording}
          <div class="recording-indicator">
            <div class="recording-waves">
              <div class="wave"></div>
              <div class="wave"></div>
              <div class="wave"></div>
            </div>
            <div class="recording-timer">{recordingTimer.toFixed(1)}s</div>
          </div>
        {:else if recordedAudio}
          <div class="playback-controls">
            <button class="control-button play" on:click={playRecording}>
              Reproducir grabación
            </button>
          </div>
        {:else}
          <div class="recording-placeholder">
            <p>Presiona el botón para grabar tu pronunciación</p>
          </div>
        {/if}
      </div>
      
      <div class="recording-controls">
        {#if isRecording}
          <button class="control-button stop" on:click={stopRecording}>
            Detener Grabación
          </button>
        {:else}
          <button class="control-button record" on:click={startRecording}>
            {recordedAudio ? 'Grabar de Nuevo' : 'Iniciar Grabación'}
          </button>
        {/if}
      </div>
      
      {#if pronunciationScore !== null}
        <div class="pronunciation-feedback">
          <div class="score-display">
            <div class="score-label">Precisión:</div>
            <div class="score-value" style="--score: {pronunciationScore}">
              {formatScore(pronunciationScore)}
            </div>
          </div>
          <div class="feedback-message">{feedback}</div>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="activity-footer">
    <button class="finish-button" on:click={completeActivity}>
      Finalizar Actividad
    </button>
  </div>
</div>

<style>
  .sound-mirror-activity {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .back-button {
    background-color: transparent;
    color: var(--primary);
    border: none;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .back-icon {
    font-size: 1.2rem;
  }
  
  .activity-title {
    margin: 0;
    color: var(--primary);
  }
  
  .activity-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .section-title {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--primary);
  }
  
  /* Sección de ejemplo */
  .example-section {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .example-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background-color: rgba(91, 72, 199, 0.05);
    border-radius: var(--border-radius);
    position: relative;
    overflow: hidden;
  }
  
  .example-word {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    z-index: 1;
  }
  
  .example-letter {
    position: absolute;
    font-size: 10rem;
    font-weight: 900;
    opacity: 0.1;
    z-index: 0;
  }
  
  .example-controls {
    margin-top: 1.5rem;
    z-index: 1;
  }
  
  .control-button {
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    font-weight: 600;
    transition: all 0.2s ease;
  }
  
  .control-button.play {
    background-color: var(--primary);
    color: white;
  }
  
  .control-button.play:hover {
    background-color: var(--primary-dark);
  }
  
  .example-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
  }
  
  .nav-button {
    background-color: transparent;
    color: var(--primary);
    border: 1px solid var(--primary);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
  }
  
  .nav-button:hover:not(:disabled) {
    background-color: rgba(91, 72, 199, 0.1);
  }
  
  .nav-button:disabled {
    border-color: #ccc;
    color: #ccc;
    cursor: not-allowed;
  }
  
  .example-progress {
    font-weight: 600;
    color: var(--text-light);
  }
  
  /* Sección de grabación */
  .recording-section {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .recording-visualization {
    height: 150px;
    background-color: rgba(91, 72, 199, 0.05);
    border-radius: var(--border-radius);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .recording-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .recording-waves {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .wave {
    width: 6px;
    height: 30px;
    background-color: #ff5252;
    border-radius: 3px;
    animation: wave 1s ease-in-out infinite;
  }
  
  .wave:nth-child(2) {
    animation-delay: 0.2s;
    height: 45px;
  }
  
  .wave:nth-child(3) {
    animation-delay: 0.4s;
    height: 60px;
  }
  
  @keyframes wave {
    0%, 100% {
      height: 30px;
    }
    50% {
      height: 60px;
    }
  }
  
  .recording-timer {
    font-size: 1.2rem;
    font-weight: 600;
    color: #ff5252;
  }
  
  .recording-placeholder {
    color: var(--text-light);
    text-align: center;
  }
  
  .recording-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  
  .control-button.record {
    background-color: #ff5252;
    color: white;
  }
  
  .control-button.record:hover {
    background-color: #d32f2f;
  }
  
  .control-button.stop {
    background-color: #424242;
    color: white;
  }
  
  .control-button.stop:hover {
    background-color: #212121;
  }
  
  .pronunciation-feedback {
    background-color: rgba(91, 72, 199, 0.05);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    text-align: center;
  }
  
  .score-display {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .score-label {
    font-weight: 600;
  }
  
  .score-value {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--success);
    --score-color: var(--success);
  }
  
  .score-value[style*="--score:0"] {
    --score-color: var(--error);
    color: var(--error);
  }
  
  .score-value[style*="--score:0.1"],
  .score-value[style*="--score:0.2"],
  .score-value[style*="--score:0.3"],
  .score-value[style*="--score:0.4"] {
    --score-color: var(--error);
    color: var(--error);
  }
  
  .score-value[style*="--score:0.5"],
  .score-value[style*="--score:0.6"] {
    --score-color: var(--warning);
    color: var(--warning);
  }
  
  .feedback-message {
    font-weight: 600;
  }
  
  .activity-footer {
    margin-top: 2rem;
    text-align: center;
  }
  
  .finish-button {
    background-color: var(--secondary);
    color: white;
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
  }
  
  .finish-button:hover {
    background-color: var(--secondary-dark);
  }
  
  @media (max-width: 768px) {
    .activity-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .example-word {
      font-size: 2rem;
    }
    
    .example-letter {
      font-size: 8rem;
    }
    
    .example-navigation {
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .example-progress {
      width: 100%;
      text-align: center;
      order: -1;
    }
    
    .recording-visualization {
      height: 120px;
    }
  }
</style>