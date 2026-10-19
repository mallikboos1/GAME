using UnityEngine;
using UnityEngine.UI;
using JungleEscape.Core;
using JungleEscape.Data;

namespace JungleEscape.UI
{
    public class MainMenuUI : MonoBehaviour
    {
        [SerializeField] private Button playButton;
        [SerializeField] private Text highScoreText;
        [SerializeField] private Text coinBalanceText;

        private void Start()
        {
            playButton?.onClick.AddListener(() => GameManager.Instance.StartRun());
            RefreshUI();
        }

        public void RefreshUI()
        {
            var save = SaveManager.Instance?.CurrentSave;
            if (save != null)
            {
                if (highScoreText) highScoreText.text = save.highScore.ToString("N0");
                if (coinBalanceText) coinBalanceText.text = save.totalCoins.ToString("N0");
            }
        }
    }
}
