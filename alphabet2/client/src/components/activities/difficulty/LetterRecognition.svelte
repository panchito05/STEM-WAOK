<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { letterExamples } from '../../../config/activities.js';
  
  // Props
  export let letter; // La letra actual
  export let language = 'spanish'; // Idioma seleccionado (default: español)
  export let onComplete; // Callback para cuando se completa la actividad
  export let onBack; // Callback para volver al menú
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Estado local
  let currentLetter = letter || 'A';
  let letterData = null;
  let showAudio = false;
  let score = 0;
  let scoreTotal = 10; // Número total de interacciones para completar
  let scoreProgress = 0;
  let feedback = '';
  let feedbackClass = '';
  let answerState = 'waiting'; // waiting, correct, incorrect
  let letterShown = false;
  let wordShown = false;
  let imageShown = false;
  let letterAppearDelay = 800; // ms
  let wordAppearDelay = 1600; // ms
  let imageAppearDelay = 2400; // ms
  let completionMessage = '';
  let isActivityCompleted = false;
  let letterSound = null;
  let wordSound = null;
  let successSound = null;
  let errorSound = null;
  
  // Opciones para la actividad
  let imageOptions = [];
  let correctImageIndex = 0;
  let selectedOptionIndex = -1; // Índice de la opción seleccionada por el usuario
  
  // Lista de letras del alfabeto para ejercicios
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let letterIndex = 0;
  
  // Al montar el componente
  onMount(() => {
    // Inicializar sonidos
    try {
      letterSound = new Audio(); // Se asignará dinámicamente
      wordSound = new Audio(); // Se asignará dinámicamente
      successSound = new Audio('/sounds/success.mp3');
      errorSound = new Audio('/sounds/error.mp3');
    } catch (error) {
      console.error('Error al inicializar sonidos:', error);
    }
    
    // Crear una secuencia de letras para mostrar
    if (letter) {
      // Si se proporcionó una letra específica, empezamos por ella
      // y determinamos su índice en el alfabeto
      currentLetter = letter;
      letterIndex = alphabet.indexOf(letter);
      if (letterIndex === -1) letterIndex = 0;
    } else {
      // Si no, empezamos por la A
      currentLetter = 'A';
      letterIndex = 0;
    }
    
    // Inicializar datos de la letra
    updateLetterData();
    
    // Iniciar secuencia de animación
    startLearningSequence();
    
    // Limpieza al desmontar
    return () => {
      [letterSound, wordSound, successSound, errorSound].forEach(sound => {
        if (sound) {
          sound.pause();
          sound.currentTime = 0;
        }
      });
    };
  });
  
  // Actualizar datos cuando cambia la letra o idioma
  $: if (letter || language) {
    updateLetterData();
  }
  
  // Actualizar los datos de la letra actual
  function updateLetterData() {
    // Usar la letra actual para obtener los datos
    const letterToUse = currentLetter || letter;
    if (!letterToUse) return;
    
    // Obtener datos de la letra según el idioma
    if (letterExamples[language] && letterExamples[language][letterToUse]) {
      letterData = {
        uppercase: letterToUse,
        lowercase: letterToUse.toLowerCase(),
        word: letterExamples[language][letterToUse].word,
        imageUrl: letterExamples[language][letterToUse].imageUrl
      };
      
      // Generar opciones de imágenes (correcta e incorrecta)
      // Primero obtenemos todas las letras disponibles
      const allLetters = Object.keys(letterExamples[language]);
      // Filtramos para excluir la letra actual
      const otherLetters = allLetters.filter(l => l !== letterToUse);
      // Seleccionamos una letra aleatoria para la opción incorrecta
      const randomLetter = otherLetters[Math.floor(Math.random() * otherLetters.length)];
      
      // Generamos las dos opciones (correcta e incorrecta)
      imageOptions = [
        {
          letter: letterToUse,
          word: letterExamples[language][letterToUse].word,
          imageUrl: letterExamples[language][letterToUse].imageUrl,
          correct: true
        },
        {
          letter: randomLetter,
          word: letterExamples[language][randomLetter].word,
          imageUrl: letterExamples[language][randomLetter].imageUrl,
          correct: false
        }
      ];
      
      // Barajamos las opciones para que no siempre esté la correcta en el mismo lugar
      imageOptions = imageOptions.sort(() => Math.random() - 0.5);
      
      // Guardamos el índice de la opción correcta
      correctImageIndex = imageOptions.findIndex(opt => opt.correct);
      
    } else {
      // Fallback por si no existe el dato
      letterData = {
        uppercase: letterToUse,
        lowercase: letterToUse.toLowerCase(),
        word: language === 'english' ? 'Example' : 'Ejemplo',
        imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/question-mark_2753.png'
      };
      
      // Opciones fallback
      imageOptions = [
        {
          letter: letterToUse,
          word: language === 'english' ? 'Example' : 'Ejemplo',
          imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/question-mark_2753.png',
          correct: true
        },
        {
          letter: 'Z',
          word: language === 'english' ? 'Unknown' : 'Desconocido',
          imageUrl: 'https://em-content.zobj.net/thumbs/240/apple/354/question-mark_2753.png',
          correct: false
        }
      ];
      
      correctImageIndex = 0;
    }
  }
  
  // Iniciar la secuencia de aprendizaje
  function startLearningSequence() {
    // Resetear estados
    letterShown = false;
    wordShown = false;
    imageShown = false;
    answerState = 'waiting';
    selectedOptionIndex = -1;
    feedback = '';
    
    // Iniciar la secuencia con delays
    setTimeout(() => {
      letterShown = true;
      playLetterSound();
    }, letterAppearDelay);
    
    setTimeout(() => {
      wordShown = true;
    }, wordAppearDelay);
    
    setTimeout(() => {
      imageShown = true;
      showAudio = true;
    }, imageAppearDelay);
  }
  
  // Manejar la selección de una opción de imagen
  function handleOptionSelect(index) {
    if (answerState !== 'waiting') return; // No permitir cambios después de responder
    
    selectedOptionIndex = index;
    
    // Verificar si la respuesta es correcta
    const isCorrect = index === correctImageIndex;
    
    if (isCorrect) {
      // Respuesta correcta
      scoreProgress++;
      score++;
      feedback = language === 'english' ? 'Great job!' : '¡Excelente!';
      feedbackClass = 'positive';
      answerState = 'correct';
      
      // Reproducir sonido de éxito
      if (successSound) {
        successSound.play();
      }
    } else {
      // Respuesta incorrecta
      feedback = language === 'english' ? 'Try again!' : '¡Inténtalo de nuevo!';
      feedbackClass = 'negative';
      answerState = 'incorrect';
      
      // Reproducir sonido de error
      if (errorSound) {
        errorSound.play();
      }
    }
    
    // Esperar un momento y continuar al siguiente
    setTimeout(() => {
      if (isCorrect) {
        checkCompletion();
      } else {
        // Si es incorrecto, volvemos a intentar con la misma letra
        answerState = 'waiting';
        selectedOptionIndex = -1;
        feedback = '';
      }
    }, 2000);
  }
  
  // Reproducir el sonido de la letra
  function playLetterSound() {
    if (letterSound) {
      const utterance = new SpeechSynthesisUtterance(letterData.uppercase);
      utterance.lang = language === 'english' ? 'en-US' : 'es-ES';
      utterance.rate = 0.8; // Un poco más lento para claridad
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // Reproducir el sonido de la palabra
  function playWordSound() {
    if (wordSound) {
      const utterance = new SpeechSynthesisUtterance(letterData.word);
      utterance.lang = language === 'english' ? 'en-US' : 'es-ES';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // Manejar la respuesta del usuario (reconocimiento)
  function handleRecognition() {
    if (answerState !== 'waiting') return;
    
    // Incrementar el progreso
    scoreProgress++;
    score++;
    
    // Dar feedback positivo
    feedback = language === 'english' ? 'Great job!' : '¡Excelente!';
    feedbackClass = 'positive';
    answerState = 'correct';
    
    // Reproducir sonido de éxito
    if (successSound) {
      successSound.play();
    }
    
    // Comprobar si hemos completado la actividad
    checkCompletion();
  }
  
  // Comprobar si la actividad está completa
  function checkCompletion() {
    if (scoreProgress >= scoreTotal) {
      // Calcular puntuación final (0-1)
      const finalScore = score / scoreTotal;
      
      // Mostrar mensaje de finalización
      isActivityCompleted = true;
      completionMessage = language === 'english' 
        ? `You've completed the recognition activity!` 
        : `¡Has completado la actividad de reconocimiento!`;
      
      // Emitir evento de finalización
      dispatch('complete', {
        score: finalScore,
        activityId: 'letter-recognition'
      });
    } else {
      // Después de un breve delay, avanzar a la siguiente letra y comenzar nuevo ciclo
      setTimeout(() => {
        // Avanzar al siguiente índice en el alfabeto
        letterIndex = (letterIndex + 1) % alphabet.length;
        
        // Actualizar la letra actual
        currentLetter = alphabet[letterIndex];
        console.log(`Avanzando a la siguiente letra: ${currentLetter} (índice ${letterIndex})`);
        
        // Actualizar datos de la nueva letra
        updateLetterData();
        
        // Resetear estado y comenzar nuevo ciclo
        answerState = 'waiting';
        startLearningSequence();
      }, 2000);
    }
  }
  
  // Volver al menú
  function handleBack() {
    onBack();
  }
</script>

<div class="recognition-activity">
  <div class="activity-header">
    <button class="back-button" on:click={handleBack}>
      <span class="back-icon">←</span> 
      {language === 'english' ? 'Back' : 'Volver'}
    </button>
    
    <h1 class="activity-title">
      {language === 'english' ? 'Letter Recognition' : 'Reconocimiento de Letras'}
    </h1>
    
    <div class="progress-container">
      <div class="progress-bar" style="--progress: {(scoreProgress / scoreTotal) * 100}%"></div>
      <span class="progress-text">{scoreProgress}/{scoreTotal}</span>
    </div>
  </div>
  
  {#if !isActivityCompleted}
    <div class="recognition-content">
      <div class="letter-display {letterShown ? 'appear' : ''}">
        <div class="letter-pair">
          <span class="letter uppercase">{letterData?.uppercase}</span>
          <span class="letter lowercase">{letterData?.lowercase}</span>
        </div>
        
        {#if showAudio}
          <button class="sound-button" on:click={playLetterSound}>
            <span class="sound-icon">🔊</span>
          </button>
        {/if}
      </div>
      
      <div class="word-display {wordShown ? 'appear' : ''}">
        <span class="letter-word">{letterData?.word}</span>
        
        {#if showAudio}
          <button class="sound-button" on:click={playWordSound}>
            <span class="sound-icon">🔊</span>
          </button>
        {/if}
      </div>
      
      <div class="instruction-display {imageShown ? 'appear' : ''}">
        <p class="instruction-text">
          {language === 'english' ? 'Choose the image that represents this letter:' : 'Elige la imagen que representa esta letra:'}
        </p>
      </div>
      
      <div class="options-display {imageShown ? 'appear' : ''}">
        {#each imageOptions as option, index}
          <div 
            class="option-card"
            class:selected={answerState !== 'waiting' && index === correctImageIndex}
            class:incorrect={answerState !== 'waiting' && option.correct === false && index === selectedOptionIndex}
            on:click={() => handleOptionSelect(index)}
          >
            <img 
              src={option.imageUrl} 
              alt={option.word}
              class="option-image"
            />
            <div class="option-label">{option.word}</div>
          </div>
        {/each}
      </div>
      
      {#if imageShown && feedback}
        <div class="feedback {feedbackClass}">
          {feedback}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Pantalla de actividad completada -->
    <div class="completion-screen">
      <div class="completion-icon">🏆</div>
      <h2 class="completion-title">
        {language === 'english' ? 'Activity Completed!' : '¡Actividad Completada!'}
      </h2>
      <p class="completion-message">{completionMessage}</p>
      <div class="completion-score">
        <div class="stars">
          {#each Array(Math.round(score / scoreTotal * 5)) as _, i}
            <span class="star">⭐</span>
          {/each}
        </div>
        <p class="score-text">
          {language === 'english' ? 'Your score' : 'Tu puntuación'}: {Math.round(score / scoreTotal * 100)}%
        </p>
      </div>
      <button class="continue-button" on:click={handleBack}>
        {language === 'english' ? 'Continue' : 'Continuar'}
      </button>
    </div>
  {/if}
</div>

<style>
  .recognition-activity {
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
  
  .recognition-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    flex-grow: 1;
    gap: 2rem;
  }
  
  .letter-display,
  .word-display,
  .image-display,
  .instruction-display,
  .options-display {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  
  .letter-display.appear,
  .word-display.appear,
  .image-display.appear,
  .instruction-display.appear,
  .options-display.appear {
    opacity: 1;
    transform: translateY(0);
  }
  
  .instruction-display {
    width: 100%;
    text-align: center;
  }
  
  .instruction-text {
    font-size: 1.2rem;
    color: #333;
  }
  
  .options-display {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    width: 100%;
    flex-wrap: wrap;
    margin-top: 1rem;
  }
  
  .option-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 2px solid #ddd;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 150px;
    background-color: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 640px) {
    .options-display {
      gap: 1rem;
    }
    
    .option-card {
      width: 120px;
      padding: 0.75rem;
    }
    
    .option-image {
      width: 80px;
      height: 80px;
    }
    
    .option-label {
      font-size: 0.9rem;
    }
  }
  
  .option-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    border-color: #4361ee;
  }
  
  .option-card.selected {
    border-color: #4cc9f0;
    background-color: rgba(76, 201, 240, 0.1);
    transform: scale(1.05);
  }
  
  .option-card.incorrect {
    border-color: #ef476f;
    background-color: rgba(239, 71, 111, 0.1);
  }
  
  .option-image {
    width: 100px;
    height: 100px;
    object-fit: contain;
    margin-bottom: 0.5rem;
  }
  
  .option-label {
    font-weight: bold;
    color: #333;
    text-align: center;
  }
  
  .letter-pair {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  
  .letter {
    font-size: 6rem;
    font-weight: bold;
    color: #3a0ca3;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .lowercase {
    font-size: 5rem;
    color: #4361ee;
  }
  
  .letter-word {
    font-size: 3rem;
    font-weight: bold;
    color: #4cc9f0;
  }
  
  .letter-image {
    width: 120px;
    height: 120px;
    object-fit: contain;
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
  
  .interaction-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .recognition-button {
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
  
  .recognition-button:hover:not(.disabled) {
    background-color: #3a0ca3;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .recognition-button.disabled {
    opacity: 0.7;
    cursor: default;
  }
  
  .success-icon {
    margin-right: 0.5rem;
  }
  
  .feedback {
    font-size: 1.2rem;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    animation: pulse 1s ease-in-out;
  }
  
  .feedback.positive {
    color: #38b000;
  }
  
  .feedback.negative {
    color: #d90429;
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
    margin: 1.5rem 0;
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