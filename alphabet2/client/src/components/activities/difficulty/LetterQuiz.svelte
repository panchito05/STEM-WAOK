<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { letterExamples, getRandomElements } from '../../../config/activities.js';
  
  // Props
  export let letter; // La letra actual (aunque en este nivel seleccionaremos letras aleatorias)
  export let language = 'spanish'; // Idioma seleccionado (default: español)
  export let onComplete; // Callback para cuando se completa la actividad
  export let onBack; // Callback para volver al menú
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Estado local
  let currentQuestion = null;
  let letterOptions = [];
  let optionsCount = 4; // Número de opciones a mostrar
  let score = 0;
  let mistakes = 0;
  let totalQuestions = 5; // Número total de preguntas
  let currentQuestionIndex = 0;
  let selectedOption = null;
  let isAnswerChecked = false;
  let feedback = '';
  let feedbackClass = '';
  let isActivityCompleted = false;
  let completionMessage = '';
  let revealCorrect = false;
  
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
    
    // Iniciar el primer quiz
    startNewQuestion();
    
    // Limpieza al desmontar
    return () => {
      [successSound, errorSound].forEach(sound => {
        if (sound) {
          sound.pause();
          sound.currentTime = 0;
        }
      });
    };
  });
  
  // Iniciar una nueva pregunta
  function startNewQuestion() {
    // Incrementar contador de preguntas
    currentQuestionIndex++;
    
    // Resetear estado de selección
    selectedOption = null;
    isAnswerChecked = false;
    feedback = '';
    revealCorrect = false;
    
    // Generar nueva pregunta
    generateQuizQuestion();
  }
  
  // Generar pregunta de quiz
  function generateQuizQuestion() {
    // Obtener todas las letras disponibles
    const allLetters = Object.keys(letterExamples[language]);
    
    // Seleccionar una letra aleatoria como respuesta correcta
    const questionLetter = getRandomElements(allLetters, 1)[0];
    
    // Obtener datos de la letra seleccionada
    const letterData = letterExamples[language][questionLetter];
    
    // Crear la pregunta
    currentQuestion = {
      imageUrl: letterData.imageUrl,
      word: letterData.word,
      correctLetter: questionLetter
    };
    
    // Seleccionar algunas letras incorrectas como opciones
    const incorrectLetters = getRandomElements(
      allLetters.filter(l => l !== questionLetter),
      optionsCount - 1
    );
    
    // Combinar y mezclar las opciones
    const options = [questionLetter, ...incorrectLetters]
      .sort(() => 0.5 - Math.random())
      .map(letter => ({
        letter: letter,
        isCorrect: letter === questionLetter
      }));
    
    // Actualizar estado
    letterOptions = options;
  }
  
  // Manejar la selección de una opción
  function handleSelectOption(option) {
    if (isAnswerChecked) return;
    
    selectedOption = option;
  }
  
  // Verificar la respuesta
  function checkAnswer() {
    if (!selectedOption || isAnswerChecked) return;
    
    isAnswerChecked = true;
    
    // Comprobar si es correcta
    if (selectedOption.isCorrect) {
      // Respuesta correcta
      score++;
      feedback = language === 'english' ? 'Correct!' : '¡Correcto!';
      feedbackClass = 'positive';
      
      // Reproducir sonido de éxito
      if (successSound) {
        successSound.play();
      }
    } else {
      // Respuesta incorrecta
      mistakes++;
      feedback = language === 'english' ? 'Incorrect!' : '¡Incorrecto!';
      feedbackClass = 'negative';
      revealCorrect = true;
      
      // Reproducir sonido de error
      if (errorSound) {
        errorSound.play();
      }
    }
    
    // Comprobar si hemos completado todas las preguntas
    if (currentQuestionIndex >= totalQuestions) {
      setTimeout(completeActivity, 2000);
    } else {
      // Pasar a la siguiente pregunta después de un breve delay
      setTimeout(startNewQuestion, 2000);
    }
  }
  
  // Completar la actividad
  function completeActivity() {
    // Calcular puntuación final (0-1)
    const finalScore = score / totalQuestions;
    
    // Mostrar mensaje de finalización
    isActivityCompleted = true;
    
    // Generar mensaje según la puntuación
    if (finalScore >= 0.8) {
      completionMessage = language === 'english' 
        ? 'Amazing work! You have a great knowledge of letters!' 
        : '¡Increíble trabajo! Tienes un gran conocimiento de las letras!';
    } else if (finalScore >= 0.6) {
      completionMessage = language === 'english' 
        ? 'Good job! Keep practicing to improve your letter recognition!' 
        : '¡Buen trabajo! Sigue practicando para mejorar tu reconocimiento de letras!';
    } else {
      completionMessage = language === 'english' 
        ? 'Keep practicing! You\'ll get better with each attempt.' 
        : '¡Sigue practicando! Mejorarás con cada intento.';
    }
    
    // Emitir evento de finalización
    dispatch('complete', {
      score: finalScore,
      activityId: 'letter-quiz'
    });
  }
  
  // Volver al menú
  function handleBack() {
    onBack();
  }
