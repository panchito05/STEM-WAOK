<script>
  import { onMount } from 'svelte';
  import { message } from '../stores/uiStore.js';
  
  let timeoutId = null;
  let messageVisible = false;
  let currentMessage = null;
  
  // Suscribirse a cambios en el mensaje
  $: if ($message) {
    showMessage($message);
  }
  
  // Mostrar mensaje con duración
  function showMessage(msg) {
    // Limpiar timeout anterior si existe
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Guardar mensaje actual y mostrar
    currentMessage = msg;
    messageVisible = true;
    
    // Configurar timeout para ocultar el mensaje
    if (msg.duration) {
      timeoutId = setTimeout(() => {
        hideMessage();
      }, msg.duration);
    }
  }
  
  // Ocultar mensaje manualmente
  function hideMessage() {
    messageVisible = false;
    
    // Limpiar mensaje después de la animación
    setTimeout(() => {
      if (!messageVisible) {
        currentMessage = null;
        message.set(null);
      }
    }, 300);
  }
  
  // Limpiar timeout al desmontar
  onMount(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });
  
  // Obtener clase de tipo de mensaje
  function getMessageTypeClass(type) {
    switch(type) {
      case 'success': return 'message-success';
      case 'error': return 'message-error';
      case 'warning': return 'message-warning';
      case 'info': return 'message-info';
      default: return 'message-info';
    }
  }
  
  // Obtener icono de mensaje según tipo
  function getMessageIcon(type) {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  }
</script>

<!-- Overlay para mensajes -->
{#if messageVisible && currentMessage}
  <div 
    class="message-overlay {getMessageTypeClass(currentMessage.type)} {messageVisible ? 'visible' : 'hidden'}"
    on:click={hideMessage}
  >
    <div class="message-content">
      <div class="message-icon">{getMessageIcon(currentMessage.type)}</div>
      <div class="message-text">{currentMessage.text}</div>
      <button class="message-close" on:click|stopPropagation={hideMessage}>×</button>
    </div>
  </div>
{/if}

<style>
  .message-overlay {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    z-index: 1000;
    max-width: 90%;
    width: 400px;
    border-radius: var(--border-radius);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .message-overlay.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  
  .message-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius);
  }
  
  .message-icon {
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .message-text {
    flex: 1;
    font-weight: 500;
  }
  
  .message-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  
  .message-close:hover {
    opacity: 1;
  }
  
  /* Estilos según tipo de mensaje */
  .message-success .message-content {
    background-color: #e7f7ee;
    border-left: 4px solid var(--success);
    color: #2d6a4f;
  }
  
  .message-success .message-icon {
    color: var(--success);
  }
  
  .message-error .message-content {
    background-color: #fee8e7;
    border-left: 4px solid var(--error);
    color: #b71c1c;
  }
  
  .message-error .message-icon {
    color: var(--error);
  }
  
  .message-warning .message-content {
    background-color: #fff7e0;
    border-left: 4px solid var(--warning);
    color: #996400;
  }
  
  .message-warning .message-icon {
    color: var(--warning);
  }
  
  .message-info .message-content {
    background-color: #e5f2ff;
    border-left: 4px solid var(--info);
    color: #0a3977;
  }
  
  .message-info .message-icon {
    color: var(--info);
  }
</style>