<script>
  export let username = '';
  export let onLogin;
  
  let isLoading = false;
  
  async function handleSubmit() {
    isLoading = true;
    await onLogin();
    isLoading = false;
  }
</script>

<div class="welcome-container">
  <div class="welcome-card">
    <h1 class="welcome-title">Alphabet Journey</h1>
    <h2 class="welcome-subtitle">¡Explora el mundo de las letras!</h2>
    
    <div class="welcome-content">
      <p>Bienvenido a una aventura educativa donde podrás conocer el alfabeto 
      a través de islas temáticas, cada una dedicada a una letra. 
      Explora, aprende y construye tu propio ecosistema de conocimiento.</p>
      
      <form on:submit|preventDefault={handleSubmit} class="login-form">
        <div class="form-group">
          <label for="username">Nombre de Aventurero</label>
          <input 
            id="username" 
            type="text" 
            bind:value={username} 
            placeholder="Ingresa tu nombre" 
            required
            autocomplete="off"
          />
        </div>
        
        <button 
          type="submit" 
          class="login-button pulse" 
          disabled={isLoading}
        >
          {isLoading ? 'Cargando...' : '¡Comenzar Aventura!'}
        </button>
      </form>
    </div>
    
    <div class="welcome-features">
      <div class="feature">
        <div class="feature-icon">🏝️</div>
        <div class="feature-text">Explora Islas de Letras</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔊</div>
        <div class="feature-text">Aprende Pronunciación</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🌱</div>
        <div class="feature-text">Cultiva Conocimiento</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🎮</div>
        <div class="feature-text">Juegos Divertidos</div>
      </div>
    </div>
  </div>
</div>

<style>
  .welcome-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-image: url('/images/welcome-bg.jpg');
    background-size: cover;
    background-position: center;
    padding: 2rem;
  }
  
  .welcome-card {
    width: 100%;
    max-width: 600px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: var(--border-radius);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    padding: 2.5rem;
    text-align: center;
    animation: fadeIn 0.8s ease-out;
  }
  
  .welcome-title {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }
  
  .welcome-subtitle {
    color: var(--secondary);
    font-size: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .welcome-content {
    margin-bottom: 2rem;
  }
  
  .welcome-content p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    color: var(--text-light);
    line-height: 1.6;
  }
  
  .login-form {
    margin-top: 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }
  
  .form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--primary);
  }
  
  .login-button {
    width: 100%;
    font-size: 1.2rem;
    padding: 1rem;
    background: linear-gradient(45deg, var(--primary), var(--primary-dark));
    transition: all 0.3s ease;
  }
  
  .login-button:hover {
    background: linear-gradient(45deg, var(--primary-dark), var(--primary));
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(91, 72, 199, 0.3);
  }
  
  .welcome-features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 2.5rem;
  }
  
  .feature {
    flex: 1 1 40%;
    min-width: 120px;
    text-align: center;
    padding: 1rem;
    background-color: rgba(91, 72, 199, 0.05);
    border-radius: var(--border-radius);
    transition: all 0.3s ease;
  }
  
  .feature:hover {
    background-color: rgba(91, 72, 199, 0.1);
    transform: translateY(-5px);
  }
  
  .feature-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .feature-text {
    font-weight: 600;
    color: var(--primary);
  }
  
  @media (max-width: 768px) {
    .welcome-title {
      font-size: 2.5rem;
    }
    
    .welcome-subtitle {
      font-size: 1.2rem;
    }
    
    .welcome-card {
      padding: 1.5rem;
    }
  }
</style>