</script>

<div class="quiz-activity">
  <div class="activity-header">
    <button class="back-button" on:click={handleBack}>
      <span class="back-icon">←</span> 
      {language === 'english' ? 'Back' : 'Volver'}
    </button>
    
    <h1 class="activity-title">
      {language === 'english' ? 'Letter Quiz' : 'Quiz de Letras'}
    </h1>
    
    <div class="progress-container">
      <div class="progress-bar" style="--progress: {(currentQuestionIndex / totalQuestions) * 100}%"></div>
      <span class="progress-text">{currentQuestionIndex}/{totalQuestions}</span>
    </div>
  </div>
  
  {#if !isActivityCompleted && currentQuestion}
    <div class="quiz-content">
      <div class="question-container">
        <img 
          src={currentQuestion.imageUrl} 
          alt={currentQuestion.word}
          class="question-image"
        />
        <p class="question-word">{currentQuestion.word}</p>
        
        <div class="question-prompt">
          {language === 'english' 
            ? 'Which letter does this word start with?' 
            : '¿Con qué letra comienza esta palabra?'}
        </div>
      </div>
      
      <div class="options-grid">
        {#each letterOptions as option, index}
          <button 
            class="option-button"
            class:selected={selectedOption === option}
            class:correct={isAnswerChecked && option.isCorrect}
            class:incorrect={isAnswerChecked && selectedOption === option && !option.isCorrect}
            class:reveal={revealCorrect && option.isCorrect}
            on:click={() => handleSelectOption(option)}
            disabled={isAnswerChecked}
          >
            {option.letter}
          </button>
        {/each}
      </div>
      
      <div class="action-container">
        {#if feedback}
          <div class="feedback {feedbackClass}">
            {feedback}
          </div>
        {/if}
        
        {#if !isAnswerChecked}
          <button 
            class="check-button"
            class:disabled={!selectedOption}
            on:click={checkAnswer}
          >
            {language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
          </button>
        {/if}
      </div>
    </div>
  {:else if isActivityCompleted}
    <!-- Pantalla de actividad completada -->
    <div class="completion-screen">
      <div class="completion-icon">🏆</div>
      <h2 class="completion-title">
        {language === 'english' ? 'Quiz Completed!' : '¡Quiz Completado!'}
      </h2>
      <p class="completion-message">{completionMessage}</p>
      <div class="completion-score">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">{language === 'english' ? 'Correct' : 'Correctas'}</span>
            <span class="stat-value correct">{score}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{language === 'english' ? 'Incorrect' : 'Incorrectas'}</span>
            <span class="stat-value incorrect">{mistakes}</span>
          </div>
        </div>
        
        <div class="stars">
          {#each Array(Math.round(score / totalQuestions * 5)) as _, i}
            <span class="star">⭐</span>
          {/each}
        </div>
        
        <p class="score-text">
          {language === 'english' ? 'Your score' : 'Tu puntuación'}: {Math.round(score / totalQuestions * 100)}%
        </p>
      </div>
      <button class="continue-button" on:click={handleBack}>
        {language === 'english' ? 'Continue' : 'Continuar'}
      </button>
    </div>
  {/if}
</div>

<style>
  .quiz-activity {
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
  
  .quiz-content {
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
  }
  
  .question-image {
    width: 120px;
    height: 120px;
    object-fit: contain;
    margin-bottom: 1rem;
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .question-word {
    font-size: 2rem;
    font-weight: bold;
    color: #3a0ca3;
    margin: 0.5rem 0 1rem;
  }
  
  .question-prompt {
    font-size: 1.2rem;
    color: #4361ee;
    margin-bottom: 1rem;
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    width: 100%;
    max-width: 400px;
  }
  
  .option-button {
    background-color: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 1.5rem;
    font-size: 2.5rem;
    font-weight: bold;
    color: #3a0ca3;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }
  
  .option-button:hover:not(:disabled) {
    background-color: #f8f9fa;
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
  
  .option-button.selected {
    border-color: #4361ee;
    background-color: rgba(67, 97, 238, 0.1);
  }
  
  .option-button.correct {
    border-color: #38b000;
    background-color: rgba(56, 176, 0, 0.1);
    color: #38b000;
  }
  
  .option-button.incorrect {
    border-color: #d90429;
    background-color: rgba(217, 4, 41, 0.1);
    color: #d90429;
  }
  
  .option-button.reveal {
    animation: pulse 1s ease infinite;
    border-color: #38b000;
    background-color: rgba(56, 176, 0, 0.1);
    color: #38b000;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  .action-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
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
  
  .stat-value.incorrect {
    color: #fda4af;
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