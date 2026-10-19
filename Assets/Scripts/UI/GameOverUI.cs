using UnityEngine;
using UnityEngine.UI;
using JungleEscape.Core;
using JungleEscape.Gameplay;
using JungleEscape.Collectibles;

namespace JungleEscape.UI
{
    public class GameOverUI : MonoBehaviour
    {
        [SerializeField] private Text finalScoreText;
        [SerializeField] private Text finalDistanceText;
        [SerializeField] private Text finalCoinsText;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button mainMenuButton;

        private void Start()
        {
            retryButton?.onClick.AddListener(() => GameManager.Instance.StartRun());
            mainMenuButton?.onClick.AddListener(() => GameManager.Instance.ReturnToMainMenu());

            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnRunEnded += UpdateGameOverStats;
            }
        }

        private void UpdateGameOverStats()
        {
            if (finalScoreText && ScoreManager.Instance)
                finalScoreText.text = ScoreManager.Instance.CurrentScore.ToString();

            if (finalDistanceText && ScoreManager.Instance)
                finalDistanceText.text = $"{Mathf.FloorToInt(ScoreManager.Instance.CurrentDistance)} m";

            if (finalCoinsText && CoinManager.Instance)
                finalCoinsText.text = CoinManager.Instance.RunCoins.ToString();
        }
    }
}
