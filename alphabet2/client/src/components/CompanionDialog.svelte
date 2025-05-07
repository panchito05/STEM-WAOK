<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let name = 'Alphabot';
  export let type = 'robot';
  export let dialogue = '';
  export let onDismiss;
  
  let dialogueElement;
  let textIndex = 0;
  let displayedText = '';
  let isTyping = false;
  let isTextComplete = false;
  let typingInterval;
  let typingSpeed = 30; // milisegundos por caracter
  
  // Animar el texto como si se estuviera escribiendo
  function typeText() {
    if (!dialogue) return;
    
    isTextComplete = false;
    isTyping = true;
    textIndex = 0;
    displayedText = '';
    
    clearInterval(typingInterval);
    
    typingInterval = setInterval(() => {
      if (textIndex < dialogue.length) {
        displayedText += dialogue[textIndex];
        textIndex++;
      } else {
        clearInterval(typingInterval);
        isTyping = false;
        isTextComplete = true;
      }
    }, typingSpeed);
  }
  
  // Completar el texto inmediatamente
  function completeText() {
    if (isTyping) {
      clearInterval(typingInterval);
      displayedText = dialogue;
      isTyping = false;
      isTextComplete = true;
    }
  }
  
  // Iniciar animación cuando el diálogo cambia
  $: if (dialogue) {
    typeText();
  }
  
  // Limpiar al desmontar
  onDestroy(() => {
    if (typingInterval) {
      clearInterval(typingInterval);
    }
  });
  
  // Obtener avatar según el tipo de compañero
  function getCompanionAvatar(type) {
    switch(type) {
      case 'robot': return '/images/companions/robot.png';
      case 'animal': return '/images/companions/animal.png';
      case 'teacher': return '/images/companions/teacher.png';
      default: return '/images/companions/robot.png';
    }
  }
</script>

<div class="companion-dialog">
  <div class="companion-avatar" style="background-image: url('{getCompanionAvatar(type)}')"></div>
  
  <div class="dialogue-container">
    <div class="dialogue-header">
      <div class="companion-name">{name}</div>
      <button class="dialogue-dismiss" on:click={onDismiss}>×</button>
    </div>
    
    <div class="dialogue-content" bind:this={dialogueElement} on:click={completeText}>
      <p>{displayedText}</p>
      {#if isTyping}
        <span class="typing-indicator">▋</span>
      {/if}
    </div>
    
    <div class="dialogue-actions">
      {#if isTextComplete}
        <button class="action-button continue" on:click={onDismiss}>Continuar</button>
      {:else}
        <button class="action-button skip" on:click={completeText}>Saltar</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .companion-dialog {
    position: fixed;
    bottom: 20px;
    left: 20px;
    display: flex;
    align-items: flex-end;
    z-index: 900;
    max-width: 90%;
    animation: slideUp 0.5s ease-out;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .companion-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: var(--secondary);
    background-size: cover;
    background-position: center;
    border: 3px solid white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    margin-right: -15px;
    z-index: 1;
  }
  
  .dialogue-container {
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
    width: 300px;
    max-width: calc(100% - 55px);
  }
  
  .dialogue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .companion-name {
    font-weight: 600;
    color: var(--primary);
  }
  
  .dialogue-dismiss {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--text-light);
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dialogue-dismiss:hover {
    color: var(--primary);
  }
  
  .dialogue-content {
    padding: 1rem;
    min-height: 80px;
    max-height: 200px;
    overflow-y: auto;
    cursor: pointer;
  }
  
  .dialogue-content p {
    margin: 0;
    line-height: 1.5;
  }
  
  .typing-indicator {
    display: inline-block;
    animation: blink 0.7s infinite;
    margin-left: 2px;
  }
  
  @keyframes blink {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  .dialogue-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem 1rem 1rem;
  }
  
  .action-button {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  
  .action-button.continue {
    background-color: var(--primary);
  }
  
  .action-button.skip {
    background-color: transparent;
    color: var(--primary);
  }
  
  @media (max-width: 768px) {
    .companion-dialog {
      bottom: 10px;
      left: 10px;
    }
    
    .companion-avatar {
      width: 50px;
      height: 50px;
    }
    
    .dialogue-container {
      width: 250px;
    }
    
    .dialogue-content {
      min-height: 60px;
      max-height: 150px;
    }
  }
</style>