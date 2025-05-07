<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { getAdjacentLetters, getRandomElements } from '../../../config/activities.js';
  
  // Props
  export let letter; // La letra actual 
  export let language = 'spanish'; // Idioma seleccionado (default: español)
  export let onComplete; // Callback para cuando se completa la actividad
  export let onBack; // Callback para volver al menú
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Estado local
  let currentLetter = letter || 'A';
  let previousLetter = null;
  let nextLetter = null;
  let userPrevious = '';
  let userNext = '';
  let score = 0;
  let totalRounds = 5; // Número total de rondas
  let currentRound = 0;
  let isAnswerChecked = false;
  let feedback = '';
  let feedbackClass = '';
  let isActivityCompleted = false;
  let completionMessage = '';
  let showCorrectAnswer = false;
  let nextQuestionTimeout = null;
  
  // Variables para pistas
  let showHints = false;
  let alphabetVisible = false;
  let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Sonidos
  let successSound = null;
  let errorSound = null;
  
  // Al montar el componente
  onMount(() => {
    // Inicializar sonidos
    try {
      successSound = new Audio('/sounds/success.mp3');
      errorSound = new Audio('/sounds/error.mp3');
    } catch (error) {
      console.error('Error al inicializar sonidos:', error);
    }
    
    // Iniciar la primera ronda
    startNewRound();
    
    // Limpieza al desmontar
    return () => {
      if (nextQuestionTimeout) clearTimeout(nextQuestionTimeout);
      [successSound, errorSound].forEach(sound => {
        if (sound) {
          sound.pause();
          sound.currentTime = 0;
        }
      });
    };
  });
  
  // Iniciar una nueva ronda
  function startNewRound() {
    // Incrementar contador de rondas
    currentRound++;
    
    // Resetear estado
    userPrevious = '';
    userNext = '';
    isAnswerChecked = false;
    feedback = '';
    showCorrectAnswer = false;
    showHints = false;
    alphabetVisible = false;
    
    // Seleccionar una letra aleatoria
    selectRandomLetter();
  }
  
  // Seleccionar una letra aleatoria para la pregunta
  function selectRandomLetter() {
    // En el primer nivel comenzamos con la letra proporcionada
    if (currentRound === 1 && letter) {
      currentLetter = letter;
    } else {
      // Seleccionar una letra aleatoria (evitando A y Z si es posible para tener anterior y siguiente)
      const safeLetters = alphabet.slice(1, -1); // Excluir A y Z
      currentLetter = getRandomElements(safeLetters, 1)[0];
    }
    
    // Obtener letras adyacentes
    const adjacent = getAdjacentLetters(currentLetter);
    previousLetter = adjacent.previous;
    nextLetter = adjacent.next;
  }
  
  // Verificar la respuesta
  function checkAnswer() {
    if (isAnswerChecked) return;
    
    isAnswerChecked = true;
    
    // Normalizar entradas del usuario (convertir a mayúsculas)
    const normPrev = userPrevious.toUpperCase().trim();
    const normNext = userNext.toUpperCase().trim();
    
    // Verificar respuestas
    const isPreviousCorrect = normPrev === previousLetter;
    const isNextCorrect = normNext === nextLetter;
    
    // Calcular puntuación (medio punto por cada respuesta correcta)
    let roundScore = 0;
    if (isPreviousCorrect) roundScore += 0.5;
    if (isNextCorrect) roundScore += 0.5;
    
    score += roundScore;
    
    // Determinar feedback
    if (isPreviousCorrect && isNextCorrect) {
      feedback = language === 'english' 
        ? 'Perfect! Both answers are correct!' 
        : '¡Perfecto! ¡Ambas respuestas son correctas!';
      feedbackClass = 'positive';
      
      // Reproducir sonido de éxito
      if (successSound) {
        successSound.play();
      }
    } else if (isPreviousCorrect || isNextCorrect) {
      feedback = language === 'english' 
        ? 'Almost there! One answer is correct.' 
        : '¡Casi! Una respuesta es correcta.';
      feedbackClass = 'neutral';
      showCorrectAnswer = true;
      
      // Reproducir sonido mixto
      if (successSound && errorSound) {
        if (Math.random() > 0.5) {
          successSound.play();
        } else {
          errorSound.play();
        }
      }
    } else {
      feedback = language === 'english' 
        ? 'Try again! Both answers are incorrect.' 
        : '¡Inténtalo de nuevo! Ambas respuestas son incorrectas.';
      feedbackClass = 'negative';
      showCorrectAnswer = true;
      
      // Reproducir sonido de error
      if (errorSound) {
        errorSound.play();
      }
    }
    
    // Comprobar si hemos completado todas las rondas
    if (currentRound >= totalRounds) {
      nextQuestionTimeout = setTimeout(completeActivity, 3000);
    } else {
      // Pasar a la siguiente ronda después de un breve delay
      nextQuestionTimeout = setTimeout(startNewRound, 3000);
    }
  }
  
  // Mostrar u ocultar pistas
  function toggleHints() {
    showHints = !showHints;
  }
  
  // Mostrar u ocultar alfabeto completo
  function toggleAlphabet() {
    alphabetVisible = !alphabetVisible;
  }
  
  // Completar la actividad
  function completeActivity() {
    // Calcular puntuación final (0-1)
    const finalScore = score / totalRounds;
    
    // Mostrar mensaje de finalización
    isActivityCompleted = true;
    
    // Generar mensaje según la puntuación
    if (finalScore >= 0.8) {
      completionMessage = language === 'english' 
        ? 'Excellent work! You are a master of alphabet sequences!' 
        : '¡Excelente trabajo! ¡Eres un maestro de las secuencias alfabéticas!';
    } else if (finalScore >= 0.6) {
      completionMessage = language === 'english' 
        ? 'Good job! You know the alphabet sequence well!' 
        : '¡Buen trabajo! ¡Conoces bien la secuencia alfabética!';
    } else {
      completionMessage = language === 'english' 
        ? 'Keep practicing the alphabet. With more practice you\'ll master it!' 
        : '¡Sigue practicando el alfabeto. ¡Con más práctica lo dominarás!';
    }
    
    // Emitir evento de finalización
    dispatch('complete', {
      score: finalScore,
      activityId: 'letter-sequence'
    });
  }
  
  // Volver al menú
  function handleBack() {
    if (nextQuestionTimeout) clearTimeout(nextQuestionTimeout);
    onBack();
  }
