using System;
using UnityEngine;
using JungleEscape.Player;
using JungleEscape.World;
using JungleEscape.Collectibles;
using JungleEscape.Gameplay;
using JungleEscape.Data;

namespace JungleEscape.Core
{
    /// <summary>
    /// Singleton GameManager coordinating state transitions and run lifecycle.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public GameState CurrentState { get; private set; } = GameState.Loading;

        public event Action<GameState> OnStateChanged;
        public event Action OnRunStarted;
        public event Action OnRunEnded;

        [Header("System References")]
        [SerializeField] private PlayerController playerController;
        [SerializeField] private TrackManager trackManager;
        [SerializeField] private ScoreManager scoreManager;
        [SerializeField] private DifficultyManager difficultyManager;
        [SerializeField] private CoinManager coinManager;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            SetState(GameState.MainMenu);
        }

        public void SetState(GameState newState)
        {
            if (CurrentState == newState) return;

            CurrentState = newState;

            switch (newState)
            {
                case GameState.Playing:
                    Time.timeScale = 1f;
                    break;
                case GameState.Paused:
                case GameState.GameOver:
                    Time.timeScale = 0f;
                    break;
            }

            OnStateChanged?.Invoke(newState);
        }

        public void StartRun()
        {
            scoreManager?.ResetRun();
            coinManager?.ResetRun();
            difficultyManager?.ResetDifficulty();
            trackManager?.ResetTrack();
            playerController?.ResetPosition();

            SetState(GameState.Countdown);
            OnRunStarted?.Invoke();

            // 1.5s countdown before playing
            Invoke(nameof(BeginActiveGameplay), 1.5f);
        }

        private void BeginActiveGameplay()
        {
            if (CurrentState == GameState.Countdown)
            {
                SetState(GameState.Playing);
            }
        }

        public void PauseGame()
        {
            if (CurrentState == GameState.Playing)
            {
                SetState(GameState.Paused);
            }
        }

        public void ResumeGame()
        {
            if (CurrentState == GameState.Paused)
            {
                SetState(GameState.Playing);
            }
        }

        public void TriggerGameOver()
        {
            if (CurrentState == GameState.GameOver) return;

            SetState(GameState.GameOver);
            OnRunEnded?.Invoke();

            if (scoreManager != null && coinManager != null)
            {
                SaveManager.Instance?.RecordCompletedRun(
                    scoreManager.CurrentScore,
                    (int)scoreManager.CurrentDistance,
                    coinManager.RunCoins
                );
            }
        }

        public void ReturnToMainMenu()
        {
            SetState(GameState.MainMenu);
            trackManager?.ResetTrack();
            playerController?.ResetPosition();
        }
    }
}
