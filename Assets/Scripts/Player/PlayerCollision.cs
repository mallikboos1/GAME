using UnityEngine;
using JungleEscape.Core;
using JungleEscape.PowerUps;

namespace JungleEscape.Player
{
    /// <summary>
    /// Handles collision envelopes between the player and obstacles, checking active shields.
    /// </summary>
    public class PlayerCollision : MonoBehaviour
    {
        [SerializeField] private PowerUpManager powerUpManager;

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Obstacle"))
            {
                if (powerUpManager != null && powerUpManager.IsSpeedBoostActive)
                {
                    // Blast through obstacle safely!
                    return;
                }

                if (powerUpManager != null && powerUpManager.IsShieldActive)
                {
                    // Shield absorbs impact
                    powerUpManager.ConsumeShield();
                    return;
                }

                // Fatal collision
                GameManager.Instance.TriggerGameOver();
            }
        }
    }
}