</script>

<div class="sequence-activity">
  <div class="activity-header">
    <button class="back-button" on:click={handleBack}>
      <span class="back-icon">←</span> 
      {language === 'english' ? 'Back' : 'Volver'}
    </button>
    
    <h1 class="activity-title">
      {language === 'english' ? 'Letter Sequence' : 'Secuencia de Letras'}
    </h1>
    
    <div class="progress-container">
      <div class="progress-bar" style="--progress: {(currentRound / totalRounds) * 100}%"></div>
      <span class="progress-text">{currentRound}/{totalRounds}</span>
    </div>
  </div>
  
  {#if !isActivityCompleted}
    <div class="sequence-content">
      <div class="question-container">
        <div class="sequence-instruction">
          {language === 'english' 
            ? 'What letters come before and after?' 
            : '¿Qué letras van antes y después?'}
        </div>
        
        <div class="sequence-display">
          <div class="sequence-item">
            <div class="sequence-letter previous">
              <input 
                type="text" 
                maxlength="1"
                placeholder="?"
                bind:value={userPrevious}
                disabled={isAnswerChecked}
                class:correct={isAnswerChecked && userPrevious.toUpperCase().trim() === previousLetter}
                class:incorrect={isAnswerChecked && userPrevious.toUpperCase().trim() !== previousLetter}
              />
            </div>
            <div class="sequence-arrow">←</div>
          </div>
          
          <div class="sequence-item current">
            <div class="current-letter">{currentLetter}</div>
          </div>
          
          <div class="sequence-item">
            <div class="sequence-arrow">→</div>
            <div class="sequence-letter next">
              <input 
                type="text" 
                maxlength="1"
                placeholder="?"
                bind:value={userNext}
                disabled={isAnswerChecked}
                class:correct={isAnswerChecked && userNext.toUpperCase().trim() === nextLetter}
                class:incorrect={isAnswerChecked && userNext.toUpperCase().trim() !== nextLetter}
              />
            </div>
          </div>
        </div>
        
        {#if showCorrectAnswer}
          <div class="correct-answer">
            <span class="answer-label">
              {language === 'english' ? 'Correct sequence:' : 'Secuencia correcta:'}
            </span>
            <div class="answer-sequence">
              <div class="answer-letter">{previousLetter || '-'}</div>
              <div class="answer-arrow">→</div>
              <div class="answer-letter current">{currentLetter}</div>
              <div class="answer-arrow">→</div>
              <div class="answer-letter">{nextLetter || '-'}</div>
            </div>
          </div>
        {/if}
      </div>
      
      <div class="action-container">
        {#if feedback}
          <div class="feedback {feedbackClass}">
            {feedback}
          </div>
        {/if}
        
        {#if !isAnswerChecked}
          <div class="hint-tools">
            <button class="hint-button" on:click={toggleHints}>
              {showHints 
                ? (language === 'english' ? 'Hide Hints' : 'Ocultar Pistas')
                : (language === 'english' ? 'Show Hints' : 'Mostrar Pistas')
              }
            </button>
            
            {#if showHints}
              <button class="alphabet-button" on:click={toggleAlphabet}>
                {alphabetVisible 
                  ? (language === 'english' ? 'Hide Alphabet' : 'Ocultar Alfabeto')
                  : (language === 'english' ? 'Show Alphabet' : 'Mostrar Alfabeto')
                }
              </button>
            {/if}
          </div>
          
          {#if alphabetVisible}
            <div class="alphabet-display">
              {#each alphabet as letter}
                <div class="alphabet-letter" class:current={letter === currentLetter}>
                  {letter}
                </div>
              {/each}
            </div>
          {/if}
          
          <button 
            class="check-button"
            class:disabled={!userPrevious && !userNext}
            on:click={checkAnswer}
          >
            {language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Pantalla de actividad completada -->
    <div class="completion-screen">
      <div class="completion-icon">🏆</div>
      <h2 class="completion-title">
        {language === 'english' ? 'Sequence Mastered!' : '¡Secuencia Dominada!'}
      </h2>
      <p class="completion-message">{completionMessage}</p>
      <div class="completion-score">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">{language === 'english' ? 'Score' : 'Puntuación'}</span>
            <span class="stat-value correct">{score}/{totalRounds}</span>
          </div>
        </div>
        
        <div class="stars">
          {#each Array(Math.round(score / totalRounds * 5)) as _, i}
            <span class="star">⭐</span>
          {/each}
        </div>
        
        <p class="score-text">
          {language === 'english' ? 'Your score' : 'Tu puntuación'}: {Math.round(score / totalRounds * 100)}%
        </p>
      </div>
      <button class="continue-button" on:click={handleBack}>
        {language === 'english' ? 'Continue' : 'Continuar'}
      </button>
    </div>
  {/if}
</div>

<style>
  .sequence-activity {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: #f8f9fa;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #4361ee;
    color: white;
  }
  
  .back-button {
    background: none;
    border: none;
    color: white;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .back-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .back-icon {
    margin-right: 5px;
    font-size: 1.2rem;
  }
  
  .activity-title {
    font-size: 1.5rem;
    margin: 0;
    text-align: center;
    flex-grow: 1;
  }
  
  .progress-container {
    position: relative;
    width: 120px;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: var(--progress);
    background-color: #4cc9f0;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.875rem;
    font-weight: bold;
    color: white;
  }
  
  .sequence-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    flex-grow: 1;
    gap: 2rem;
  }
  
  .question-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    max-width: 600px;
  }
  
  .sequence-instruction {
    font-size: 1.5rem;
    font-weight: bold;
    color: #3a0ca3;
    margin-bottom: 2rem;
  }
  
  .sequence-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .sequence-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .sequence-arrow {
    font-size: 2rem;
    color: #4361ee;
    font-weight: bold;
  }
  
  .current-letter {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    font-weight: bold;
    color: white;
    background-color: #3a0ca3;
    border-radius: 50%;
    box-shadow: 0 8px 16px rgba(58, 12, 163, 0.3);
    animation: pulse 2s infinite ease-in-out;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 8px 16px rgba(58, 12, 163, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 12px 24px rgba(58, 12, 163, 0.4);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 8px 16px rgba(58, 12, 163, 0.3);
    }
  }
  
  .sequence-letter input {
    width: 70px;
    height: 70px;
    font-size: 2.5rem;
    font-weight: bold;
    text-align: center;
    color: #3a0ca3;
    background-color: white;
    border: 3px solid #e9ecef;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .sequence-letter input:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
  }
  
  .sequence-letter input.correct {
    border-color: #38b000;
    background-color: rgba(56, 176, 0, 0.1);
    color: #38b000;
  }
  
  .sequence-letter input.incorrect {
    border-color: #d90429;
    background-color: rgba(217, 4, 41, 0.1);
    color: #d90429;
  }
  
  .correct-answer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 1rem;
    background-color: rgba(67, 97, 238, 0.1);
    border-radius: 12px;
    animation: fadeIn 0.5s ease;
  }
  
  .answer-label {
    font-size: 1rem;
    font-weight: bold;
    color: #4361ee;
  }
  
  .answer-sequence {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .answer-letter {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: #4361ee;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .answer-letter.current {
    background-color: #3a0ca3;
    color: white;
  }
  
  .answer-arrow {
    font-size: 1.2rem;
    color: #4361ee;
  }
  
  .action-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .hint-tools {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .hint-button,
  .alphabet-button {
    background-color: #e9ecef;
    color: #3a0ca3;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .hint-button:hover,
  .alphabet-button:hover {
    background-color: #dee2e6;
  }
  
  .alphabet-display {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #f1f3f5;
    border-radius: 12px;
    max-width: 500px;
    animation: fadeIn 0.3s ease;
  }
  
  .alphabet-letter {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: bold;
    color: #4361ee;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .alphabet-letter.current {
    background-color: #3a0ca3;
    color: white;
    transform: scale(1.2);
    box-shadow: 0 2px 6px rgba(58, 12, 163, 0.3);
  }
  
  .check-button {
    background-color: #4361ee;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-top: 1rem;
  }
  
  .check-button:hover:not(.disabled) {
    background-color: #3a0ca3;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .check-button.disabled {
    opacity: 0.5;
    cursor: default;
  }
  
  .feedback {
    font-size: 1.2rem;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .feedback.positive {
    color: #38b000;
  }
  
  .feedback.neutral {
    color: #ff9e00;
  }
  
  .feedback.negative {
    color: #d90429;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Pantalla de finalización */
  .completion-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    flex-grow: 1;
    text-align: center;
    gap: 1.5rem;
    background: linear-gradient(135deg, #4cc9f0 0%, #3a0ca3 100%);
    color: white;
  }
  
  .completion-icon {
    font-size: 5rem;
    animation: bounce 1s ease infinite alternate;
  }
  
  .completion-title {
    font-size: 2.5rem;
    margin: 0;
  }
  
  .completion-message {
    font-size: 1.2rem;
    max-width: 80%;
  }
  
  .completion-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 1.5rem 0;
    gap: 1rem;
  }
  
  .stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-label {
    font-size: 0.875rem;
    opacity: 0.8;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
  }
  
  .stat-value.correct {
    color: #a7f3d0;
  }
  
  .stars {
    display: flex;
    gap: 0.5rem;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .star {
    animation: twinkle 1.5s ease infinite alternate;
  }
  
  .star:nth-child(2) {
    animation-delay: 0.3s;
  }
  
  .star:nth-child(3) {
    animation-delay: 0.6s;
  }
  
  .star:nth-child(4) {
    animation-delay: 0.9s;
  }
  
  .star:nth-child(5) {
    animation-delay: 1.2s;
  }
  
  @keyframes twinkle {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
  
  @keyframes bounce {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-10px);
    }
  }
  
  .score-text {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
  }
  
  .continue-button {
    background-color: white;
    color: #3a0ca3;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .continue-button:hover {
    background-color: #f8f8f8;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
</style>