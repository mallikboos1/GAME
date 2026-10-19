using UnityEngine;
using UnityEngine.UI;
using JungleEscape.Core;

namespace JungleEscape.UI
{
    public class PauseMenuUI : MonoBehaviour
    {
        [SerializeField] private Button resumeButton;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button mainMenuButton;

        private void Start()
        {
            resumeButton?.onClick.AddListener(() => GameManager.Instance.ResumeGame());
            restartButton?.onClick.AddListener(() => GameManager.Instance.StartRun());
            mainMenuButton?.onClick.AddListener(() => GameManager.Instance.ReturnToMainMenu());
        }
    }
}
