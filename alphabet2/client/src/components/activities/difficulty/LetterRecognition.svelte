<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { letterExamples } from '../../../config/activities.js';
  
  // Props
  export let letter = 'A'; // La letra actual (default: A)
  export let language = 'spanish'; // Idioma seleccionado (default: español)
  export let onComplete; // Callback para cuando se completa la actividad
  export let onBack; // Callback para volver al menú
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Alfabeto completo
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Estado local
  let currentLetterIndex = 0;
  let currentLetter = letter;
  let currentOptions = [];
  let correctOptionIndex = 0;
  let selectedOptionIndex = -1;
  let totalExercises = 10;
  let currentExercise = 0;
  let score = 0;
  let feedback = '';
  let feedbackType = ''; // success, error
  let showFeedback = false;
  let isComplete = false;
  
  // Inicializar actividad
  onMount(() => {
    // Establecer la primera letra (usando la proporcionada o A por defecto)
    if (letter && ALPHABET.includes(letter)) {
      currentLetter = letter;
      currentLetterIndex = ALPHABET.indexOf(letter);
    } else {
      currentLetter = 'A';
      currentLetterIndex = 0;
    }
    
    // Generar las primeras opciones
    generateOptions();
    
    console.log(`Actividad iniciada con la letra ${currentLetter}`);
  });
  
  // Generar opciones para la letra actual
  function generateOptions() {
    // Asegurarnos de que tenemos datos para la letra actual
    if (!letterExamples[language] || !letterExamples[language][currentLetter]) {
      console.error(`No hay datos para la letra ${currentLetter} en ${language}`);
      return;
    }
    
    // Obtener datos de la letra correcta
    const correctOption = {
      letter: currentLetter,
      word: letterExamples[language][currentLetter].word,
      image: letterExamples[language][currentLetter].imageUrl,
      correct: true
    };
    
    // Obtener letras disponibles excluyendo la actual
    const availableLetters = Object.keys(letterExamples[language])
      .filter(l => l !== currentLetter);
    
    if (availableLetters.length === 0) {
      console.error('No hay suficientes letras para generar opciones');
      return;
    }
    
    // Seleccionar una letra aleatoria para la opción incorrecta
    const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    
    // Crear opción incorrecta
    const incorrectOption = {
      letter: randomLetter,
      word: letterExamples[language][randomLetter].word,
      image: letterExamples[language][randomLetter].imageUrl,
      correct: false
    };
    
    // Crear array con ambas opciones
    let options = [correctOption, incorrectOption];
    
    // Mezclar opciones para que no siempre la correcta esté en la misma posición
    options = options.sort(() => Math.random() - 0.5);
    
    // Actualizar estado
    currentOptions = options;
    correctOptionIndex = options.findIndex(opt => opt.correct);
    
    console.log(`Opciones generadas para ${currentLetter}:`, options);
  }
  
  // Manejar la selección de una opción
  function handleOptionSelect(index) {
    // No permitir selección si ya hay feedback visible
    if (showFeedback) return;
    
    // Registrar la opción seleccionada
    selectedOptionIndex = index;
    const isCorrect = index === correctOptionIndex;
    
    // Actualizar puntuación y feedback
    if (isCorrect) {
      score++;
      feedback = language === 'english' ? 'Correct!' : '¡Correcto!';
      feedbackType = 'success';
    } else {
      feedback = language === 'english' ? 'Try again!' : '¡Inténtalo de nuevo!';
      feedbackType = 'error';
    }
    
    // Mostrar feedback
    showFeedback = true;
    
    // Después de un tiempo, continuar o volver a intentar
    setTimeout(() => {
      if (isCorrect) {
        currentExercise++;
        
        // Verificar si hemos completado todos los ejercicios
        if (currentExercise >= totalExercises) {
          completeActivity();
        } else {
          // Avanzar a la siguiente letra
          nextLetter();
        }
      } else {
        // Si es incorrecto, limpiar selección y feedback
        selectedOptionIndex = -1;
        showFeedback = false;
      }
    }, 1500);
  }
  
  // Avanzar a la siguiente letra
  function nextLetter() {
    // Incrementar índice y asegurar que esté dentro del rango del alfabeto
    currentLetterIndex = (currentLetterIndex + 1) % ALPHABET.length;
    currentLetter = ALPHABET[currentLetterIndex];
    
    // Generar nuevas opciones
    generateOptions();
    
    // Resetear selección y feedback
    selectedOptionIndex = -1;
    showFeedback = false;
    
    console.log(`Avanzando a la letra ${currentLetter}`);
  }
  
  // Completar la actividad
  function completeActivity() {
    isComplete = true;
    const finalScore = score / totalExercises;
    
    console.log(`Actividad completada con puntuación: ${finalScore * 100}%`);
    
    // Notificar al componente padre
    dispatch('complete', {
      score: finalScore,
      activityId: 'letter-recognition'
    });
  }
  
  // Reproducir sonido de la letra
  function playLetterSound() {
    try {
      const utterance = new SpeechSynthesisUtterance(currentLetter);
      utterance.lang = language === 'english' ? 'en-US' : 'es-ES';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }
  
  // Reproducir sonido de la palabra
  function playWordSound() {
    try {
      const correctOption = currentOptions[correctOptionIndex];
      if (correctOption) {
        const utterance = new SpeechSynthesisUtterance(correctOption.word);
        utterance.lang = language === 'english' ? 'en-US' : 'es-ES';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }
  
  // Volver al menú
  function handleBack() {
    onBack();
  }
</script>

<div class="letter-recognition">
  <!-- Encabezado -->
  <header class="header">
    <button class="back-button" on:click={handleBack}>
      <span>←</span> {language === 'english' ? 'Back' : 'Volver'}
    </button>
    
    <h1 class="title">{language === 'english' ? 'Letter Recognition' : 'Reconocimiento de Letras'}</h1>
    
    <div class="progress">
      <div class="progress-bar" style="width: {(currentExercise / totalExercises) * 100}%"></div>
      <span class="progress-text">{currentExercise}/{totalExercises}</span>
    </div>
  </header>
  
  <!-- Contenido principal -->
  {#if !isComplete}
    <main class="content">
      <!-- Letra actual -->
      <div class="letter-display">
        <div class="letter">
          <span class="uppercase">{currentLetter}</span>
          <span class="lowercase">{currentLetter.toLowerCase()}</span>
        </div>
        
        <button class="sound-button" on:click={playLetterSound}>
          <span>🔊</span>
        </button>
      </div>
      
      <!-- Palabra ejemplo -->
      {#if currentOptions.length > 0 && correctOptionIndex !== undefined}
        <div class="word-display">
          <p class="word">{currentOptions[correctOptionIndex]?.word || ''}</p>
          
          <button class="sound-button" on:click={playWordSound}>
            <span>🔊</span>
          </button>
        </div>
      {/if}
      
      <!-- Instrucción -->
      <p class="instruction">
        {language === 'english' 
          ? 'Choose the image that matches this letter:' 
          : 'Elige la imagen que corresponde a esta letra:'}
      </p>
      
      <!-- Opciones -->
      <div class="options">
        {#each currentOptions as option, index}
          <button 
            class="option" 
            class:selected={selectedOptionIndex === index}
            class:correct={showFeedback && index === correctOptionIndex}
            class:incorrect={showFeedback && selectedOptionIndex === index && index !== correctOptionIndex}
            on:click={() => handleOptionSelect(index)}
            disabled={showFeedback}
          >
            <img src={option.image} alt={option.word} />
            <span>{option.word}</span>
          </button>
        {/each}
      </div>
      
      <!-- Feedback -->
      {#if showFeedback}
        <div class="feedback {feedbackType}">
          {feedback}
        </div>
      {/if}
    </main>
  {:else}
    <!-- Pantalla de finalización -->
    <div class="completion">
      <div class="trophy">🏆</div>
      <h2>{language === 'english' ? 'Great job!' : '¡Excelente trabajo!'}</h2>
      <p>
        {language === 'english' 
          ? 'You have completed the letter recognition activity.' 
          : 'Has completado la actividad de reconocimiento de letras.'}
      </p>
      
      <div class="score">
        <div class="stars">
          {#each Array(Math.ceil(score / totalExercises * 5)) as _, i}
            <span class="star">⭐</span>
          {/each}
        </div>
        <p class="score-text">
          {language === 'english' ? 'Score' : 'Puntuación'}: {Math.round(score / totalExercises * 100)}%
        </p>
      </div>
      
      <button class="continue-button" on:click={handleBack}>
        {language === 'english' ? 'Continue' : 'Continuar'}
      </button>
    </div>
  {/if}
</div>

<style>
  .letter-recognition {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: #f8f9fa;
    border-radius: 12px;
    overflow: hidden;
  }
  
  /* Encabezado */
  .header {
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
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0.5rem;
    transition: background-color 0.2s;
    border-radius: 4px;
  }
  
  .back-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .back-button span {
    margin-right: 5px;
  }
  
  .title {
    font-size: 1.5rem;
    margin: 0;
    text-align: center;
    flex-grow: 1;
  }
  
  .progress {
    position: relative;
    width: 120px;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .progress-bar {
    position: absolute;
    height: 100%;
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
  
  /* Contenido principal */
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 2rem;
    flex-grow: 1;
  }
  
  .letter-display {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.5s ease;
  }
  
  .letter {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  
  .uppercase {
    font-size: 6rem;
    font-weight: bold;
    color: #3a0ca3;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .lowercase {
    font-size: 5rem;
    color: #4361ee;
  }
  
  .sound-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    margin-left: 1rem;
    color: #4361ee;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .sound-button:hover {
    background-color: rgba(67, 97, 238, 0.1);
  }
  
  .word-display {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.5s ease 0.3s forwards;
    opacity: 0;
  }
  
  .word {
    font-size: 3rem;
    font-weight: bold;
    color: #4cc9f0;
    margin: 0;
  }
  
  .instruction {
    font-size: 1.2rem;
    color: #333;
    text-align: center;
    animation: fadeIn 0.5s ease 0.6s forwards;
    opacity: 0;
  }
  
  .options {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    width: 100%;
    flex-wrap: wrap;
    animation: fadeIn 0.5s ease 0.9s forwards;
    opacity: 0;
  }
  
  .option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 2px solid #ddd;
    border-radius: 12px;
    background-color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 150px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }
  
  .option:hover:not(:disabled) {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    border-color: #4361ee;
  }
  
  .option img {
    width: 100px;
    height: 100px;
    object-fit: contain;
    margin-bottom: 0.5rem;
  }
  
  .option span {
    font-weight: bold;
    color: #333;
  }
  
  .option.selected {
    border-color: #4361ee;
  }
  
  .option.correct {
    border-color: #38b000;
    background-color: rgba(56, 176, 0, 0.1);
  }
  
  .option.incorrect {
    border-color: #d90429;
    background-color: rgba(217, 4, 41, 0.1);
  }
  
  .feedback {
    font-size: 1.2rem;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    animation: pulse 1s ease-in-out;
    text-align: center;
  }
  
  .feedback.success {
    color: #38b000;
  }
  
  .feedback.error {
    color: #d90429;
  }
  
  /* Pantalla de finalización */
  .completion {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    flex-grow: 1;
    gap: 1.5rem;
    background: linear-gradient(135deg, #4cc9f0 0%, #3a0ca3 100%);
    color: white;
  }
  
  .trophy {
    font-size: 5rem;
    animation: bounce 1s ease infinite alternate;
  }
  
  .score {
    margin: 1.5rem 0;
  }
  
  .stars {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .star {
    animation: twinkle 1.5s ease infinite alternate;
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
  
  /* Animaciones */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
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
  
  /* Diseño responsive */
  @media (max-width: 640px) {
    .options {
      gap: 1rem;
    }
    
    .option {
      width: 120px;
      padding: 0.75rem;
    }
    
    .option img {
      width: 80px;
      height: 80px;
    }
    
    .option span {
      font-size: 0.9rem;
    }
    
    .uppercase {
      font-size: 4rem;
    }
    
    .lowercase {
      font-size: 3.5rem;
    }
    
    .word {
      font-size: 2rem;
    }
  }
</style>