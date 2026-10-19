using System;
using UnityEngine;
using JungleEscape.Core;
using JungleEscape.Collectibles;

namespace JungleEscape.Gameplay
{
    /// <summary>
    /// Computes run distance and overall score based on meters traveled and coins.
    /// </summary>
    public class ScoreManager : MonoBehaviour
    {
        public static ScoreManager Instance { get; private set; }

        public float CurrentDistance { get; private set; } = 0f;
        public int CurrentScore { get; private set; } = 0;

        public event Action<float, int> OnScoreUpdated;

        [SerializeField] private Transform playerTransform;
        [SerializeField] private int pointsPerMeter = 10;
        [SerializeField] private int pointsPerCoin = 50;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            if (GameManager.Instance.CurrentState != GameState.Playing) return;

            if (playerTransform != null)
            {
                CurrentDistance = Mathf.Max(0, playerTransform.position.z);
                int coins = CoinManager.Instance != null ? CoinManager.Instance.RunCoins : 0;
                CurrentScore = Mathf.FloorToInt(CurrentDistance * pointsPerMeter + coins * pointsPerCoin);

                OnScoreUpdated?.Invoke(CurrentDistance, CurrentScore);
            }
        }

        public void ResetRun()
        {
            CurrentDistance = 0f;
            CurrentScore = 0;
            OnScoreUpdated?.Invoke(CurrentDistance, CurrentScore);
        }
    }
}
