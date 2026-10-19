using UnityEngine;
using UnityEngine.UI;
using JungleEscape.Core;
using JungleEscape.Gameplay;
using JungleEscape.Collectibles;

namespace JungleEscape.UI
{
    public class GameHUD : MonoBehaviour
    {
        [SerializeField] private Text scoreText;
        [SerializeField] private Text distanceText;
        [SerializeField] private Text coinsText;
        [SerializeField] private Button pauseButton;

        private void Start()
        {
            pauseButton?.onClick.AddListener(() => GameManager.Instance.PauseGame());

            if (ScoreManager.Instance != null)
            {
                ScoreManager.Instance.OnScoreUpdated += UpdateScoreDisplay;
            }

            if (CoinManager.Instance != null)
            {
                CoinManager.Instance.OnCoinsChanged += UpdateCoinDisplay;
            }
        }

        private void UpdateScoreDisplay(float distance, int score)
        {
            if (distanceText) distanceText.text = $"{Mathf.FloorToInt(distance)} m";
            if (scoreText) scoreText.text = score.ToString("D6");
        }

        private void UpdateCoinDisplay(int coins)
        {
            if (coinsText) coinsText.text = coins.ToString();
        }
    }
}
