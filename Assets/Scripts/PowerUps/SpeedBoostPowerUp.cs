using UnityEngine;

namespace JungleEscape.PowerUps
{
    public class SpeedBoostPowerUp : MonoBehaviour
    {
        [SerializeField] private float duration = 8f;

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player"))
            {
                PowerUpManager.Instance?.ActivatePowerUp(PowerUpType.SpeedBoost, duration);
                gameObject.SetActive(false);
            }
        }
    }
}
