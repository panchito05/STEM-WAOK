<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  import { user, achievements } from './stores/userStore';
  import { currentIsland, ecosystemData } from './stores/worldStore';
  import { message } from './stores/uiStore';
  
  // Componentes
  import WorldMap from './components/WorldMap.svelte';
  import IslandView from './components/IslandView.svelte';
  import UserProfile from './components/UserProfile.svelte';
  import WelcomeScreen from './components/WelcomeScreen.svelte';
  import MessageOverlay from './components/MessageOverlay.svelte';
  import CompanionDialog from './components/CompanionDialog.svelte';
  
  // Estado de la app
  let username = '';
  let isLoggedIn = false;
  let isExploring = false;
  let socket;
  let companion = {
    name: 'Alphabot',
    type: 'robot',
    dialogue: 'Bienvenido a Alphabet Journey. ¡Vamos a explorar el mundo de las letras!',
    isVisible: true
  };
  
  // Sonidos del juego
  let sounds = {
    background: null,
    success: null,
    error: null,
    reward: null
  };
  
  // Conexión WebSocket
  function initSocket() {
    socket = io('http://localhost:5001');
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    socket.on('progress_updated', (data) => {
      console.log('Progress updated:', data);
      
      // Actualizar datos del ecosistema
      if ($user && data.user_id === $user.id && data.ecosystem) {
        ecosystemData.update(ecosystems => {
          ecosystems[data.letter] = data.ecosystem;
          return ecosystems;
        });
      }
      
      // Actualizar logros
      if ($user && data.user_id === $user.id && data.achievements && data.achievements.length > 0) {
        achievements.update(current => [...current, ...data.achievements]);
        
        // Mostrar mensaje de logro obtenido
        message.set({
          type: 'success',
          text: `¡Has obtenido ${data.achievements.length} nuevo(s) logro(s)!`,
          duration: 5000
        });
        
        // Reproducir sonido de recompensa
        if (sounds.reward) {
          sounds.reward.play();
        }
      }
    });
    
    socket.on('ecosystem_updated', (data) => {
      console.log('Ecosystem updated:', data);
      
      if ($user && data.user_id === $user.id && data.ecosystem) {
        ecosystemData.update(ecosystems => {
          ecosystems[data.letter] = data.ecosystem;
          return ecosystems;
        });
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      message.set({
        type: 'error',
        text: error.message || 'Ha ocurrido un error',
        duration: 5000
      });
    });
  }
  
  // Crear un usuario o iniciar sesión
  async function handleLogin() {
    if (!username.trim()) {
      message.set({
        type: 'error',
        text: 'Por favor ingresa un nombre de usuario',
        duration: 3000
      });
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          // El usuario ya existe, podríamos implementar un login real aquí
          message.set({
            type: 'info',
            text: 'Usuario ya existe. Iniciando sesión...',
            duration: 3000
          });
          // Simulación de inicio de sesión (en un sistema real haríamos autenticación)
          user.set({ id: 1, username: username });
        } else {
          throw new Error(data.error || 'Error al crear usuario');
        }
      } else {
        // Usuario creado exitosamente
        user.set(data);
        message.set({
          type: 'success',
          text: '¡Usuario creado exitosamente!',
          duration: 3000
        });
      }
      
      isLoggedIn = true;
      
      // Inicializar conexión WebSocket
      initSocket();
      
      // Inicializar datos del mundo
      initWorld();
      
    } catch (error) {
      console.error('Error en login:', error);
      message.set({
        type: 'error',
        text: error.message || 'Error al iniciar sesión',
        duration: 5000
      });
    }
  }
  
  // Inicializar datos del mundo
  function initWorld() {
    // Datos iniciales del mundo (en una aplicación real se cargarían del servidor)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    const worldData = letters.map(letter => ({
      id: letter,
      letter: letter,
      name: `Isla ${letter}`,
      position: {
        x: Math.random() * 80 + 10, // Posición X entre 10% y 90%
        y: Math.random() * 80 + 10  // Posición Y entre 10% y 90%
      },
      discovered: letter === 'A', // La primera isla siempre está descubierta
      activities: [
        { id: 'sound-mirror', name: 'Espejo de Sonidos', unlocked: true },
        { id: 'word-builder', name: 'Constructor de Palabras', unlocked: letter === 'A' },
        { id: 'difficulty-levels', name: 'Niveles de Dificultad', unlocked: true },
        { id: 'motion-recognition', name: 'Letra en Movimiento', unlocked: false },
        { id: 'interactive-story', name: 'Historia Interactiva', unlocked: false },
        { id: 'letter-arcade', name: 'Arcade de Letras', unlocked: false }
      ]
    }));
    
    // Actualizar tienda
    currentIsland.set(worldData[0]);
  }
  
  // Inicializar sonidos
  function initSounds() {
    sounds.background = new Audio('/sounds/background.mp3');
    sounds.success = new Audio('/sounds/success.mp3');
    sounds.error = new Audio('/sounds/error.mp3');
    sounds.reward = new Audio('/sounds/reward.mp3');
    
    // Configurar reproducción en bucle de la música de fondo
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
  }
  
  // Cargar recursos al montar el componente
  onMount(() => {
    try {
      initSounds();
    } catch (error) {
      console.error('Error al inicializar sonidos:', error);
    }
    
    // Comprobar si hay un usuario en localStorage (en una app real)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        user.set(userData);
        isLoggedIn = true;
        initSocket();
        initWorld();
      } catch (error) {
        console.error('Error al cargar usuario guardado:', error);
      }
    }
    
    return () => {
      // Limpiar recursos al desmontar
      if (socket) {
        socket.disconnect();
      }
      
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.pause();
          sound.currentTime = 0;
        }
      });
    };
  });
  
  // Cambiar vista a modo exploración de isla
  function handleExploreIsland(island) {
    currentIsland.set(island);
    isExploring = true;
    
    // Cambiar diálogo del compañero
    companion = {
      ...companion,
      dialogue: `¡Bienvenido a la Isla ${island.letter}! Aquí puedes explorar el mundo de la letra ${island.letter} a través de diferentes actividades.`,
      isVisible: true
    };
  }
  
  // Volver al mapa mundial
  function handleReturnToMap() {
    isExploring = false;
    
    // Cambiar diálogo del compañero
    companion = {
      ...companion,
      dialogue: '¿A qué isla te gustaría ir ahora? Haz clic en una isla para explorarla.',
      isVisible: true
    };
  }
  
  // Manejo de mensajes del compañero
  function dismissCompanion() {
    companion = {
      ...companion,
      isVisible: false
    };
  }
</script>

<main>
  {#if !isLoggedIn}
    <WelcomeScreen 
      bind:username 
      onLogin={handleLogin} 
    />
  {:else if isExploring}
    <IslandView 
      onReturn={handleReturnToMap} 
    />
  {:else}
    <div class="world-container">
      <UserProfile />
      <WorldMap 
        onExploreIsland={handleExploreIsland} 
      />
    </div>
  {/if}
  
  {#if companion.isVisible}
    <CompanionDialog 
      name={companion.name}
      type={companion.type}
      dialogue={companion.dialogue}
      onDismiss={dismissCompanion}
    />
  {/if}
  
  <MessageOverlay />
</main>

<style>
  main {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background-image: url('/images/background.jpg');
    background-size: cover;
    background-position: center;
  }
  
  .world-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
  }
</style>