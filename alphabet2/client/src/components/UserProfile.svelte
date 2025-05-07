<script>
  import { user, achievements, userAccessories } from '../stores/userStore.js';
  import { inventory } from '../stores/worldStore.js';
  
  let showAchievements = false;
  
  // Manejar la visualización de logros
  function toggleAchievements() {
    showAchievements = !showAchievements;
  }
  
  // Obtener el nivel del usuario basado en letras descubiertas
  $: userLevel = $inventory.letters.length > 0 
    ? Math.max(1, Math.floor($inventory.letters.length / 3)) 
    : 1;
  
  // Calcular el progreso para el próximo nivel
  $: nextLevelProgress = $inventory.letters.length % 3 / 3 * 100;
</script>

<div class="user-profile">
  <div class="profile-main" on:click={toggleAchievements}>
    <div class="avatar" style="background-image: url('/images/avatars/{$userAccessories.avatar}.png')"></div>
    
    <div class="user-info">
      <h3 class="username">{$user?.username || 'Aventurero'}</h3>
      <div class="level-info">
        <span class="level-badge">Nivel {userLevel}</span>
        <div class="level-progress">
          <div class="level-bar" style="width: {nextLevelProgress}%"></div>
        </div>
      </div>
    </div>
    
    <div class="achievement-counter">
      <span class="medal-icon">🏅</span>
      <span class="medal-count">{$achievements.length}</span>
    </div>
  </div>
  
  {#if showAchievements}
    <div class="achievements-panel" transition:slide={{ duration: 300 }}>
      <h3 class="panel-title">Mis Logros</h3>
      
      {#if $achievements.length > 0}
        <div class="achievements-list">
          {#each $achievements as achievement}
            <div class="achievement-item">
              <div class="achievement-icon">
                {#if achievement.type === 'explorer'}
                  🌟
                {:else if achievement.type === 'master'}
                  🏆
                {:else}
                  🎖️
                {/if}
              </div>
              <div class="achievement-details">
                <div class="achievement-title">{achievement.message}</div>
                <div class="achievement-meta">Letra {achievement.letter}</div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="no-achievements">
          <p>¡Aún no has conseguido ningún logro! Explora islas y completa actividades para ganar logros.</p>
        </div>
      {/if}
      
      <button class="close-panel" on:click|stopPropagation={toggleAchievements}>Cerrar</button>
    </div>
  {/if}
</div>

<style>
  .user-profile {
    position: relative;
    margin-bottom: 1rem;
  }
  
  .profile-main {
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: var(--border-radius);
    padding: 0.75rem 1rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .profile-main:hover {
    transform: translateY(-2px);
  }
  
  .avatar {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background-color: var(--primary-light);
    background-size: cover;
    background-position: center;
    margin-right: 1rem;
    border: 2px solid var(--primary);
  }
  
  .user-info {
    flex: 1;
  }
  
  .username {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
  }
  
  .level-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .level-badge {
    background-color: var(--primary-light);
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
  }
  
  .level-progress {
    flex: 1;
    height: 6px;
    background-color: rgba(91, 72, 199, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .level-bar {
    height: 100%;
    background: linear-gradient(to right, var(--primary), var(--secondary));
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  .achievement-counter {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  
  .medal-icon {
    font-size: 1.2rem;
  }
  
  .medal-count {
    font-weight: 700;
    color: var(--primary);
  }
  
  .achievements-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }
  
  .panel-title {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--primary);
    text-align: center;
  }
  
  .achievements-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 1rem;
  }
  
  .achievement-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--border-radius);
    background-color: rgba(91, 72, 199, 0.05);
    transition: transform 0.2s ease;
  }
  
  .achievement-item:hover {
    transform: translateX(5px);
    background-color: rgba(91, 72, 199, 0.1);
  }
  
  .achievement-icon {
    font-size: 1.5rem;
  }
  
  .achievement-details {
    flex: 1;
  }
  
  .achievement-title {
    font-weight: 600;
  }
  
  .achievement-meta {
    font-size: 0.8rem;
    color: var(--text-light);
  }
  
  .no-achievements {
    text-align: center;
    padding: 2rem;
    color: var(--text-light);
  }
  
  .close-panel {
    width: 100%;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .avatar {
      width: 40px;
      height: 40px;
    }
    
    .username {
      font-size: 1rem;
    }
    
    .level-badge {
      font-size: 0.7rem;
    }
  }
</style>