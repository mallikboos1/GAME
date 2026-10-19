using UnityEngine;
using JungleEscape.Core;
using JungleEscape.Player;

namespace JungleEscape.Gameplay
{
    /// <summary>
    /// Scales player speed and obstacle density progressively as distance increases.
    /// </summary>
    public class DifficultyManager : MonoBehaviour
    {
        [SerializeField] private PlayerController playerController;
        [SerializeField] private float baseSpeed = 16f;
        [SerializeField] private float maxSpeed = 32f;
        [SerializeField] private float accelerationRate = 0.12f;

        private void Update()
        {
            if (GameManager.Instance.CurrentState != GameState.Playing || playerController == null) return;

            float distance = playerController.transform.position.z;
            float targetSpeed = Mathf.Min(maxSpeed, baseSpeed + (distance * (accelerationRate / 100f)));
            playerController.SetSpeed(targetSpeed);
        }

        public void ResetDifficulty()
        {
            if (playerController != null)
            {
                playerController.SetSpeed(baseSpeed);
            }
        }
    }
}
