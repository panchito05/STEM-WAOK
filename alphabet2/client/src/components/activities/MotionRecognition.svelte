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
  let canvas;
  let context;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentStroke = [];
  let allStrokes = [];
  let attempts = 0;
  let activityComplete = false;
  let showGuidelines = true;
  let showAnimatedExample = false;
  let guidePoints = [];
  let animationProgress = 0;
  let animationInterval;
  let currentScore = 0;
  let feedback = '';
  let showFeedback = false;
  
  // Patrones de trazos para letras
  function getStrokePattern(letter) {
    // Definir puntos de guía para cada letra (normalizado a un lienzo de 300x300)
    const patterns = {
      'A': [
        [150, 300], [75, 50], [225, 50], [150, 300]  // Down, up, right, down
      ],
      'B': [
        [75, 50], [75, 300], [75, 50], [175, 75], [175, 150], [75, 150], [175, 175], [175, 275], [75, 300]
      ],
      'C': [
        [225, 100], [150, 50], [75, 100], [50, 175], [75, 250], [150, 300], [225, 250]
      ],
      // Patrones adicionales para otras letras se añadirían aquí
    };
    
    // Devolver patrón o uno predeterminado si no está definido
    return patterns[letter] || [
      [75, 50], [75, 300], [175, 300]  // Patrón en forma de L predeterminado
    ];
  }
  
  onMount(() => {
    if (canvas) {
      context = canvas.getContext('2d');
      resizeCanvas();
      
      // Eventos de cambio de tamaño de ventana
      window.addEventListener('resize', resizeCanvas);
      
      // Definir puntos de guía para la letra actual
      guidePoints = getStrokePattern(letter);
      
      // Dibujar lienzo inicial
      clearCanvas();
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  });
  
  onDestroy(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
    }
  });
  
  // Redimensionar canvas
  function resizeCanvas() {
    if (!canvas) return;
    
    // Obtener el ancho del contenedor padre
    const containerWidth = canvas.parentElement.clientWidth;
    
    // Determinar el tamaño del canvas (cuadrado, pero responsivo)
    const size = Math.min(containerWidth, 400);
    
    canvas.width = size;
    canvas.height = size;
    
    // Volver a dibujar después de cambiar el tamaño
    clearCanvas();
  }
  
  // Limpiar el lienzo
  function clearCanvas() {
    if (!context) return;
    
    // Limpiar todo el lienzo
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo
    context.fillStyle = '#f9f9f9';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar líneas de guía
    if (showGuidelines) {
      drawGuidelines();
    }
  }
  
  // Dibujar líneas de guía
  function drawGuidelines() {
    if (!context) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Dibujar líneas horizontales (línea base, línea media, línea superior)
    context.strokeStyle = 'rgba(91, 72, 199, 0.2)';
    context.lineWidth = 1;
    
    // Línea base (abajo)
    context.beginPath();
    context.moveTo(0, height * 0.8);
    context.lineTo(width, height * 0.8);
    context.stroke();
    
    // Línea media
    context.beginPath();
    context.moveTo(0, height * 0.4);
    context.lineTo(width, height * 0.4);
    context.stroke();
    
    // Línea superior
    context.beginPath();
    context.moveTo(0, height * 0.1);
    context.lineTo(width, height * 0.1);
    context.stroke();
    
    // Si hay puntos de guía, dibujarlos con líneas punteadas
    if (guidePoints.length > 0 && !showAnimatedExample) {
      context.strokeStyle = 'rgba(91, 72, 199, 0.3)';
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.beginPath();
      
      // Escalar los puntos al tamaño actual del lienzo
      const scaleFactor = canvas.width / 300;
      
      // Mover al primer punto
      const firstPoint = guidePoints[0];
      context.moveTo(firstPoint[0] * scaleFactor, firstPoint[1] * scaleFactor);
      
      // Dibujar líneas a cada punto siguiente
      for (let i = 1; i < guidePoints.length; i++) {
        const point = guidePoints[i];
        context.lineTo(point[0] * scaleFactor, point[1] * scaleFactor);
      }
      
      context.stroke();
      context.setLineDash([]);
    }
  }
  
  // Mostrar ejemplo animado
  function showExample() {
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    
    showAnimatedExample = true;
    animationProgress = 0;
    clearCanvas();
    
    animationInterval = setInterval(() => {
      animationProgress += 0.01;
      
      if (animationProgress >= 1) {
        clearInterval(animationInterval);
        animationProgress = 0;
        showAnimatedExample = false;
        clearCanvas();
      } else {
        drawAnimatedExample();
      }
    }, 30);
  }
  
  // Dibujar ejemplo animado
  function drawAnimatedExample() {
    if (!context || !showAnimatedExample) return;
    
    // Limpiar lienzo
    clearCanvas();
    
    const scaleFactor = canvas.width / 300;
    const points = guidePoints;
    
    // Calcular cuántos segmentos tenemos que dibujar
    const totalSegments = points.length - 1;
    const segmentsToShow = Math.ceil(totalSegments * animationProgress);
    
    // Dibujar la parte del patrón que corresponde al progreso actual
    context.strokeStyle = '#5b48c7';
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    context.beginPath();
    context.moveTo(points[0][0] * scaleFactor, points[0][1] * scaleFactor);
    
    for (let i = 1; i <= segmentsToShow; i++) {
      // Si es el último segmento y la animación no ha llegado al final,
      // calculamos un punto intermedio
      if (i === segmentsToShow && i < totalSegments) {
        const startX = points[i-1][0];
        const startY = points[i-1][1];
        const endX = points[i][0];
        const endY = points[i][1];
        
        // Calcular progreso dentro del segmento actual
        const segmentProgress = (totalSegments * animationProgress) - (segmentsToShow - 1);
        
        // Interpolar posición actual
        const currentX = startX + (endX - startX) * segmentProgress;
        const currentY = startY + (endY - startY) * segmentProgress;
        
        context.lineTo(currentX * scaleFactor, currentY * scaleFactor);
      } else {
        context.lineTo(points[i][0] * scaleFactor, points[i][1] * scaleFactor);
      }
    }
    
    context.stroke();
    
    // Dibujar un punto en la posición actual
    if (segmentsToShow < totalSegments) {
      const lastIdx = Math.min(segmentsToShow, points.length - 1);
      const prevIdx = lastIdx > 0 ? lastIdx - 1 : 0;
      
      const startX = points[prevIdx][0];
      const startY = points[prevIdx][1];
      const endX = points[lastIdx][0];
      const endY = points[lastIdx][1];
      
      // Calcular progreso dentro del segmento actual
      const segmentProgress = (totalSegments * animationProgress) - (segmentsToShow - 1);
      
      // Interpolar posición actual
      const currentX = startX + (endX - startX) * segmentProgress;
      const currentY = startY + (endY - startY) * segmentProgress;
      
      // Dibujar un círculo en la posición actual
      context.fillStyle = '#ff7d5b';
      context.beginPath();
      context.arc(currentX * scaleFactor, currentY * scaleFactor, 8, 0, Math.PI * 2);
      context.fill();
    }
  }
  
  // Eventos de dibujo
  function startDrawing(e) {
    if (showAnimatedExample) return;
    
    drawing = true;
    const { offsetX, offsetY } = getCoordinates(e);
    lastX = offsetX;
    lastY = offsetY;
    
    // Iniciar un nuevo trazo
    currentStroke = [{x: offsetX, y: offsetY}];
    
    // Dibujar un punto al inicio
    context.beginPath();
    context.fillStyle = '#5b48c7';
    context.arc(offsetX, offsetY, 3, 0, Math.PI * 2);
    context.fill();
  }
  
  function draw(e) {
    if (!drawing || showAnimatedExample) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    
    // Dibujar línea
    context.beginPath();
    context.strokeStyle = '#5b48c7';
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.moveTo(lastX, lastY);
    context.lineTo(offsetX, offsetY);
    context.stroke();
    
    // Añadir punto al trazo actual
    currentStroke.push({x: offsetX, y: offsetY});
    
    // Actualizar posición
    lastX = offsetX;
    lastY = offsetY;
  }
  
  function stopDrawing() {
    if (!drawing) return;
    
    drawing = false;
    
    // Añadir el trazo actual a la lista de trazos
    if (currentStroke.length > 0) {
      allStrokes.push([...currentStroke]);
      
      // Evaluar el trazo actual
      evaluateDrawing();
    }
  }
  
  // Obtener coordenadas reales (para eventos de ratón y táctiles)
  function getCoordinates(e) {
    let offsetX, offsetY;
    
    if (e.type.includes('touch')) {
      const touch = e.touches[0] || e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    }
    
    return { offsetX, offsetY };
  }
  
  // Evaluar el dibujo del usuario
  function evaluateDrawing() {
    attempts++;
    
    // Simular evaluación basada en el patrón de referencia
    // En una aplicación real, esto utilizaría algoritmos más sofisticados
    
    // 1. Normalizar los trazos del usuario
    const userStroke = normalizeStrokes(allStrokes);
    
    // 2. Obtener puntos de referencia para la letra
    const refPoints = getStrokePattern(letter);
    
    // 3. Calcular similitud
    const similarity = calculateSimilarity(userStroke, refPoints);
    
    // 4. Determinar puntuación y retroalimentación
    let score, feedbackText;
    
    if (similarity >= 0.8) {
      score = 0.9 + (Math.random() * 0.1); // 90-100%
      feedbackText = '¡Excelente! Has dibujado la letra perfectamente.';
      
      // Efecto de confeti
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else if (similarity >= 0.6) {
      score = 0.7 + (Math.random() * 0.2); // 70-90%
      feedbackText = 'Muy bien. Tu letra tiene buena forma.';
    } else if (similarity >= 0.4) {
      score = 0.5 + (Math.random() * 0.2); // 50-70%
      feedbackText = 'Buen intento. Observa el ejemplo y vuelve a intentarlo.';
    } else {
      score = 0.3 + (Math.random() * 0.2); // 30-50%
      feedbackText = 'Sigue practicando. Fíjate en los trazos del ejemplo.';
    }
    
    // Actualizar estado
    currentScore = score;
    feedback = feedbackText;
    showFeedback = true;
    
    // Si hay un buen puntaje o demasiados intentos, marcar como completado
    if (score > 0.8 || attempts >= 5) {
      setTimeout(() => {
        if (!activityComplete) {
          completeActivity();
        }
      }, 3000);
    }
  }
  
  // Normalizar trazos a escala 0-1
  function normalizeStrokes(strokes) {
    if (strokes.length === 0) return [];
    
    // Aplanar todos los trazos en un único array
    let points = [];
    strokes.forEach(stroke => {
      points = points.concat(stroke);
    });
    
    // Encontrar límites
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    
    // Normalizar a escala 0-1
    const width = maxX - minX;
    const height = maxY - minY;
    
    return points.map(p => ({
      x: (p.x - minX) / (width || 1),
      y: (p.y - minY) / (height || 1)
    }));
  }
  
  // Calcular similitud entre trazos del usuario y el patrón
  function calculateSimilarity(userPoints, refPoints) {
    // En una aplicación real, usaríamos algoritmos más sofisticados
    // Simulamos una puntuación basada en la calidad de los trazos
    
    if (userPoints.length < 5) {
      return 0; // Demasiado pocos puntos
    }
    
    // Para esta simulación, basamos la similitud en:
    // 1. Número de intentos (mejora con la práctica)
    // 2. Cantidad de puntos (más puntos = más precisión)
    // 3. Un factor aleatorio para simular variabilidad
    
    const attemptsScore = Math.min(1, attempts / 5) * 0.3;
    const pointsScore = Math.min(1, userPoints.length / 50) * 0.3;
    const randomFactor = 0.4 * Math.random();
    
    return attemptsScore + pointsScore + randomFactor;
  }
  
  // Reiniciar dibujo
  function resetDrawing() {
    allStrokes = [];
    currentStroke = [];
    showFeedback = false;
    clearCanvas();
  }
  
  // Completar actividad
  function completeActivity() {
    if (activityComplete) return;
    
    activityComplete = true;
    
    // Notificar al componente padre
    dispatch('complete', {
      score: currentScore,
      activityId: 'motion-recognition'
    });
    
    // Si hay un callback, llamarlo
    if (onComplete) {
      onComplete({
        detail: {
          score: currentScore,
          activityId: 'motion-recognition'
        }
      });
    }
  }
</script>

<div class="motion-recognition-activity">
  <div class="activity-header">
    <button class="back-button" on:click={onBack}>
      <span class="back-icon">←</span> Volver
    </button>
    <h2 class="activity-title">Letra en Movimiento: {letter}</h2>
  </div>
  
  <div class="activity-content">
    <div class="canvas-container">
      <canvas 
        bind:this={canvas}
        on:mousedown={startDrawing}
        on:mousemove={draw}
        on:mouseup={stopDrawing}
        on:mouseleave={stopDrawing}
        on:touchstart|preventDefault={startDrawing}
        on:touchmove|preventDefault={draw}
        on:touchend|preventDefault={stopDrawing}
      ></canvas>
      
      <div class="canvas-controls">
        <button class="control-button example" on:click={showExample}>
          Ver Ejemplo
        </button>
        <button class="control-button reset" on:click={resetDrawing}>
          Limpiar
        </button>
      </div>
      
      {#if showFeedback}
        <div class="drawing-feedback" style="--score: {currentScore}">
          <div class="feedback-score">{Math.round(currentScore * 100)}% de precisión</div>
          <div class="feedback-text">{feedback}</div>
        </div>
      {/if}
    </div>
    
    <div class="drawing-instructions">
      <h3 class="section-title">Cómo escribir la letra {letter}</h3>
      
      <div class="instruction-steps">
        <ol>
          <li>Observa la forma de la letra {letter} en el ejemplo.</li>
          <li>Sigue las líneas punteadas con tu dedo o ratón.</li>
          <li>Practica el trazo varias veces para mejorar.</li>
          <li>Recuerda que las letras mayúsculas comienzan en la línea superior.</li>
        </ol>
      </div>
      
      <div class="instruction-tips">
        <h4>Consejos:</h4>
        <ul>
          <li>Mantén trazos fluidos y continuos.</li>
          <li>Utiliza las líneas guía para mantener el tamaño correcto.</li>
          <li>Practica lentamente al principio y luego aumenta la velocidad.</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="activity-footer">
    <button class="finish-button" on:click={completeActivity}>
      Finalizar Actividad
    </button>
  </div>
</div>

<style>
  .motion-recognition-activity {
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
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .canvas-container {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  canvas {
    border: 2px solid rgba(91, 72, 199, 0.2);
    border-radius: var(--border-radius);
    touch-action: none;
    cursor: crosshair;
    width: 100%;
    max-width: 400px;
    height: auto;
  }
  
  .canvas-controls {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .control-button {
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    font-weight: 600;
  }
  
  .control-button.example {
    background-color: var(--primary);
    color: white;
  }
  
  .control-button.example:hover {
    background-color: var(--primary-dark);
  }
  
  .control-button.reset {
    background-color: transparent;
    color: var(--primary);
    border: 1px solid var(--primary);
  }
  
  .control-button.reset:hover {
    background-color: rgba(91, 72, 199, 0.1);
  }
  
  .drawing-feedback {
    background-color: rgba(91, 72, 199, 0.05);
    border-radius: var(--border-radius);
    padding: 1rem;
    width: 100%;
    text-align: center;
    --score-color: var(--success);
  }
  
  /* Cambiar color según puntuación */
  .drawing-feedback[style*="--score:0.1"],
  .drawing-feedback[style*="--score:0.2"],
  .drawing-feedback[style*="--score:0.3"],
  .drawing-feedback[style*="--score:0.4"] {
    --score-color: var(--error);
  }
  
  .drawing-feedback[style*="--score:0.5"],
  .drawing-feedback[style*="--score:0.6"],
  .drawing-feedback[style*="--score:0.7"] {
    --score-color: var(--warning);
  }
  
  .feedback-score {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--score-color);
    margin-bottom: 0.5rem;
  }
  
  .feedback-text {
    color: var(--text);
  }
  
  .drawing-instructions {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .section-title {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--primary);
  }
  
  .instruction-steps ol, .instruction-tips ul {
    padding-left: 1.5rem;
    line-height: 1.6;
  }
  
  .instruction-steps li, .instruction-tips li {
    margin-bottom: 0.5rem;
  }
  
  .instruction-tips h4 {
    margin-bottom: 0.5rem;
    color: var(--primary);
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
    
    .canvas-controls {
      flex-direction: column;
      width: 100%;
    }
    
    .control-button {
      width: 100%;
    }
  }
</style>